package com.stringtinyst.healthlife.pojo;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Body metrics entity */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Body {
  private int bodyMetricID;

  @NotBlank(message = "userID 不能为空")
  private String userID;

  @NotNull(message = "heightCM 不能为空")
  @DecimalMin(value = "100.0", message = "身高应在 100-250 cm 之间")
  @DecimalMax(value = "250.0", message = "身高应在 100-250 cm 之间")
  private BigDecimal heightCM;

  @NotNull(message = "weightKG 不能为空")
  @DecimalMin(value = "30.0", message = "体重应在 30-300 kg 之间")
  @DecimalMax(value = "300.0", message = "体重应在 30-300 kg 之间")
  private BigDecimal weightKG;

  @NotNull(message = "recordDate 不能为空")
  private LocalDate recordDate;
}
