import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock useCookie
vi.mock('#app', () => ({
  useCookie: vi.fn(() => ({ value: 'mock-token' }))
}))

describe('sse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ssePost', () => {
    it('应该能处理正常的 SSE 响应流', async () => {
      // 模拟一个返回 SSE 数据的响应
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"message": "hello"}\n\n'))
          controller.enqueue(new TextEncoder().encode('data: {"message": "world"}\n\n'))
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ message: string }>('/api/test', {
        params: { test: 'value' },
        signal: controller.signal
      })

      const results: { message: string }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(2)
      expect(results[0]?.message).toBe('hello')
      expect(results[1]?.message).toBe('world')
    })

    it('应该在请求失败时抛出错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server Error')
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      await expect(
        ssePost('/api/test', {
          params: {},
          signal: controller.signal
        })
      ).rejects.toThrow('Server Error')
    })

    it('应该在响应体为空时抛出错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost('/api/test', {
        params: {},
        signal: controller.signal
      })

      // 应该在迭代时抛出错误
      await expect(async () => {
        for await (const _ of generator) {
          // 迭代
        }
      }).rejects.toThrow('No response body')
    })

    it('应该使用 POST 方法发送请求', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      await ssePost('/api/test', {
        params: { key: 'value' },
        signal: controller.signal
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' })
        })
      )
    })

    it('应该设置 Content-Type 请求头', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      await ssePost('/api/test', {
        params: {},
        signal: controller.signal
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('应该处理连续的 JSON 对象流', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"message":"first"}{"message":"second"}'))
          controller.enqueue(new TextEncoder().encode('event:close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ message: string }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { message: string }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(2)
      expect(results[0]?.message).toBe('first')
      expect(results[1]?.message).toBe('second')
    })

    it('应该处理包含空格的数据流', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('  data: {"value":1}  \n\n'))
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ value: number }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { value: number }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(1)
      expect(results[0]?.value).toBe(1)
    })

    it('应该处理包含转义字符的 JSON', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"text":"hello \\"world\\""}'))
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ text: string }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { text: string }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(1)
      expect(results[0]?.text).toBe('hello "world"')
    })

    it('应该处理不完整的 JSON 数据', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"incomplete":'))
          controller.enqueue(new TextEncoder().encode('"value"}'))
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ incomplete: string }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { incomplete: string }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(1)
      expect(results[0]?.incomplete).toBe('value')
    })

    it('应该跳过无效的 JSON 对象', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{invalid}{"valid":true}'))
          controller.enqueue(new TextEncoder().encode('event: close\n\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ valid: boolean }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { valid: boolean }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(1)
      expect(results[0]?.valid).toBe(true)
    })

    it('应该处理 \\r\\n 换行符', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"test":1}\r\n\r\n'))
          controller.enqueue(new TextEncoder().encode('event: close\r\n\r\n'))
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

      const { ssePost } = await import('~/utils/sse')
      const controller = new AbortController()

      const generator = await ssePost<{ test: number }>('/api/test', {
        params: {},
        signal: controller.signal
      })

      const results: { test: number }[] = []
      for await (const item of generator) {
        results.push(item)
      }

      expect(results).toHaveLength(1)
      expect(results[0]?.test).toBe(1)
    })
  })
})
