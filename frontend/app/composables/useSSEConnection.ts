/**
 * SSE 连接管理
 */

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failed'

export interface UseSSEConnectionOptions {
  maxRetries?: number // 最大重试次数
  initialDelay?: number // 初始重试延迟（毫秒）
  maxDelay?: number // 最大重试延迟（毫秒）
  onStatusChange?: (status: ConnectionStatus) => void
}

export function useSSEConnection(options: UseSSEConnectionOptions = {}) {
  const { maxRetries = 5, initialDelay = 1000, maxDelay = 30000, onStatusChange } = options

  const status = ref<ConnectionStatus>('disconnected')
  const retryCount = ref(0)
  const isRetrying = ref(false)

  const calculateDelay = (attempt: number): number => {
    const delay = initialDelay * Math.pow(2, attempt)
    return Math.min(delay, maxDelay)
  }

  const updateStatus = (newStatus: ConnectionStatus) => {
    status.value = newStatus
    onStatusChange?.(newStatus)
  }

  const resetRetry = () => {
    retryCount.value = 0
    isRetrying.value = false
  }

  // 执行带重试的 SSE 请求
  const executeWithRetry = async <T>(
    requestFn: () => AsyncGenerator<T>,
    onChunk: (data: T) => void | Promise<void>
  ): Promise<void> => {
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        updateStatus('connecting')

        const stream = requestFn()
        updateStatus('connected')
        resetRetry()

        for await (const chunk of stream) {
          await onChunk(chunk)
        }

        updateStatus('disconnected')
        return
      } catch (error: unknown) {
        // 如果是用户主动取消，不重试
        if (error instanceof Error && error.name === 'AbortError') {
          updateStatus('disconnected')
          resetRetry()
          throw error
        }

        attempt++
        retryCount.value = attempt

        if (attempt > maxRetries) {
          updateStatus('failed')
          throw new Error(`连接失败，已重试 ${maxRetries} 次`)
        }

        const delay = calculateDelay(attempt - 1)
        updateStatus('connecting')
        isRetrying.value = true

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  return {
    status: readonly(status),
    retryCount: readonly(retryCount),
    isRetrying: readonly(isRetrying),
    executeWithRetry,
    resetRetry,
    updateStatus
  }
}
