package com.stringtinyst.healthlife.function;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.stringtinyst.healthlife.pojo.Body;
import com.stringtinyst.healthlife.pojo.Exer;
import com.stringtinyst.healthlife.pojo.PageBean;
import com.stringtinyst.healthlife.service.BodyService;
import com.stringtinyst.healthlife.service.ExerService;
import com.stringtinyst.healthlife.utils.FunctionResultCache;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Component;

/** 运动数据相关 AI 函数 */
@Slf4j
@Component
public class ExerciseFunctions extends BaseHealthFunctionModule {

  private static final List<String> VALID_EXERCISE_TYPES =
      Arrays.asList(
          "跑步", "游泳", "骑行", "徒步", "爬山", "跳绳", "篮球", "足球", "羽毛球", "乒乓球", "网球", "健身房训练", "瑜伽", "普拉提",
          "力量训练");

  private static final Map<String, Double> EXERCISE_MET_VALUES =
      Map.ofEntries(
          Map.entry("跑步", 9.8),
          Map.entry("游泳", 8.0),
          Map.entry("骑行", 6.8),
          Map.entry("徒步", 3.5),
          Map.entry("爬山", 7.0),
          Map.entry("跳绳", 11.0),
          Map.entry("篮球", 6.5),
          Map.entry("足球", 7.0),
          Map.entry("羽毛球", 5.5),
          Map.entry("乒乓球", 4.0),
          Map.entry("网球", 7.0),
          Map.entry("健身房训练", 5.0),
          Map.entry("瑜伽", 3.0),
          Map.entry("普拉提", 4.0),
          Map.entry("力量训练", 5.0));

  private static final double DEFAULT_WEIGHT_KG = 65.0;

  private final ExerService exerService;
  private final BodyService bodyService;

  public ExerciseFunctions(
      ExerService exerService, BodyService bodyService, FunctionResultCache resultCache) {
    super(resultCache);
    this.exerService = exerService;
    this.bodyService = bodyService;
  }

