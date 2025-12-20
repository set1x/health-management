package com.stringtinyst.healthlife.function;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.stringtinyst.healthlife.pojo.Diet;
import com.stringtinyst.healthlife.service.DietService;
import com.stringtinyst.healthlife.utils.FunctionResultCache;
import java.util.function.Function;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Component;

/** 饮食数据相关 AI 函数 */
@Slf4j
@Component
public class DietFunctions extends BaseHealthFunctionModule {

  private final DietService dietService;

  public DietFunctions(DietService dietService, FunctionResultCache resultCache) {
    super(resultCache);
    this.dietService = dietService;
  }

  /** 饮食数据查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DietQueryRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonPropertyDescription("开始日期 (格式: yyyy-MM-dd)")
    private String startDate;

    @JsonPropertyDescription("结束日期 (格式: yyyy-MM-dd)")
    private String endDate;

    @JsonPropertyDescription("餐次类型（早餐、午餐、晚餐、加餐）")
    private String mealType;

    @JsonPropertyDescription("页码，默认 1")
    private Integer page = 1;

    @JsonPropertyDescription("每页大小，默认 10")
    private Integer pageSize = 10;
  }

  @Bean
  @Description("查询用户的饮食记录")
  public Function<DietQueryRequest, String> queryDietRecords() {
    return request ->
        runCachedQuery(
            "diet.query",
            request.getUserID(),
            () ->
                dietService.page(
                    request.getPage(),
                    request.getPageSize(),
                    request.getUserID(),
                    parseDateOrNull(request.getStartDate()),
                    parseDateOrNull(request.getEndDate()),
                    request.getMealType()),
            pageBean -> "查询成功，共找到 " + pageBean.getTotal() + " 条饮食记录。数据: " + pageBean.getRows(),
            "查询饮食记录",
            request.getStartDate(),
            request.getEndDate(),
            request.getMealType(),
            request.getPage(),
            request.getPageSize());
  }

  /** 添加饮食数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AddDietRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("食物名称")
    private String foodName;

    @JsonProperty(required = true)
    @JsonPropertyDescription("餐次类型（早餐、午餐、晚餐、加餐）")
    private String mealType;

    @JsonProperty(required = true)
    @JsonPropertyDescription("预估卡路里（必须大于 0）")
    private Integer estimatedCalories;
  }

  @Bean
  @Description("添加用户的饮食记录")
  public Function<AddDietRequest, String> addDietRecord() {
    return request -> {
      try {
        Diet diet = new Diet();
        diet.setUserID(request.getUserID());
        diet.setRecordDate(parseRequiredDate(request.getRecordDate()));
        diet.setFoodName(request.getFoodName());
        diet.setMealType(request.getMealType());
        diet.setEstimatedCalories(request.getEstimatedCalories());

        dietService.addDiet(diet);

        resultCache.evictByPrefix(userCachePrefix("diet.query", request.getUserID()));
        return String.format(
            "成功添加饮食记录！记录 ID: %d，食物: %s，餐次: %s，卡路里: %d kcal",
            diet.getDietItemID(),
            request.getFoodName(),
            request.getMealType(),
            request.getEstimatedCalories());
      } catch (Exception e) {
        log.error("添加饮食记录失败", e);
        return "添加饮食记录失败: " + e.getMessage();
      }
    };
  }

  /** 更新饮食数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateDietRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("饮食记录 ID")
    private Integer dietItemID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("食物名称")
    private String foodName;

    @JsonProperty(required = true)
    @JsonPropertyDescription("餐次类型（早餐、午餐、晚餐、加餐）")
    private String mealType;

    @JsonProperty(required = true)
    @JsonPropertyDescription("预估卡路里（必须大于 0）")
    private Integer estimatedCalories;
  }

  @Bean
  @Description("更新用户的饮食记录")
  public Function<UpdateDietRequest, String> updateDietRecord() {
    return request -> {
      try {
        Diet diet = new Diet();
        diet.setDietItemID(request.getDietItemID());
        diet.setUserID(request.getUserID());
        diet.setRecordDate(parseRequiredDate(request.getRecordDate()));
        diet.setFoodName(request.getFoodName());
        diet.setMealType(request.getMealType());
        diet.setEstimatedCalories(request.getEstimatedCalories());

        dietService.updateDiet(diet);

        resultCache.evictByPrefix(userCachePrefix("diet.query", request.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("diet.detail", request.getUserID()));
        return String.format(
            "成功更新饮食记录 ID: %d，食物: %s，餐次: %s，卡路里: %d kcal",
            request.getDietItemID(),
            request.getFoodName(),
            request.getMealType(),
            request.getEstimatedCalories());
      } catch (Exception e) {
        log.error("更新饮食记录失败", e);
        return "更新饮食记录失败: " + e.getMessage();
      }
    };
  }

  /** 饮食记录详情查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DietDetailRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("饮食记录 ID")
    private Integer dietItemID;

    @JsonPropertyDescription("用户 ID，可选")
    private String userID;
  }

  @Bean
  @Description("根据记录 ID 查询饮食记录详情")
  public Function<DietDetailRequest, String> getDietRecordDetail() {
    return request -> {
      String cacheKey = buildCacheKey("diet.detail", request.getUserID(), request.getDietItemID());
      return resultCache.getOrCompute(
          cacheKey,
          () -> {
            try {
              Diet diet = dietService.getByDietItemByID(request.getDietItemID());
              if (diet == null) {
                return String.format("未找到饮食记录 ID: %d", request.getDietItemID());
              }
              if (request.getUserID() != null && !request.getUserID().equals(diet.getUserID())) {
                return "错误：该饮食记录不属于指定用户";
              }
              return String.format(
                  "饮食记录详情 - ID: %d，日期: %s，餐次: %s，食物: %s，卡路里: %d kcal",
                  diet.getDietItemID(),
                  diet.getRecordDate(),
                  diet.getMealType(),
                  diet.getFoodName(),
                  diet.getEstimatedCalories());
            } catch (Exception e) {
              log.error("查询饮食记录详情失败", e);
              return "查询饮食记录详情失败: " + e.getMessage();
            }
          });
    };
  }

  /** 删除饮食记录请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DeleteDietRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("饮食记录 ID")
    private Integer dietItemID;
  }

  @Bean
  @Description("删除指定的饮食记录")
  public Function<DeleteDietRequest, String> deleteDietRecord() {
    return request -> {
      try {
        Diet existing = dietService.getByDietItemByID(request.getDietItemID());
        if (existing == null) {
          return String.format("未找到饮食记录 ID: %d", request.getDietItemID());
        }

        dietService.deleteDiet(request.getDietItemID());
        resultCache.evictByPrefix(userCachePrefix("diet.query", existing.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("diet.detail", existing.getUserID()));
        return String.format(
            "成功删除饮食记录 ID: %d，原餐次: %s", request.getDietItemID(), existing.getMealType());
      } catch (Exception e) {
        log.error("删除饮食记录失败", e);
        return "删除饮食记录失败: " + e.getMessage();
      }
    };
  }
}
