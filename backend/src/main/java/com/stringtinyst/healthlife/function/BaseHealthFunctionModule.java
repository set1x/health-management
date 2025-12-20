package com.stringtinyst.healthlife.function;

import com.stringtinyst.healthlife.pojo.PageBean;
import com.stringtinyst.healthlife.utils.FunctionResultCache;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;

/** 共用的 AI 函数工具基类，封装缓存键、日期解析等逻辑 */
@Slf4j
abstract class BaseHealthFunctionModule {

  protected static final DateTimeFormatter DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd");
  protected static final DateTimeFormatter DATE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  protected final FunctionResultCache resultCache;

  protected BaseHealthFunctionModule(FunctionResultCache resultCache) {
    this.resultCache = resultCache;
  }

  @FunctionalInterface
  protected interface PageSupplier<T> {
    PageBean<T> get() throws Exception;
  }

  protected String buildCacheKey(String domain, String userID, Object... parts) {
    String safeUser = userID == null ? "anonymous" : userID;
    StringBuilder key = new StringBuilder(domain).append(":").append(safeUser);
    if (parts != null) {
      for (Object part : parts) {
        key.append(":").append(part == null ? "null" : part);
      }
    }
    return key.toString();
  }

  protected String userCachePrefix(String domain, String userID) {
    return domain + ":" + (userID == null ? "anonymous" : userID);
  }

  protected LocalDate parseDateOrNull(String value) {
    return (value == null || value.isBlank()) ? null : LocalDate.parse(value, DATE_FORMATTER);
  }

  protected LocalDate parseRequiredDate(String value) {
    return LocalDate.parse(value, DATE_FORMATTER);
  }

  protected LocalDateTime parseRequiredDateTime(String value) {
    return LocalDateTime.parse(value, DATE_TIME_FORMATTER);
  }

  protected double calculateBMI(double heightCM, double weightKG) {
    double heightMeter = heightCM / 100.0;
    if (heightMeter <= 0) {
      return 0.0;
    }
    return weightKG / (heightMeter * heightMeter);
  }

  protected <T> String runCachedQuery(
      String domain,
      String userID,
      PageSupplier<T> supplier,
      Function<PageBean<T>, String> successFormatter,
      String logLabel,
      Object... cacheParts) {
    String cacheKey = buildCacheKey(domain, userID, cacheParts);
    return resultCache.getOrCompute(
        cacheKey,
        () -> {
          try {
            PageBean<T> pageBean = supplier.get();
            return successFormatter.apply(pageBean);
          } catch (Exception e) {
            log.error("{}失败", logLabel, e);
            return logLabel + "失败: " + e.getMessage();
          }
        });
  }
}