  /** 运动数据查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ExerciseQueryRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonPropertyDescription("开始日期 (格式: yyyy-MM-dd)")
    private String startDate;

    @JsonPropertyDescription("结束日期 (格式: yyyy-MM-dd)")
    private String endDate;

    @JsonPropertyDescription("运动类型（如：跑步、游泳、骑行等）")
    private String exerciseType;

    @JsonPropertyDescription("页码，默认 1")
    private Integer page = 1;

    @JsonPropertyDescription("每页大小，默认 10")
    private Integer pageSize = 10;
  }

  @Bean
  @Description("查询用户的运动记录")
  public Function<ExerciseQueryRequest, String> queryExerciseRecords() {
    return request ->
        runCachedQuery(
            "exercise.query",
            request.getUserID(),
            () ->
                exerService.page(
                    request.getPage(),
                    request.getPageSize(),
                    request.getUserID(),
                    parseDateOrNull(request.getStartDate()),
                    parseDateOrNull(request.getEndDate()),
                    request.getExerciseType()),
            pageBean -> "查询成功，共找到 " + pageBean.getTotal() + " 条运动记录。数据: " + pageBean.getRows(),
            "查询运动记录",
            request.getStartDate(),
            request.getEndDate(),
            request.getExerciseType(),
            request.getPage(),
            request.getPageSize());
  }

  /** 添加运动数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AddExerciseRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("运动类型，必须是以下之一：跑步、游泳、骑行、徒步、爬山、跳绳、篮球、足球、羽毛球、乒乓球、网球、健身房训练、瑜伽、普拉提、力量训练")
    private String exerciseType;

    @JsonProperty(required = true)
    @JsonPropertyDescription("运动时长（分钟），范围 1-600")
    private Integer durationMinutes;

    @JsonPropertyDescription("预估消耗卡路里（可选，如不提供将根据 MET 公式自动计算）")
    private Integer estimatedCaloriesBurned;
  }

  @Bean
  @Description("添加用户的运动记录。如果不提供消耗热量，系统将使用 MET 公式自动计算")
  public Function<AddExerciseRequest, String> addExerciseRecord() {
    return request -> {
      try {
        if (!VALID_EXERCISE_TYPES.contains(request.getExerciseType())) {
          return String.format(
              "错误：不支持的运动类型 '%s'。支持的运动类型有：%s",
              request.getExerciseType(), String.join("、", VALID_EXERCISE_TYPES));
        }

        Double userWeight = getUserLatestWeight(request.getUserID());
        boolean usingDefaultWeight = (userWeight == null);
        double weightForCalculation = usingDefaultWeight ? DEFAULT_WEIGHT_KG : userWeight;

        int calories;
        String calorieSource;
        if (request.getEstimatedCaloriesBurned() != null
            && request.getEstimatedCaloriesBurned() > 0) {
          calories = request.getEstimatedCaloriesBurned();
          calorieSource = "用户提供";
        } else {
          calories =
              calculateCaloriesByMET(
                  request.getExerciseType(), request.getDurationMinutes(), weightForCalculation);
          calorieSource =
              usingDefaultWeight
                  ? String.format("MET 公式计算（使用默认体重 %.1f kg）", DEFAULT_WEIGHT_KG)
                  : String.format("MET 公式计算（基于体重 %.1f kg）", userWeight);
        }

        Exer exer = new Exer();
        exer.setUserID(request.getUserID());
        exer.setRecordDate(parseRequiredDate(request.getRecordDate()));
        exer.setExerciseType(request.getExerciseType());
        exer.setDurationMinutes(request.getDurationMinutes());
        exer.setEstimatedCaloriesBurned(calories);

        exerService.addExer(exer);

        StringBuilder result = new StringBuilder();
        result.append(
            String.format(
                "成功添加运动记录！记录 ID: %d，运动: %s，时长: %d 分钟，消耗: %d kcal（%s）",
                exer.getExerciseItemID(),
                request.getExerciseType(),
                request.getDurationMinutes(),
                calories,
                calorieSource));

        if (usingDefaultWeight) {
          result.append("\n\n⚠️ 提示：您还没有记录身体数据，热量计算使用了默认体重 65 kg。");
          result.append("建议先记录您的身高体重数据，以获得更准确的热量消耗计算。");
        }

        resultCache.evictByPrefix(userCachePrefix("exercise.query", request.getUserID()));
        return result.toString();
      } catch (Exception e) {
        log.error("添加运动记录失败", e);
        return "添加运动记录失败: " + e.getMessage();
      }
    };
  }

  /** 更新运动数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateExerciseRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("运动记录 ID")
    private Integer exerciseItemID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("运动类型（如：跑步、游泳、骑行等）")
    private String exerciseType;

    @JsonProperty(required = true)
    @JsonPropertyDescription("运动时长（分钟），范围 1-600")
    private Integer durationMinutes;

    @JsonProperty(required = true)
    @JsonPropertyDescription("预估消耗卡路里（必须大于 0）")
    private Integer estimatedCaloriesBurned;
  }

  @Bean
  @Description("更新用户的运动记录，运动类型必须是系统支持的类型之一")
  public Function<UpdateExerciseRequest, String> updateExerciseRecord() {
    return request -> {
      try {
        if (!VALID_EXERCISE_TYPES.contains(request.getExerciseType())) {
          return String.format(
              "错误：不支持的运动类型 '%s'。支持的运动类型有：%s",
              request.getExerciseType(), String.join("、", VALID_EXERCISE_TYPES));
        }

        Exer exer = new Exer();
        exer.setExerciseItemID(request.getExerciseItemID());
        exer.setUserID(request.getUserID());
        exer.setRecordDate(parseRequiredDate(request.getRecordDate()));
        exer.setExerciseType(request.getExerciseType());
        exer.setDurationMinutes(request.getDurationMinutes());
        exer.setEstimatedCaloriesBurned(request.getEstimatedCaloriesBurned());

        exerService.updateExer(exer);

        resultCache.evictByPrefix(userCachePrefix("exercise.query", request.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("exercise.detail", request.getUserID()));
        return String.format(
            "成功更新运动记录 ID: %d，运动: %s，时长: %d 分钟，消耗: %d kcal",
            request.getExerciseItemID(),
            request.getExerciseType(),
            request.getDurationMinutes(),
            request.getEstimatedCaloriesBurned());
      } catch (Exception e) {
        log.error("更新运动记录失败", e);
        return "更新运动记录失败: " + e.getMessage();
      }
    };
  }

  /** 运动记录详情查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ExerciseDetailRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("运动记录 ID")
    private Integer exerciseItemID;

    @JsonPropertyDescription("用户 ID，可选")
    private String userID;
  }

  @Bean
  @Description("根据记录 ID 查询运动记录详情")
  public Function<ExerciseDetailRequest, String> getExerciseRecordDetail() {
    return request -> {
      String cacheKey =
          buildCacheKey("exercise.detail", request.getUserID(), request.getExerciseItemID());
      return resultCache.getOrCompute(
          cacheKey,
          () -> {
            try {
              Exer exer = exerService.getByExerItemID(request.getExerciseItemID());
              if (exer == null) {
                return String.format("未找到运动记录 ID: %d", request.getExerciseItemID());
              }
              if (request.getUserID() != null && !request.getUserID().equals(exer.getUserID())) {
                return "错误：该运动记录不属于指定用户";
              }
              return String.format(
                  "运动记录详情 - ID: %d，日期: %s，运动: %s，时长: %d 分钟，消耗: %d kcal",
                  exer.getExerciseItemID(),
                  exer.getRecordDate(),
                  exer.getExerciseType(),
                  exer.getDurationMinutes(),
                  exer.getEstimatedCaloriesBurned());
            } catch (Exception e) {
              log.error("查询运动记录详情失败", e);
              return "查询运动记录详情失败: " + e.getMessage();
            }
          });
    };
  }

  /** 删除运动记录请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DeleteExerciseRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("运动记录 ID")
    private Integer exerciseItemID;
  }

  @Bean
  @Description("删除指定的运动记录")
  public Function<DeleteExerciseRequest, String> deleteExerciseRecord() {
    return request -> {
      try {
        Exer existing = exerService.getByExerItemID(request.getExerciseItemID());
        if (existing == null) {
          return String.format("未找到运动记录 ID: %d", request.getExerciseItemID());
        }

        exerService.deleteExer(request.getExerciseItemID());
        resultCache.evictByPrefix(userCachePrefix("exercise.query", existing.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("exercise.detail", existing.getUserID()));
        return String.format(
            "成功删除运动记录 ID: %d，原运动类型: %s", request.getExerciseItemID(), existing.getExerciseType());
      } catch (Exception e) {
        log.error("删除运动记录失败", e);
        return "删除运动记录失败: " + e.getMessage();
      }
    };
  }

  private Double getUserLatestWeight(String userID) {
    try {
      PageBean pageBean = bodyService.page(1, 1, userID, null, null);
      if (pageBean.getRows() != null && !pageBean.getRows().isEmpty()) {
        Object firstRow = pageBean.getRows().get(0);
        if (firstRow instanceof Body body) {
          return body.getWeightKG().doubleValue();
        }
      }
    } catch (Exception e) {
      log.warn("获取用户体重失败: {}", e.getMessage());
    }
    return null;
  }

  private int calculateCaloriesByMET(String exerciseType, int durationMinutes, double weightKG) {
    double met = EXERCISE_MET_VALUES.getOrDefault(exerciseType, 5.0);
    double hours = durationMinutes / 60.0;
    return (int) Math.round(met * weightKG * hours);
  }
}
