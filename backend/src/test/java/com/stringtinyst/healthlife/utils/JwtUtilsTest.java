package com.stringtinyst.healthlife.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.Claims;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtUtilsTest {

  private JwtUtils createSubject(long expireMs) {
    JwtUtils jwtUtils = new JwtUtils();
    ReflectionTestUtils.setField(jwtUtils, "signKey", "unit-test-sign-key");
    ReflectionTestUtils.setField(jwtUtils, "expire", expireMs);
    return jwtUtils;
  }

  @Test
  void generateAndParseShouldRoundTripClaims() {
    JwtUtils jwtUtils = createSubject(60_000L);
    Map<String, Object> claims = new HashMap<>();
    claims.put("userID", "user-123");
    claims.put("email", "user@example.com");

    String token = jwtUtils.generateJwt(claims);

    Claims parsed = jwtUtils.parseJWT(token);
    assertThat(parsed.get("userID")).isEqualTo("user-123");
    assertThat(parsed.get("email")).isEqualTo("user@example.com");
  }

  @Test
  void parseShouldRejectBlankToken() {
    JwtUtils jwtUtils = createSubject(60_000L);

    assertThatThrownBy(() -> jwtUtils.parseJWT(""))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("token 不能为空");
  }

  @Test
  void parseShouldRejectMalformedToken() {
    JwtUtils jwtUtils = createSubject(60_000L);

    assertThatThrownBy(() -> jwtUtils.parseJWT("malformed.token"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("无效的 token");
  }
}
