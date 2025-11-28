/**
 * SSE 流式请求工具
 */

interface AsyncQueue<T> {
  generator: AsyncGenerator<T>
  pushValue: (value: T) => void
  close: () => void
  pushError: (err: unknown) => void
}

const createAsyncQueue = <T>(): AsyncQueue<T> => {
  const buffer: Array<T | null> = []
  let pendingResolve: ((value: T | null) => void) | null = null
  let pendingReject: ((reason?: unknown) => void) | null = null
  let storedError: unknown = null
  let finished = false

  const nextValue = () => {
    if (buffer.length > 0) {
      return Promise.resolve(buffer.shift()!)
    }
    if (storedError) {
      const err = storedError
      storedError = null
      return Promise.reject(err)
    }
    if (finished) {
      return Promise.resolve(null)
    }
    return new Promise<T | null>((resolve, reject) => {
      pendingResolve = resolve
      pendingReject = reject
    })
  }

  const pushValue = (value: T) => {
    if (finished) {
      return
    }
    if (pendingResolve) {
      const resolver = pendingResolve
      pendingResolve = null
      pendingReject = null
      resolver(value)
    } else {
      buffer.push(value)
    }
  }

  const close = () => {
    if (finished) {
      return
    }
    finished = true
    if (pendingResolve) {
      const resolver = pendingResolve
      pendingResolve = null
      pendingReject = null
      resolver(null)
    } else {
      buffer.push(null)
    }
  }

  const pushError = (err: unknown) => {
    if (finished) {
      return
    }
    finished = true
    if (pendingReject) {
      const rejecter = pendingReject
      pendingResolve = null
      pendingReject = null
      rejecter(err)
    } else {
      storedError = err
    }
  }

  const generator = (async function* () {
    while (true) {
      const value = await nextValue()
      if (value === null) {
        break
      }
      yield value
    }
  })()

  return { generator, pushValue, close, pushError }
}

export interface SSEPostOptions {
  params: Record<string, unknown>
  signal: AbortSignal
}

/**
 * 使用 fetch 发送 POST 请求处理 SSE 流
 */
export async function ssePost<T>(path: string, options: SSEPostOptions) {
  const { params, signal } = options

  return new Promise<AsyncGenerator<T>>((resolve, reject) => {
    const { generator, pushValue, close, pushError } = createAsyncQueue<T>()
    let hasResolved = false

    const token = useCookie('token').value

    fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(params),
      signal
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = (await res.text()) || res.statusText
          throw new Error(text)
        }
        hasResolved = true
        resolve(generator)
        return res.body
      })
      .then(async (body) => {
        if (!body) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        const reader = body.getReader()
        let buffer = ''

        /**
         * 解析连续的 JSON 对象流
         * 支持格式: {"content":"a"}{"content":"b"} 或标准 SSE data: 格式
         */
        const processBuffer = async (flushAll = false) => {
          // 处理标准 SSE 格式的 close 事件
          if (buffer.includes('event: close') || buffer.includes('event:close')) {
            close()
            await reader.cancel()
            return true
          }

          // 尝试解析连续的 JSON 对象
          let searchStart = 0
          while (searchStart < buffer.length) {
            while (searchStart < buffer.length && /\s/.test(buffer[searchStart] ?? '')) {
              searchStart++
            }

            if (searchStart >= buffer.length) {
              break
            }

            // 处理标准 SSE data: 前缀
            if (buffer.slice(searchStart).startsWith('data:')) {
              searchStart += 5
              while (searchStart < buffer.length && buffer[searchStart] === ' ') {
                searchStart++
              }
            }

            // 查找 JSON 对象的起始位置
            const jsonStart = buffer.indexOf('{', searchStart)
            if (jsonStart === -1) {
              break
            }

            // 尝试找到完整的 JSON 对象
            let braceCount = 0
            let jsonEnd = -1
            let inString = false
            let escapeNext = false

            for (let i = jsonStart; i < buffer.length; i++) {
              const char = buffer[i]

              if (escapeNext) {
                escapeNext = false
                continue
              }

              if (char === '\\' && inString) {
                escapeNext = true
                continue
              }

              if (char === '"') {
                inString = !inString
                continue
              }

              if (!inString) {
                if (char === '{') {
                  braceCount++
                } else if (char === '}') {
                  braceCount--
                  if (braceCount === 0) {
                    jsonEnd = i
                    break
                  }
                }
              }
            }

            // 如果没有找到完整的 JSON，保留 buffer 等待更多数据
            if (jsonEnd === -1) {
              if (flushAll) {
                // 最后一次处理，尝试解析剩余内容
                buffer = ''
              } else {
                // 保留从 jsonStart 开始的内容
                buffer = buffer.slice(jsonStart)
              }
              break
            }

            // 提取并解析 JSON
            const jsonStr = buffer.slice(jsonStart, jsonEnd + 1)
            try {
              const parsed = JSON.parse(jsonStr)
              pushValue(parsed)
            } catch {
              // JSON 解析失败，跳过这个对象
            }

            searchStart = jsonEnd + 1
          }

          if (searchStart > 0 && searchStart <= buffer.length) {
            buffer = buffer.slice(searchStart)
          }

          return false
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              const flushed = await processBuffer(true)
              if (!flushed) {
                close()
              }
              break
            }

            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
            const shouldStop = await processBuffer()
            if (shouldStop) {
              return
            }
          }
        } finally {
          reader.releaseLock()
        }
      })
      .catch((err) => {
        if (hasResolved) {
          pushError(err)
        } else {
          reject(err)
        }
      })
  })
}

/**
 * 使用原生 EventSource 发送 GET 请求（适用于简单场景）
 */
export interface SSEOptions {
  params: Record<string, string>
  signal: AbortSignal
}

export async function sse<T>(path: string, options: SSEOptions) {
  const { params, signal } = options

  const token = useCookie('token').value
  const search = new URLSearchParams({
    ...params,
    ...(token ? { token } : {})
  })
  const url = `${path}?${search}`

  return new Promise<AsyncGenerator<T>>((resolve, reject) => {
    const { generator, pushValue, close, pushError } = createAsyncQueue<T>()
    let hasResolved = false

    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      hasResolved = true
      resolve(generator)
    }

    eventSource.onerror = () => {
      const error = new Error('EventSource connection error')
      if (hasResolved) {
        pushError(error)
      } else {
        reject(error)
      }
      eventSource.close()
    }

    eventSource.onmessage = (event) => {
      if (!event.data) {
        return
      }
      try {
        pushValue(JSON.parse(event.data))
      } catch (err) {
        pushError(err)
      }
    }

    eventSource.addEventListener('close', () => {
      close()
    })

    signal.addEventListener('abort', () => {
      eventSource.close()
      const abortError = new Error('Aborted')
      if (hasResolved) {
        pushError(abortError)
      } else {
        reject(abortError)
      }
    })
  })
}
