package com.stringtinyst.healthlife.controller;

import com.stringtinyst.healthlife.pojo.Exer;
import com.stringtinyst.healthlife.pojo.PageBean;
import com.stringtinyst.healthlife.pojo.Result;
import com.stringtinyst.healthlife.service.ExerService;
import com.stringtinyst.healthlife.utils.CsvUtils;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/exercise-items")
public class ExerController {
  @Autowired private ExerService exerService;

  @GetMapping
  public Result page(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
      @RequestParam(required = false) String exerciseType) {
    PageBean<Exer> pageBean =
        exerService.page(page, pageSize, userID, startDate, endDate, exerciseType);
    return Result.success(pageBean);
  }

  @GetMapping("/export")
  public void export(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
      @RequestParam(required = false) String exerciseType,
      HttpServletResponse response)
      throws IOException {
    PageBean<Exer> pageBean =
        exerService.page(page, pageSize, userID, startDate, endDate, exerciseType);
    List<Exer> list = pageBean.getRows();

    String[] headers = {
      "ID", "User ID", "Record Date", "Exercise Type", "Duration (min)", "Calories Burned"
    };
    CsvUtils.exportCsv(
        response,
        "exercise-items.csv",
        headers,
        list,
        item ->
            Arrays.asList(
                item.getExerciseItemID(),
                item.getUserID(),
                item.getRecordDate(),
                item.getExerciseType(),
                item.getDurationMinutes(),
                item.getEstimatedCaloriesBurned()));
  }

  @GetMapping("/{exerciseItemID}")
  public Result getExerciseItem(@PathVariable int exerciseItemID) {
    Exer exer = exerService.getByExerItemID(exerciseItemID);
    return Result.success(exer);
  }

  @PostMapping
  public Result addExer(@Valid @RequestBody Exer exer) {
    exerService.addExer(exer);
    return Result.success(exer.getExerciseItemID());
  }

  @PutMapping("/{exerciseItemID}")
  public Result updateExer(@PathVariable int exerciseItemID, @Valid @RequestBody Exer exer) {
    exer.setExerciseItemID(exerciseItemID);
    exerService.updateExer(exer);
    return Result.success();
  }

  @DeleteMapping("/{exerciseItemID}")
  public Result deleteExer(@PathVariable int exerciseItemID) {
    exerService.deleteExer(exerciseItemID);
    return Result.success();
  }
}
