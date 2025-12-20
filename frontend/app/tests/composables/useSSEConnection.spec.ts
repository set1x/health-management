import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSSEConnection } from '~/composables/useSSEConnection'

describe('useSSEConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('应该初始化为 disconnected 状态', () => {
    const { status } = useSSEConnection()
    expect(status.value).toBe('disconnected')
  })

  it('应该在开始请求时更新为 connecting 状态', async () => {
    const { status, executeWithRetry } = useSSEConnection()

    const mockGenerator = async function* () {
      yield { data: 'test' }
    }

    const promise = executeWithRetry(mockGenerator, async () => {})

    // 在微任务之后检查状态
    await Promise.resolve()
    expect(status.value).toBe('connected')

    await promise
  })

  it('应该在连接成功后更新为 connected 状态', async () => {
    const { status, executeWithRetry } = useSSEConnection()

    const mockGenerator = async function* () {
      yield { data: 'test' }
    }

    await executeWithRetry(mockGenerator, async () => {})

    expect(status.value).toBe('disconnected')
  })

  it('应该实现指数退避重试', async () => {
    const { executeWithRetry } = useSSEConnection({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000
    })

    let attempts = 0
    const mockGenerator = async function* (): AsyncGenerator<{ data: string }> {
      attempts++
      if (attempts < 3) {
        throw new Error('Connection failed')
      }
      yield { data: 'success' }
    }

    const chunks: { data: string }[] = []
    const promise = executeWithRetry(mockGenerator, async (chunk) => {
      chunks.push(chunk)
    })

    // 第一次失败
    await vi.advanceTimersByTimeAsync(0)

    // 等待第一次重试延迟（100ms）
    await vi.advanceTimersByTimeAsync(100)

    // 第二次失败
    await vi.advanceTimersByTimeAsync(0)

    // 等待第二次重试延迟（200ms）
    await vi.advanceTimersByTimeAsync(200)

    // 第三次成功
    await vi.advanceTimersByTimeAsync(0)

    await promise

    expect(attempts).toBe(3)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.data).toBe('success')
  })

  it('应该在达到最大重试次数后失败', async () => {
    const { status, executeWithRetry } = useSSEConnection({
      maxRetries: 2,
      initialDelay: 100
    })

    const mockGenerator = async function* (): AsyncGenerator<{ data: string }> {
      // 生成器在迭代时抛出错误
      throw new Error('Connection failed')
      yield { data: 'never' } // 保留以满足生成器语法
    }

    const promise = executeWithRetry(mockGenerator, async () => {}).catch((error) => {
      // 捕获错误
      return error
    })

    // 推进所有定时器直到 Promise 解决
    await vi.runAllTimersAsync()

    const result = await promise
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('连接失败，已重试 2 次')
    expect(status.value).toBe('failed')
  })

  it('应该处理用户主动取消', async () => {
    const { status, executeWithRetry } = useSSEConnection()

    const mockGenerator = async function* (): AsyncGenerator<{ data: string }> {
      const error = new Error('User aborted')
      error.name = 'AbortError'
      throw error
      yield { data: 'never' } // 保留以满足生成器语法
    }

    await expect(executeWithRetry(mockGenerator, async () => {})).rejects.toThrow('User aborted')

    expect(status.value).toBe('disconnected')
  })

  it('应该在状态变化时调用回调', async () => {
    const onStatusChange = vi.fn()
    const { executeWithRetry } = useSSEConnection({
      onStatusChange
    })

    const mockGenerator = async function* () {
      yield { data: 'test' }
    }

    await executeWithRetry(mockGenerator, async () => {})

    expect(onStatusChange).toHaveBeenCalledWith('connecting')
    expect(onStatusChange).toHaveBeenCalledWith('connected')
    expect(onStatusChange).toHaveBeenCalledWith('disconnected')
  })

  it('应该正确计算指数退避延迟', async () => {
    const { executeWithRetry } = useSSEConnection({
      maxRetries: 4,
      initialDelay: 1000,
      maxDelay: 5000
    })

    let attempts = 0
    const delays: number[] = []

    const mockGenerator = async function* (): AsyncGenerator<{ data: string }> {
      attempts++
      if (attempts < 5) {
        throw new Error('Connection failed')
      }
      yield { data: 'success' }
    }

    const promise = executeWithRetry(mockGenerator, async () => {})

    // 延迟应该是：1000, 2000, 4000, 5000（达到上限）
    for (let i = 0; i < 4; i++) {
      const expectedDelay = Math.min(1000 * Math.pow(2, i), 5000)
      delays.push(expectedDelay)
      await vi.advanceTimersByTimeAsync(expectedDelay)
    }

    await promise

    expect(attempts).toBe(5) // 初始 + 4 次重试
  })

  it('应该允许重置重试计数', async () => {
    const { retryCount, executeWithRetry, resetRetry } = useSSEConnection({
      maxRetries: 2,
      initialDelay: 100
    })

    let attempts = 0
    const mockGenerator = async function* (): AsyncGenerator<{ data: string }> {
      attempts++
      if (attempts === 1) {
        throw new Error('First failure')
      }
      yield { data: 'success' }
    }

    // 第一次尝试失败
    const promise1 = executeWithRetry(mockGenerator, async () => {})
    await vi.advanceTimersByTimeAsync(100)
    await promise1

    expect(retryCount.value).toBe(0) // 成功后重置

    // 重置后再次尝试
    attempts = 0
    resetRetry()
    const promise2 = executeWithRetry(mockGenerator, async () => {})
    await vi.advanceTimersByTimeAsync(100)
    await promise2

    expect(retryCount.value).toBe(0)
  })
})
