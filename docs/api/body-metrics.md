# 身体数据接口

## `GET /body-metrics`

分页查询身体数据

- **查询参数**：
  - `page`（默认 `1`）
  - `pageSize`（默认 `10`）
  - `userID`（必填）
  - `startDate`、`endDate`（可选，格式 `YYYY-MM-DD`）
- **成功响应**：

  ```json
  {
    "code": 1,
    "msg": "success",
    "data": {
      "total": 1,
      "rows": [
        {
          "bodyMetricID": 33,
          "userID": "user-uuid-string",
          "heightCM": 172.50,
          "weightKG": 68.30,
          "recordDate": "2024-06-01"
        }
      ]
    }
  }
  ```

  当无数据时 `rows` 为空数组、`total = 0`

## `GET /body-metrics/{bodyMetricID}`

按 ID 查询单条记录

- **成功响应**：返回完整 `Body` 对象
- **未找到记录**：返回 `{"code":1,"msg":"success","data":null}`

## `POST /body-metrics`

新增身体数据

- **请求体**：

  ```json
  {
    "userID": "user-uuid-string",
    "heightCM": 172.5,
    "weightKG": 68.3,
    "recordDate": "2024-06-01"
  }
  ```

- **成功响应**：`{"code":1,"msg":"success","data":<new-bodyMetricID>}`

## `PUT /body-metrics/{bodyMetricID}`

更新身体数据，`bodyMetricID` 由路径指定，`data` 始终为 `null`

## `DELETE /body-metrics/{bodyMetricID}`

删除身体数据，成功响应 `{"code":1,"msg":"success","data":null}`，删除后再查同 ID 会得到 `data = null`

## 数据校验

- `heightCM` 范围 `100-250`
- `weightKG` 范围 `30-300`

## AI 助手联动

- `queryBodyMetrics`：由聊天接口触发，参数与 `GET /body-metrics` 保持一致
- `addBodyMetric`：用于“帮我记录身高体重”等指令，完成后会返回新 `bodyMetricID` 并写入数据库

所有函数都共用本页所述的校验规则，流式响应中会把函数执行结果与健康建议一起返回前端
