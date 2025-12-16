package com.stringtinyst.healthlife.utils;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PasswordEncoderTest {

  @Test
  void encodeShouldProduceSaltAndHash() {
    String encoded = PasswordEncoder.encode("s3cr3t");

    String[] parts = encoded.split("\\$");
    assertThat(parts).hasSize(2);
    assertThat(parts[0]).isNotBlank();
    assertThat(parts[1]).isNotBlank();
  }

  @Test
  void matchesShouldReturnTrueForValidPassword() {
    String encoded = PasswordEncoder.encode("s3cr3t");

    assertThat(PasswordEncoder.matches("s3cr3t", encoded)).isTrue();
  }

  @Test
  void matchesShouldReturnFalseForWrongPassword() {
    String encoded = PasswordEncoder.encode("s3cr3t");

    assertThat(PasswordEncoder.matches("another", encoded)).isFalse();
  }

  @Test
  void matchesShouldReturnFalseForMalformedStorage() {
    assertThat(PasswordEncoder.matches("anything", "broken"))
        .as("storage format must be salt$hash")
        .isFalse();
  }
}
