package com.stringtinyst.healthlife.pojo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
  private String userID;
  private String email;

  @JsonIgnore private String passwordHash;
  private String nickname;
  private String gender;
  private LocalDate dateOfBirth;
  private LocalDate registrationDate;
}
