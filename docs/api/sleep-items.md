# 睡眠记录接口

## `GET /sleep-items`

分页查询睡眠记录

- **查询参数**：
  - `page`（默认 `1`）
  - `pageSize`（默认 `10`）
  - `userID`（必填）
  - `startDate`、`endDate`（可选，`YYYY-MM-DD`）
- **成功响应**：

  ```json
  {
    "code": 1,
    "msg": "success",
    "data": {
      "total": 1,
      "rows": [
        {
          "sleepItemID": 12,
          "userID": "user-uuid-string",
          "recordDate": "2024-06-05",
          "bedTime": "2024-06-04T23:30:00",
          "wakeTime": "2024-06-05T07:15:00"
        }
      ]
    }
  }
  ```

## `GET /sleep-items/{sleepItemID}`

- **成功响应**：返回 `Sleep` 对象
- **未找到记录**：`{"code":1,"msg":"success","data":null}`

## `POST /sleep-items`

新增睡眠记录

- **请求体**：

  ```json
  {
    "userID": "user-uuid-string",
    "recordDate": "2024-06-05",
    "bedTime": "2024-06-04T23:30:00",
    "wakeTime": "2024-06-05T07:15:00"
  }
  ```

  `bedTime`、`wakeTime` 可为 `null`，格式遵循 `YYYY-MM-DDTHH:mm:ss`

- **成功响应**：`{"code":1,"msg":"success","data":<new-sleepItemID>}`

## `PUT /sleep-items/{sleepItemID}`

- **请求体**：同上，可更新字段
- **成功响应**：`{"code":1,"msg":"success","data":null}`

## `DELETE /sleep-items/{sleepItemID}`

- **成功响应**：`{"code":1,"msg":"success","data":null}`；删除后查询该 ID 得到 `data = null`

## 数据校验

- 同时提供 `bedTime` 与 `wakeTime` 时必须满足 `bedTime <= wakeTime`
