# AI 聊天接口

## `POST /chat/stream`

与 AI 对话（Server-Sent Events）

- **请求头**：`Authorization: Bearer <jwt>`
- **请求体**：

  ```json
  {
    "query": "你的问题"
  }
  ```

- **成功响应**：`Content-Type: text/event-stream`，服务端会持续推送形如

  ```text
  data: {"content":"你好"}

  data: {"content":"很高兴见到你。有什么我可以帮助你的吗？"}

  event: close

  ```

  事件之间以空行分隔

- **流转超时**：若 60 秒内后端未能继续发送分片，将自动终止本次响应并推送 `{"content":"AI 服务响应超时，请稍后重试"}`
- **AI 不可用**：当模型返回 `503` / `429` 等错误时，会推送友好提示，随后关闭连接

- **请求体缺少或为空 `query`**：立即推送 `data: {"content":"消息不能为空"}`，随后发送 `event: close`

## `DELETE /chat/memory`

清除当前用户的聊天上下文

- **请求头**：`Authorization: Bearer <jwt>`
- **成功响应**：`{"code":1,"msg":"success","data":"已开始新对话"}`
- **token 失效或缺失**：全局拦截器返回 `{"code":0,"msg":"登录已过期，请重新登录"}`
