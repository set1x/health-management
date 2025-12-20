package com.stringtinyst.healthlife.pojo;

import lombok.Data;

@Data
public class PasswordResetRequest {
  private String nickname;
  private String email;
  private String newPassword;
  private String confirmPassword;
}
