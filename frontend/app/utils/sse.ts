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

        const processBuffer = async (flushAll = false) => {
          buffer = buffer.replace(/\r/g, '\n')
          const blocks = buffer.split('\n\n')
          buffer = flushAll ? '' : (blocks.pop() ?? '')

          for (const block of blocks) {
            if (!block.trim()) {
              continue
            }

            const lines = block.split('\n')
            const dataLines: string[] = []
            let eventType = 'message'

            for (const rawLine of lines) {
              const line = rawLine.trim()
              if (!line) {
                continue
              }

              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim()
                continue
              }

              if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim())
              }
            }

            if (eventType === 'close') {
              close()
              await reader.cancel()
              return true
            }

            if (dataLines.length === 0) {
              continue
            }

            let payload = dataLines.join('\n')

            if (payload.startsWith('data:')) {
              const candidate = payload.slice(5).trimStart()
              if (candidate.startsWith('{') || candidate.startsWith('[')) {
                payload = candidate
              }
            }
            try {
              const parsed = JSON.parse(payload)
              pushValue(parsed)
            } catch {
              continue
            }
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
