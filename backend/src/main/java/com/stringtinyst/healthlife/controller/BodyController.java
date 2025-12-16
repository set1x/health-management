package com.stringtinyst.healthlife.controller;

import com.stringtinyst.healthlife.pojo.Body;
import com.stringtinyst.healthlife.pojo.PageBean;
import com.stringtinyst.healthlife.pojo.Result;
import com.stringtinyst.healthlife.service.BodyService;
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
@RequestMapping("/body-metrics")
public class BodyController {

  @Autowired private BodyService bodyService;

  @GetMapping
  public Result page(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
    PageBean<Body> pageBean = bodyService.page(page, pageSize, userID, startDate, endDate);
    return Result.success(pageBean);
  }

  @GetMapping("/export")
  public void export(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
      HttpServletResponse response)
      throws IOException {
    PageBean<Body> pageBean = bodyService.page(page, pageSize, userID, startDate, endDate);
    List<Body> list = pageBean.getRows();

    String[] headers = {"ID", "User ID", "Height (cm)", "Weight (kg)", "Record Date"};
    CsvUtils.exportCsv(
        response,
        "body-metrics.csv",
        headers,
        list,
        item ->
            Arrays.asList(
                item.getBodyMetricID(),
                item.getUserID(),
                item.getHeightCM(),
                item.getWeightKG(),
                item.getRecordDate()));
  }

  @GetMapping("/{bodyMetricID}")
  public Result getBodyMetric(@PathVariable int bodyMetricID) {
    Body body = bodyService.getByBodyID(bodyMetricID);
    return Result.success(body);
  }

  @PostMapping
  public Result addBody(@Valid @RequestBody Body body) {
    bodyService.addBody(body);
    return Result.success(body.getBodyMetricID());
  }

  @PutMapping("/{bodyMetricID}")
  public Result updateBody(@PathVariable int bodyMetricID, @Valid @RequestBody Body body) {
    body.setBodyMetricID(bodyMetricID);
    bodyService.updateBody(body);
    return Result.success();
  }

  @DeleteMapping("/{bodyMetricID}")
  public Result deleteBody(@PathVariable int bodyMetricID) {
    bodyService.deleteBody(bodyMetricID);
    return Result.success();
  }
}
