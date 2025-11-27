package com.stringtinyst.healthlife.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stringtinyst.healthlife.mapper.UsersMapper;
import com.stringtinyst.healthlife.pojo.User;
import com.stringtinyst.healthlife.utils.PasswordEncoder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

  @Mock private UsersMapper usersMapper;

  @InjectMocks private UserServiceImpl userService;

  @Test
  void registerUserShouldEncodePasswordWhenEmailIsFree() {
    User user = new User();
    user.setEmail("user@example.com");
    user.setPasswordHash("plain");

    when(usersMapper.countByEmail("user@example.com")).thenReturn(0);
    when(usersMapper.insertUser(any())).thenReturn(1);

    boolean saved = userService.registerUser(user);

    assertThat(saved).isTrue();
    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(usersMapper).insertUser(captor.capture());
    assertThat(captor.getValue().getPasswordHash()).isNotEqualTo("plain").contains("$");
  }

  @Test
  void registerUserShouldFailWhenEmailExists() {
    User user = new User();
    user.setEmail("user@example.com");

    when(usersMapper.countByEmail("user@example.com")).thenReturn(1);

    boolean saved = userService.registerUser(user);

    assertThat(saved).isFalse();
  }

  @Test
  void loginUserShouldThrowWhenUserMissing() {
    User request = new User();
    request.setEmail("missing@example.com");

    when(usersMapper.getByEmail("missing@example.com")).thenReturn(null);

    assertThatThrownBy(() -> userService.loginUser(request))
        .isInstanceOf(RuntimeException.class)
        .hasMessage("USER_NOT_FOUND");
  }

  @Test
  void loginUserShouldThrowWhenPasswordMismatch() {
    User request = new User();
    request.setEmail("user@example.com");
    request.setPasswordHash("wrong");

    User stored = new User();
    stored.setUserID("user-1");
    stored.setEmail("user@example.com");
    stored.setPasswordHash(PasswordEncoder.encode("secret"));

    when(usersMapper.getByEmail("user@example.com")).thenReturn(stored);

    assertThatThrownBy(() -> userService.loginUser(request))
        .isInstanceOf(RuntimeException.class)
        .hasMessage("PASSWORD_INCORRECT");
  }

  @Test
  void loginUserShouldReturnIdWhenPasswordMatches() {
    User request = new User();
    request.setEmail("user@example.com");
    request.setPasswordHash("secret");

    User stored = new User();
    stored.setUserID("user-1");
    stored.setEmail("user@example.com");
    stored.setPasswordHash(PasswordEncoder.encode("secret"));

    when(usersMapper.getByEmail("user@example.com")).thenReturn(stored);

    String result = userService.loginUser(request);

    assertThat(result).isEqualTo("user-1");
  }
}
