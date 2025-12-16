package com.stringtinyst.healthlife.function;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.stringtinyst.healthlife.pojo.Body;
import com.stringtinyst.healthlife.service.BodyService;
import com.stringtinyst.healthlife.utils.FunctionResultCache;
import java.math.BigDecimal;
import java.util.function.Function;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Component;

/** 身体数据相关 AI 函数 */
@Slf4j
@Component
public class BodyFunctions extends BaseHealthFunctionModule {

  private final BodyService bodyService;

  public BodyFunctions(BodyService bodyService, FunctionResultCache resultCache) {
    super(resultCache);
    this.bodyService = bodyService;
  }

  /** 身体数据查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class BodyQueryRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonPropertyDescription("开始日期 (格式: yyyy-MM-dd)")
    private String startDate;

    @JsonPropertyDescription("结束日期 (格式: yyyy-MM-dd)")
    private String endDate;

    @JsonPropertyDescription("页码，默认 1")
    private Integer page = 1;

    @JsonPropertyDescription("每页大小，默认 10")
    private Integer pageSize = 10;
  }

  @Bean
  @Description("查询用户的身体数据（身高、体重）记录")
  public Function<BodyQueryRequest, String> queryBodyMetrics() {
    return request ->
        runCachedQuery(
            "body.query",
            request.getUserID(),
            () ->
                bodyService.page(
                    request.getPage(),
                    request.getPageSize(),
                    request.getUserID(),
                    parseDateOrNull(request.getStartDate()),
                    parseDateOrNull(request.getEndDate())),
            pageBean -> "查询成功，共找到 " + pageBean.getTotal() + " 条身体数据记录。数据: " + pageBean.getRows(),
            "查询身体数据",
            request.getStartDate(),
            request.getEndDate(),
            request.getPage(),
            request.getPageSize());
  }

  /** 添加身体数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AddBodyRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("身高（厘米），范围 100-250")
    private Double heightCM;

    @JsonProperty(required = true)
    @JsonPropertyDescription("体重（千克），范围 30-300")
    private Double weightKG;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;
  }

  @Bean
  @Description("添加用户的身体数据记录（身高、体重）")
  public Function<AddBodyRequest, String> addBodyMetric() {
    return request -> {
      try {
        Body body = new Body();
        body.setUserID(request.getUserID());
        body.setHeightCM(BigDecimal.valueOf(request.getHeightCM()));
        body.setWeightKG(BigDecimal.valueOf(request.getWeightKG()));
        body.setRecordDate(parseRequiredDate(request.getRecordDate()));

        bodyService.addBody(body);

        double bmi = calculateBMI(request.getHeightCM(), request.getWeightKG());
        resultCache.evictByPrefix(userCachePrefix("body.query", request.getUserID()));
        return String.format(
            "成功添加身体数据！记录 ID: %d，BMI: %.2f（正常范围 18.5-23.9）", body.getBodyMetricID(), bmi);
      } catch (Exception e) {
        log.error("添加身体数据失败", e);
        return "添加身体数据失败: " + e.getMessage();
      }
    };
  }

  /** 身体数据详情查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class BodyDetailRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("身体记录 ID")
    private Integer bodyMetricID;

    @JsonPropertyDescription("用户 ID，可选，用于校验记录归属")
    private String userID;
  }

  @Bean
  @Description("根据记录 ID 查询单条身体数据详情")
  public Function<BodyDetailRequest, String> getBodyMetricDetail() {
    return request -> {
      String cacheKey =
          buildCacheKey("body.detail", request.getUserID(), request.getBodyMetricID());
      return resultCache.getOrCompute(
          cacheKey,
          () -> {
            try {
              Body body = bodyService.getByBodyID(request.getBodyMetricID());
              if (body == null) {
                return String.format("未找到身体记录 ID: %d", request.getBodyMetricID());
              }
              if (request.getUserID() != null && !request.getUserID().equals(body.getUserID())) {
                return "错误：该身体记录不属于指定用户";
              }
              double bmi =
                  calculateBMI(body.getHeightCM().doubleValue(), body.getWeightKG().doubleValue());
              return String.format(
                  "身体记录详情 - ID: %d，日期: %s，身高: %.2f cm，体重: %.2f kg，BMI: %.2f",
                  body.getBodyMetricID(),
                  body.getRecordDate(),
                  body.getHeightCM().doubleValue(),
                  body.getWeightKG().doubleValue(),
                  bmi);
            } catch (Exception e) {
              log.error("查询身体记录详情失败", e);
              return "查询身体记录详情失败: " + e.getMessage();
            }
          });
    };
  }

  /** 更新身体数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateBodyRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("身体记录 ID")
    private Integer bodyMetricID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("身高（厘米），范围 100-250")
    private Double heightCM;

    @JsonProperty(required = true)
    @JsonPropertyDescription("体重（千克），范围 30-300")
    private Double weightKG;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;
  }

  @Bean
  @Description("更新用户的身体数据记录")
  public Function<UpdateBodyRequest, String> updateBodyMetric() {
    return request -> {
      try {
        Body existing = bodyService.getByBodyID(request.getBodyMetricID());
        if (existing == null) {
          return String.format("未找到身体记录 ID: %d", request.getBodyMetricID());
        }
        if (!existing.getUserID().equals(request.getUserID())) {
          return "错误：该身体记录不属于指定用户";
        }

        Body body = new Body();
        body.setBodyMetricID(request.getBodyMetricID());
        body.setUserID(request.getUserID());
        body.setHeightCM(BigDecimal.valueOf(request.getHeightCM()));
        body.setWeightKG(BigDecimal.valueOf(request.getWeightKG()));
        body.setRecordDate(parseRequiredDate(request.getRecordDate()));

        bodyService.updateBody(body);

        double bmi = calculateBMI(request.getHeightCM(), request.getWeightKG());
        resultCache.evictByPrefix(userCachePrefix("body.query", request.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("body.detail", request.getUserID()));
        return String.format("成功更新身体记录 ID: %d，新的 BMI: %.2f", request.getBodyMetricID(), bmi);
      } catch (Exception e) {
        log.error("更新身体数据失败", e);
        return "更新身体数据失败: " + e.getMessage();
      }
    };
  }

  /** 删除身体数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DeleteBodyRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("身体记录 ID")
    private Integer bodyMetricID;
  }

  @Bean
  @Description("删除指定的身体数据记录")
  public Function<DeleteBodyRequest, String> deleteBodyMetric() {
    return request -> {
      try {
        Body existing = bodyService.getByBodyID(request.getBodyMetricID());
        if (existing == null) {
          return String.format("未找到身体记录 ID: %d", request.getBodyMetricID());
        }

        bodyService.deleteBody(request.getBodyMetricID());
        resultCache.evictByPrefix(userCachePrefix("body.query", existing.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("body.detail", existing.getUserID()));
        return String.format(
            "成功删除身体记录 ID: %d，原记录日期: %s", request.getBodyMetricID(), existing.getRecordDate());
      } catch (Exception e) {
        log.error("删除身体数据失败", e);
        return "删除身体数据失败: " + e.getMessage();
      }
    };
  }
}
