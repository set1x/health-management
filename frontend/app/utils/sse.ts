/**
 * SSE 流式请求工具
 * 后端返回格式：连续的 JSON 对象流 {"content":"a"}{"content":"b"}
 */

export interface SSEPostOptions {
  params: Record<string, unknown>
  signal: AbortSignal
}

/**
 * 使用 fetch 发送 POST 请求处理 JSON 流
 */
export async function* ssePost<T>(path: string, options: SSEPostOptions): AsyncGenerator<T> {
  const { params, signal } = options
  const token = useCookie('token').value

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(params),
    signal
  })

  if (!response.ok) {
    const text = (await response.text()) || response.statusText
    throw new Error(text)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 处理剩余 buffer
        if (buffer.trim()) {
          const jsonStart = buffer.indexOf('{')
          if (jsonStart !== -1) {
            try {
              const parsed = JSON.parse(buffer.slice(jsonStart))
              yield parsed
            } catch {
              // 忽略解析错误
            }
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 解析所有完整的 JSON 对象
      let searchStart = 0
      while (searchStart < buffer.length) {
        // 跳过空白字符
        while (searchStart < buffer.length && /\s/.test(buffer[searchStart] ?? '')) {
          searchStart++
        }

        if (searchStart >= buffer.length) break

        // 查找 JSON 起始位置
        const jsonStart = buffer.indexOf('{', searchStart)
        if (jsonStart === -1) break

        // 查找对应的结束位置
        let braceCount = 0
        let inString = false
        let escaped = false
        let jsonEnd = -1

        for (let i = jsonStart; i < buffer.length; i++) {
          const char = buffer[i]

          if (escaped) {
            escaped = false
            continue
          }

          if (char === '\\' && inString) {
            escaped = true
            continue
          }

          if (char === '"') {
            inString = !inString
          } else if (!inString) {
            if (char === '{') braceCount++
            else if (char === '}') {
              braceCount--
              if (braceCount === 0) {
                jsonEnd = i
                break
              }
            }
          }
        }

        // 如果没找到完整的 JSON，保留 buffer 等待更多数据
        if (jsonEnd === -1) {
          buffer = buffer.slice(jsonStart)
          break
        }

        // 解析并输出 JSON
        const jsonStr = buffer.slice(jsonStart, jsonEnd + 1)
        try {
          const parsed = JSON.parse(jsonStr)
          yield parsed
        } catch {
          // 忽略解析错误
        }

        searchStart = jsonEnd + 1
      }

      // 清理已处理的数据
      if (searchStart > 0) {
        buffer = buffer.slice(searchStart)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
