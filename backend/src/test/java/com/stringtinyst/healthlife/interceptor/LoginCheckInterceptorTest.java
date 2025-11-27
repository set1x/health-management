package com.stringtinyst.healthlife.interceptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.stringtinyst.healthlife.pojo.Result;
import com.stringtinyst.healthlife.utils.JwtUtils;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class LoginCheckInterceptorTest {

  @Mock private JwtUtils jwtUtils;

  @InjectMocks private LoginCheckInterceptor interceptor;

  @Test
  void preHandleShouldRejectMissingToken() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRequestURI("/user/profile");
    MockHttpServletResponse response = new MockHttpServletResponse();

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isFalse();
    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    String body = response.getContentAsString(StandardCharsets.UTF_8);
    assertThat(body).contains(Result.error("未登录或登录已过期，请重新登录").getMsg());
  }

  @Test
  void preHandleShouldAllowAuthorizationHeader() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRequestURI("/user/profile");
    request.addHeader("Authorization", "Bearer valid-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(jwtUtils.parseJWT("valid-token")).thenReturn(null);

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isTrue();
  }

  @Test
  void preHandleShouldRejectWhenTokenInvalid() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRequestURI("/user/profile");
    request.addHeader("token", "invalid");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(jwtUtils.parseJWT("invalid")).thenThrow(new IllegalArgumentException("bad token"));

    boolean allowed = interceptor.preHandle(request, response, new Object());

    assertThat(allowed).isFalse();
    assertThat(response.getContentAsString(StandardCharsets.UTF_8)).contains("登录已过期");
  }
}
