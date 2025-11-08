/**
 * SSE 流式请求工具
 */

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
    let resolvers: PromiseWithResolvers<T | null>
    let isStreamClosed = false
    let hasResolved = false

    const generator = async function* () {
      while (true) {
        resolvers = Promise.withResolvers<T | null>()
        const result = await resolvers.promise
        if (result === null) {
          break
        }
        yield result
      }
    }

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
        resolve(generator())
        return res.body
      })
      .then(async (body) => {
        if (!body) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        const reader = body.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              isStreamClosed = true
              resolvers?.resolve(null)
              break
            }

            const lines = decoder
              .decode(value, { stream: true })
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)

            for (const line of lines) {
              const colonIndex = line.indexOf(':')

              if (colonIndex === -1) {
                continue
              }

              let key = line.slice(0, colonIndex).trim()
              let value = line.slice(colonIndex + 1).trim()

              if (key === 'data') {
                if (value.startsWith('data:')) {
                  value = value.slice(5).trim()
                } else if (value.startsWith('event:')) {
                  key = 'event'
                  value = value.slice(6).trim()
                }
              }

              if (key === 'data' && value) {
                try {
                  const parsed = JSON.parse(value)
                  resolvers?.resolve(parsed)
                  resolvers = Promise.withResolvers<T | null>()
                } catch {
                  continue
                }
              }

              if (key === 'event' && value === 'close') {
                isStreamClosed = true
                resolvers?.resolve(null)
                reader.cancel()
                return
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      })
      .catch((err) => {
        if (!isStreamClosed) {
          if (hasResolved) {
            resolvers?.reject(err)
          } else {
            reject(err)
          }
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
    let resolvers: PromiseWithResolvers<T | null>

    const generator = async function* () {
      while (true) {
        resolvers = Promise.withResolvers<T | null>()
        const result = await resolvers.promise
        if (result === null) {
          break
        }
        yield result
      }
    }

    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      resolve(generator())
    }

    eventSource.onerror = () => {
      reject(new Error('EventSource connection error'))
      eventSource.close()
    }

    eventSource.onmessage = (event) => {
      if (!event.data) {
        return
      }
      try {
        resolvers?.resolve(JSON.parse(event.data))
      } catch (err) {
        resolvers?.reject(err)
      }
    }

    eventSource.addEventListener('close', () => {
      resolvers?.resolve(null)
    })

    signal.addEventListener('abort', () => {
      eventSource.close()
      resolvers?.reject(new Error('Aborted'))
    })
  })
}
