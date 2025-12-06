import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetchRaw = vi.fn()
vi.stubGlobal('$fetch', { raw: mockFetchRaw })

const resetStates = () => {
  const existsState = useState<boolean | null>('avatar_exists', () => null)
  const timestampState = useState<number>('avatar_timestamp', () => Date.now())

  existsState.value = null
  timestampState.value = Date.now()
}

describe('useAvatar', () => {
  beforeEach(() => {
    mockFetchRaw.mockReset()
    resetStates()
  })

  afterEach(() => {
    resetStates()
  })

  describe('checkAvatarExists', () => {
    it('成功请求时应该缓存结果', async () => {
      mockFetchRaw.mockResolvedValueOnce({ status: 200 })

      const { checkAvatarExists } = useAvatar()

      const result = await checkAvatarExists()
      expect(result).toBe(true)
      expect(mockFetchRaw).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'HEAD',
        ignoreResponseError: true
      })

      const second = await checkAvatarExists()
      expect(second).toBe(true)
      expect(mockFetchRaw).toHaveBeenCalledTimes(1)
    })

    it('请求返回 404 时应该返回 false 并缓存状态', async () => {
      mockFetchRaw.mockResolvedValueOnce({ status: 404 })

      const { checkAvatarExists, getAvatarUrl } = useAvatar()

      const result = await checkAvatarExists()
      expect(result).toBe(false)
      expect(getAvatarUrl()).toBe('')
    })

    it('请求异常时应该返回 false', async () => {
      mockFetchRaw.mockRejectedValueOnce(new Error('network error'))

      const { checkAvatarExists, getAvatarUrl } = useAvatar()

      const result = await checkAvatarExists()
      expect(result).toBe(false)
      expect(getAvatarUrl()).toBe('')
    })
  })

  describe('getAvatarUrl', () => {
    it('头像存在时应该返回带时间戳的 URL', () => {
      const { markAvatarUpdated, getAvatarUrl } = useAvatar()

      markAvatarUpdated()
      const url = getAvatarUrl()

      expect(url).toMatch(/\/api\/user\/avatar\?t=\d+/)
    })

    it('重置后应该返回空字符串', () => {
      const { markAvatarUpdated, resetAvatar, getAvatarUrl } = useAvatar()

      markAvatarUpdated()
      expect(getAvatarUrl()).not.toBe('')

      resetAvatar()
      expect(getAvatarUrl()).toBe('')
    })
  })
})
