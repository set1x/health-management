package com.stringtinyst.healthlife.pojo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Diet {
  private int dietItemID;

  @NotBlank(message = "userID 不能为空")
  private String userID;

  @NotNull(message = "recordDate 不能为空")
  private LocalDate recordDate;

  @NotBlank(message = "foodName 不能为空")
  private String foodName;

  @NotBlank(message = "mealType 不能为空")
  private String mealType;

  @NotNull(message = "estimatedCalories 不能为空")
  @Positive(message = "estimatedCalories 必须大于 0")
  private Integer estimatedCalories;
}
