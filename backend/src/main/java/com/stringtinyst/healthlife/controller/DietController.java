package com.stringtinyst.healthlife.controller;

import com.stringtinyst.healthlife.pojo.Diet;
import com.stringtinyst.healthlife.pojo.PageBean;
import com.stringtinyst.healthlife.pojo.Result;
import com.stringtinyst.healthlife.service.DietService;
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
@RequestMapping("/diet-items")
public class DietController {
  @Autowired private DietService dietService;

  @GetMapping
  public Result page(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
      @RequestParam(required = false) String mealType) {
    PageBean<Diet> pageBean =
        dietService.page(page, pageSize, userID, startDate, endDate, mealType);
    return Result.success(pageBean);
  }

  @GetMapping("/export")
  public void export(
      @RequestParam(defaultValue = "1") Integer page,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam String userID,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
      @RequestParam(required = false) String mealType,
      HttpServletResponse response)
      throws IOException {
    PageBean<Diet> pageBean =
        dietService.page(page, pageSize, userID, startDate, endDate, mealType);
    List<Diet> list = pageBean.getRows();

    String[] headers = {
      "ID", "User ID", "Record Date", "Food Name", "Meal Type", "Estimated Calories"
    };
    CsvUtils.exportCsv(
        response,
        "diet-items.csv",
        headers,
        list,
        item ->
            Arrays.asList(
                item.getDietItemID(),
                item.getUserID(),
                item.getRecordDate(),
                item.getFoodName(),
                item.getMealType(),
                item.getEstimatedCalories()));
  }

  @GetMapping("/{dietItemID}")
  public Result getDietItem(@PathVariable int dietItemID) {
    log.info("Fetching diet item with ID: {}", dietItemID);
    Diet diet = dietService.getByDietItemByID(dietItemID);
    return Result.success(diet);
  }

  @PostMapping
  public Result addDiet(@Valid @RequestBody Diet diet) {
    log.info("Adding new diet item for user: {}", diet.getUserID());
    dietService.addDiet(diet);
    return Result.success(diet.getDietItemID());
  }

  @PutMapping("/{dietItemID}")
  public Result updateDiet(@PathVariable int dietItemID, @Valid @RequestBody Diet diet) {
    log.info("Updating diet item with ID: {}", dietItemID);
    diet.setDietItemID(dietItemID);
    dietService.updateDiet(diet);
    return Result.success();
  }

  @DeleteMapping("/{dietItemID}")
  public Result deleteDiet(@PathVariable int dietItemID) {
    log.info("Deleting diet item with ID: {}", dietItemID);
    dietService.deleteDiet(dietItemID);
    return Result.success();
  }
}
