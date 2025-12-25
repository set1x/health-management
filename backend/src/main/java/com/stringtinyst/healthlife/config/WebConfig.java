package com.stringtinyst.healthlife.config;

import com.stringtinyst.healthlife.interceptor.LoginCheckInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

  private static final String[] AUTH_WHITELIST = {
    "/actuator/health",
    "/actuator/info",
    "/api/auth/login",
    "/api/auth/password/reset",
    "/api/auth/register",
    "/auth/login",
    "/auth/password/reset",
    "/auth/register",
    "/error"
  };

  private final LoginCheckInterceptor loginCheckInterceptor;

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(loginCheckInterceptor)
        .addPathPatterns("/**")
        .excludePathPatterns(AUTH_WHITELIST);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/**")
        .allowedOriginPatterns("*")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
  }
}
