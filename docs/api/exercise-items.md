# 运动记录接口

## `GET /exercise-items`

分页查询运动记录

- **查询参数**：
  - `page`（默认 `1`）
  - `pageSize`（默认 `10`）
  - `userID`（必填）
  - `startDate`、`endDate`（可选，`YYYY-MM-DD`）
  - `exerciseType`（可选，如 `Running`）
- **成功响应**：

  ```json
  {
    "code": 1,
    "msg": "success",
    "data": {
      "total": 1,
      "rows": [
        {
          "exerciseItemID": 10,
          "userID": "user-uuid-string",
          "recordDate": "2024-06-03",
          "exerciseType": "Running",
          "durationMinutes": 45,
          "estimatedCaloriesBurned": 500
        }
      ]
    }
  }
  ```

## `GET /exercise-items/{exerciseItemID}`

- **成功响应**：返回 `Exer` 对象
- **未找到记录**：`{"code":1,"msg":"success","data":null}`

## `POST /exercise-items`

- **请求体**：

  ```json
  {
    "userID": "user-uuid-string",
    "recordDate": "2024-06-03",
    "exerciseType": "Running",
    "durationMinutes": 45,
    "estimatedCaloriesBurned": 500
  }
  ```

- **成功响应**：`{"code":1,"msg":"success","data":<new-exerciseItemID>}`

## `PUT /exercise-items/{exerciseItemID}`

- **成功响应**：`{"code":1,"msg":"success","data":null}`

## `DELETE /exercise-items/{exerciseItemID}`

- **成功响应**：`{"code":1,"msg":"success","data":null}`；删除后再查该 ID 返回 `data = null`

## 数据校验

- `durationMinutes` 范围 `1-600`

## AI 助手联动

- `queryExerciseRecords`：复用 `GET /exercise-items` 过滤器
- `addExerciseRecord`：校验运动类型必须在 15 种白名单内，成功后返回数据库自增 `exerciseItemID`
- `updateExerciseRecord`：用于语义指令“把今天的跑步改成 30 分钟”

这些函数由 `/chat/stream` 自动调用，并对接与本页一致的业务规则
