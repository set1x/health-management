package com.stringtinyst.healthlife.controller;

import com.stringtinyst.healthlife.pojo.Result;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Convert validation errors into unified Result responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public Result handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
    FieldError fieldError = ex.getBindingResult().getFieldError();
    String message = fieldError != null ? fieldError.getDefaultMessage() : "参数校验失败";
    return Result.error(message);
  }

  @ExceptionHandler(BindException.class)
  public Result handleBindException(BindException ex) {
    FieldError fieldError = ex.getFieldError();
    String message = fieldError != null ? fieldError.getDefaultMessage() : "参数绑定失败";
    return Result.error(message);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public Result handleConstraintViolation(ConstraintViolationException ex) {
    String message =
        ex.getConstraintViolations().stream()
            .findFirst()
            .map(violation -> violation.getMessage())
            .orElse("参数校验失败");
    return Result.error(message);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public Result handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
    return Result.error("请求体解析失败，请检查数据格式");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public Result handleIllegalArgument(IllegalArgumentException ex) {
    return Result.error(ex.getMessage());
  }
}
