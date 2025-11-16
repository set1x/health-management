package com.stringtinyst.healthlife.pojo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Exercise item entity */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Exer {
  private int exerciseItemID;

  @NotBlank(message = "userID 不能为空")
  private String userID;

  @NotNull(message = "recordDate 不能为空")
  private LocalDate recordDate;

  @NotBlank(message = "exerciseType 不能为空")
  private String exerciseType;

  @Min(value = 1, message = "durationMinutes 应在 1-600 之间")
  @Max(value = 600, message = "durationMinutes 应在 1-600 之间")
  private int durationMinutes;

  @NotNull(message = "estimatedCaloriesBurned 不能为空")
  @Positive(message = "estimatedCaloriesBurned 必须大于 0")
  private Integer estimatedCaloriesBurned;
}
