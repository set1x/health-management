package com.stringtinyst.healthlife.function;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.stringtinyst.healthlife.pojo.Sleep;
import com.stringtinyst.healthlife.service.SleepService;
import com.stringtinyst.healthlife.utils.FunctionResultCache;
import java.time.LocalDateTime;
import java.util.function.Function;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Component;

/** 睡眠数据相关 AI 函数 */
@Slf4j
@Component
public class SleepFunctions extends BaseHealthFunctionModule {

  private final SleepService sleepService;

  public SleepFunctions(SleepService sleepService, FunctionResultCache resultCache) {
    super(resultCache);
    this.sleepService = sleepService;
  }

  /** 睡眠数据查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SleepQueryRequest {
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
  @Description("查询用户的睡眠记录")
  public Function<SleepQueryRequest, String> querySleepRecords() {
    return request ->
        runCachedQuery(
            "sleep.query",
            request.getUserID(),
            () ->
                sleepService.page(
                    request.getPage(),
                    request.getPageSize(),
                    request.getUserID(),
                    parseDateOrNull(request.getStartDate()),
                    parseDateOrNull(request.getEndDate())),
            pageBean -> "查询成功，共找到 " + pageBean.getTotal() + " 条睡眠记录。数据: " + pageBean.getRows(),
            "查询睡眠记录",
            request.getStartDate(),
            request.getEndDate(),
            request.getPage(),
            request.getPageSize());
  }

  /** 添加睡眠数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AddSleepRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("入睡时间 (格式: yyyy-MM-dd HH:mm:ss)")
    private String bedTime;

    @JsonProperty(required = true)
    @JsonPropertyDescription("起床时间 (格式: yyyy-MM-dd HH:mm:ss)")
    private String wakeTime;
  }

  @Bean
  @Description("添加用户的睡眠记录")
  public Function<AddSleepRequest, String> addSleepRecord() {
    return request -> {
      try {
        LocalDateTime bedTime = parseRequiredDateTime(request.getBedTime());
        LocalDateTime wakeTime = parseRequiredDateTime(request.getWakeTime());

        if (bedTime.isAfter(wakeTime)) {
          return "错误：入睡时间不能晚于起床时间";
        }

        Sleep sleep = new Sleep();
        sleep.setUserID(request.getUserID());
        sleep.setRecordDate(parseRequiredDate(request.getRecordDate()));
        sleep.setBedTime(bedTime);
        sleep.setWakeTime(wakeTime);

        sleepService.addSleep(sleep);

        double hoursDecimal = java.time.Duration.between(bedTime, wakeTime).toMinutes() / 60.0;

        resultCache.evictByPrefix(userCachePrefix("sleep.query", request.getUserID()));
        return String.format(
            "成功添加睡眠记录！记录 ID: %d，睡眠时长: %.1f 小时（建议 7-9 小时）", sleep.getSleepItemID(), hoursDecimal);
      } catch (Exception e) {
        log.error("添加睡眠记录失败", e);
        return "添加睡眠记录失败: " + e.getMessage();
      }
    };
  }

  /** 更新睡眠数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateSleepRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("睡眠记录 ID")
    private Integer sleepItemID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("用户 ID")
    private String userID;

    @JsonProperty(required = true)
    @JsonPropertyDescription("记录日期 (格式: yyyy-MM-dd)")
    private String recordDate;

    @JsonProperty(required = true)
    @JsonPropertyDescription("入睡时间 (格式: yyyy-MM-dd HH:mm:ss)")
    private String bedTime;

    @JsonProperty(required = true)
    @JsonPropertyDescription("起床时间 (格式: yyyy-MM-dd HH:mm:ss)")
    private String wakeTime;
  }

  @Bean
  @Description("更新用户的睡眠记录")
  public Function<UpdateSleepRequest, String> updateSleepRecord() {
    return request -> {
      try {
        LocalDateTime bedTime = parseRequiredDateTime(request.getBedTime());
        LocalDateTime wakeTime = parseRequiredDateTime(request.getWakeTime());

        if (bedTime.isAfter(wakeTime)) {
          return "错误：入睡时间不能晚于起床时间";
        }

        Sleep sleep = new Sleep();
        sleep.setSleepItemID(request.getSleepItemID());
        sleep.setUserID(request.getUserID());
        sleep.setRecordDate(parseRequiredDate(request.getRecordDate()));
        sleep.setBedTime(bedTime);
        sleep.setWakeTime(wakeTime);

        sleepService.updateSleep(sleep);

        double hoursDecimal = java.time.Duration.between(bedTime, wakeTime).toMinutes() / 60.0;

        resultCache.evictByPrefix(userCachePrefix("sleep.query", request.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("sleep.detail", request.getUserID()));
        return String.format(
            "成功更新睡眠记录 ID: %d，新的睡眠时长: %.1f 小时", request.getSleepItemID(), hoursDecimal);
      } catch (Exception e) {
        log.error("更新睡眠记录失败", e);
        return "更新睡眠记录失败: " + e.getMessage();
      }
    };
  }

  /** 睡眠记录详情查询请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SleepDetailRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("睡眠记录 ID")
    private Integer sleepItemID;

    @JsonPropertyDescription("用户 ID，可选")
    private String userID;
  }

  @Bean
  @Description("根据记录 ID 查询睡眠记录详情")
  public Function<SleepDetailRequest, String> getSleepRecordDetail() {
    return request -> {
      String cacheKey =
          buildCacheKey("sleep.detail", request.getUserID(), request.getSleepItemID());
      return resultCache.getOrCompute(
          cacheKey,
          () -> {
            try {
              Sleep sleep = sleepService.getBySleepItemID(request.getSleepItemID());
              if (sleep == null) {
                return String.format("未找到睡眠记录 ID: %d", request.getSleepItemID());
              }
              if (request.getUserID() != null && !request.getUserID().equals(sleep.getUserID())) {
                return "错误：该睡眠记录不属于指定用户";
              }
              double hoursDecimal =
                  java.time.Duration.between(sleep.getBedTime(), sleep.getWakeTime()).toMinutes()
                      / 60.0;
              return String.format(
                  "睡眠记录详情 - ID: %d，日期: %s，入睡: %s，起床: %s，时长: %.1f 小时",
                  sleep.getSleepItemID(),
                  sleep.getRecordDate(),
                  sleep.getBedTime(),
                  sleep.getWakeTime(),
                  hoursDecimal);
            } catch (Exception e) {
              log.error("查询睡眠记录详情失败", e);
              return "查询睡眠记录详情失败: " + e.getMessage();
            }
          });
    };
  }

  /** 删除睡眠数据请求 */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DeleteSleepRequest {
    @JsonProperty(required = true)
    @JsonPropertyDescription("睡眠记录 ID")
    private Integer sleepItemID;
  }

  @Bean
  @Description("删除指定的睡眠记录")
  public Function<DeleteSleepRequest, String> deleteSleepRecord() {
    return request -> {
      try {
        Sleep existing = sleepService.getBySleepItemID(request.getSleepItemID());
        if (existing == null) {
          return String.format("未找到睡眠记录 ID: %d", request.getSleepItemID());
        }

        sleepService.deleteSleep(request.getSleepItemID());
        resultCache.evictByPrefix(userCachePrefix("sleep.query", existing.getUserID()));
        resultCache.evictByPrefix(userCachePrefix("sleep.detail", existing.getUserID()));
        return String.format(
            "成功删除睡眠记录 ID: %d，原日期: %s", request.getSleepItemID(), existing.getRecordDate());
      } catch (Exception e) {
        log.error("删除睡眠记录失败", e);
        return "删除睡眠记录失败: " + e.getMessage();
      }
    };
  }
}
