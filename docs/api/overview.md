# API 概览

本文档概述 Health Management 系统的接口通用约定

## 统一响应结构

除特殊说明外，所有接口返回 `200 OK`，响应体形如：

```json
{
  "code": 1,
  "msg": "success",
  "data": null
}
```

- `code`：`1` 表示成功，`0` 表示失败或业务校验未通过
- `msg`：文本提示，失败时包含具体原因
- `data`：业务负载，部分查询在找不到数据时会返回 `null` 而仍保持 `code = 1`

> 当前实现不会使用 `401` 等 HTTP 状态码指示鉴权失败，所有错误都会以 `200` 返回

## 鉴权约定

全局拦截器基于 `AntPathMatcher` 维护一份白名单，默认允许 `/actuator/**`、`/error`、`/auth/login`、`/auth/register`、`/auth/password/reset`，以及为了兼容反向代理场景而保留的 `/api/auth/login`、`/api/auth/register`、`/api/auth/password/reset`，其余接口必须携带 token：

- `Authorization: Bearer <jwt>`
- 或自定义头 `token: <jwt>`
- 或 Cookie `token=<jwt>`

缺少或无效 token 时响应 `{"code":0,"msg":"未登录或登录已过期，请重新登录"}`。昵称 + 邮箱重置密码接口虽无需 token，但会校验两者是否匹配

## 文档结构

- [auth.md](./auth.md)：认证相关接口
- [user.md](./user.md)：用户信息与头像接口
- [body-metrics.md](./body-metrics.md)：身体数据接口
- [diet-items.md](./diet-items.md)：饮食记录接口
- [exercise-items.md](./exercise-items.md)：运动记录接口
- [sleep-items.md](./sleep-items.md)：睡眠记录接口
- [chat.md](./chat.md)：AI 聊天接口

## AI 助手函数能力

`POST /chat/stream` 会在系统提示中附带服务器当前日期与时间，并自动调用一组受控函数来读写用户的健康数据，避免再通过前端绕行 REST 接口：

- 身体数据：`queryBodyMetrics`、`addBodyMetric`、`getBodyMetricDetail`、`updateBodyMetric`、`deleteBodyMetric`
- 睡眠数据：`querySleepRecords`、`addSleepRecord`、`updateSleepRecord`、`getSleepRecordDetail`、`deleteSleepRecord`
- 饮食数据：`queryDietRecords`、`addDietRecord`、`updateDietRecord`、`getDietRecordDetail`、`deleteDietRecord`
- 运动数据：`queryExerciseRecords`、`addExerciseRecord`、`updateExerciseRecord`、`getExerciseRecordDetail`、`deleteExerciseRecord`
- 联网搜索：`webSearch`（可返回实时健康/运动资讯）

这些函数与对应的 REST API 使用同一套参数校验与业务规则，最终仍会透传到文档中列出的实体接口中。

> 如需关闭联网搜索，可在 `application.properties` 中设置 `web.search.enabled=false`

## 服务端数据校验

- 体征、饮食、运动、睡眠等记录接口会在 Controller 层对关键字段做范围与顺序校验
- 当校验失败时接口仍返回 `200`，但 `code = 0` 且 `msg` 包含具体原因
- 前端继续保留表单校验，后端校验作为兜底


## 分页与排序约定

- 分页参数：`page`（默认 `1`）、`pageSize`（默认 `10`），超大 `pageSize` 可能被服务端限制
- 返回结构：`data.total` 表示总条目数，`data.rows` 为当前页数据数组；无数据时 `rows = []`、`total = 0`
- 排序：除特殊说明外，记录按时间逆序（最新在前）返回；部分接口支持指定排序字段

## 日期与时间格式

- 日期统一使用 ISO 字符串 `YYYY-MM-DD`
- 后端在聊天函数中会附带服务器当前日期与时间，便于生成时段建议
- 跨时区显示由前端负责，建议在界面上按用户本地时区渲染

## 字段命名与单位

- 身高以厘米计：`heightCM`
- 体重以千克计：`weightKG`
- 卡路里以整数近似：`estimatedCalories`
- 统一采用驼峰命名，ID 字段以实体名 + `ID` 表示，如 `dietItemID`

## CSV 导出约定

- 导出接口与查询参数一致，导出的是当前筛选范围内的数据
- 响应头包含 `Content-Type: text/csv` 与 `Content-Disposition: attachment; filename="*.csv"`
- 默认编码为 `UTF-8`，若在部分软件中出现乱码，请以 UTF-8 方式导入

## 幂等性与重试

- `GET` 查询为幂等操作，可在网络异常时安全重试
- `POST/PUT/DELETE` 非幂等，客户端不应在未知结果的情况下自动重试，以避免重复写入

## 速率与请求大小

- 当前未对速率与请求大小做强制限制，但客户端应合理控制请求频率与 `pageSize`，避免过载
- 大文件上传需遵守类型与大小限制，详见各实体接口说明

## 版本管理

- 目前接口未启用显式版本号（如 `v1` 前缀）；若未来引入版本化，会在文档中另行说明