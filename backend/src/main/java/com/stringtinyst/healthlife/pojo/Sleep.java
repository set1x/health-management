package com.stringtinyst.healthlife.pojo;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Sleep record entity */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sleep {
  private int sleepItemID;

  @NotBlank(message = "userID 不能为空")
  private String userID;

  @NotNull(message = "recordDate 不能为空")
  private LocalDate recordDate;

  private LocalDateTime bedTime;
  private LocalDateTime wakeTime;

  @AssertTrue(message = "bedTime 不能晚于 wakeTime")
  public boolean isBedTimeBeforeWakeTime() {
    if (bedTime == null || wakeTime == null) {
      return true;
    }
    return !bedTime.isAfter(wakeTime);
  }
}
