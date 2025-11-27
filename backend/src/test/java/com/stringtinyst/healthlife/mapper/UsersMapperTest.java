package com.stringtinyst.healthlife.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.stringtinyst.healthlife.pojo.User;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.test.context.ActiveProfiles;

@MybatisTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = Replace.NONE)
class UsersMapperTest {

  @Autowired private UsersMapper usersMapper;

  @Test
  void insertUserShouldPersistAndAllowLookup() {
    User user = new User();
    user.setUserID("user-new");
    user.setEmail("new@example.com");
    user.setPasswordHash("salt$newhash");
    user.setNickname("Gamma");
    user.setGender("other");
    user.setDateOfBirth(LocalDate.parse("1995-03-03"));
    user.setRegistrationDate(LocalDate.parse("2024-03-03"));

    int before = usersMapper.countByEmail("new@example.com");
    assertThat(before).isZero();

    int rows = usersMapper.insertUser(user);

    assertThat(rows).isEqualTo(1);
    assertThat(usersMapper.countByEmail("new@example.com")).isEqualTo(1);

    User stored = usersMapper.getByEmail("new@example.com");
    assertThat(stored).isNotNull();
    assertThat(stored.getUserID()).isEqualTo("user-new");
  }

  @Test
  void updateUserShouldApplyOnlyProvidedColumns() {
    User existing = usersMapper.getByEmail("user1@example.com");
    existing.setNickname("Updated Nick");
    existing.setGender("other");
    existing.setPasswordHash("salt1$newhash");

    int rows = usersMapper.updateUser(existing);
    assertThat(rows).isEqualTo(1);

    User reloaded = usersMapper.getUser(existing.getUserID());
    assertThat(reloaded.getNickname()).isEqualTo("Updated Nick");
    assertThat(reloaded.getGender()).isEqualTo("other");
    assertThat(reloaded.getPasswordHash()).isEqualTo("salt1$newhash");
  }
}
