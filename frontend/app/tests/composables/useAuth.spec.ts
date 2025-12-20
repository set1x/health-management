import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const mockToastAdd = vi.fn()
mockNuxtImport('useToast', () => {
  return () => ({
    add: mockToastAdd
  })
})

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('初始状态', () => {
    it('应该有默认的初始状态', () => {
      const { user, isLoggedIn } = useAuth()

      expect(user.value).toBeNull()
      expect(isLoggedIn.value).toBe(false)
    })
  })

  describe('login', () => {
    it('登录成功时应该设置 token 并返回 true', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 1,
        data: 'mock-jwt-token.eyJ1c2VySWQiOiIxMjMifQ.signature'
      })

      mockFetch.mockResolvedValueOnce({
        code: 1,
        data: { id: '123', email: 'test@example.com' }
      })

      mockFetch.mockResolvedValueOnce({})

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: '123456' })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: '123456' }
      })
    })

    it('登录失败时应该返回 false 并显示错误提示', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 0,
        msg: '邮箱或密码错误'
      })

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: 'wrong' })

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '登录失败',
          color: 'error'
        })
      )
    })
  })

  describe('register', () => {
    it('注册成功时应该返回 true', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 1,
        msg: '注册成功'
      })

      const { register } = useAuth()

      const result = await register({
        email: 'newuser@example.com',
        password: '123456',
        nickname: 'newuser'
      })

      expect(result).toBe(true)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '注册成功',
          color: 'success'
        })
      )
    })

    it('注册失败时应该返回 false', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 0,
        msg: '邮箱已存在'
      })

      const { register } = useAuth()

      const result = await register({
        email: 'existing@example.com',
        password: '123456'
      })

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '注册失败',
          color: 'error'
        })
      )
    })
  })

  describe('resetPassword', () => {
    it('重置密码成功时应该返回 true', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 1,
        msg: '密码重置成功'
      })

      const { resetPassword } = useAuth()

      const result = await resetPassword({
        nickname: 'testuser',
        email: 'test@example.com',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      })

      expect(result).toBe(true)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '密码已更新',
          color: 'success'
        })
      )
    })

    it('重置密码失败时应该返回 false', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 0,
        msg: '邮箱不存在'
      })

      const { resetPassword } = useAuth()

      const result = await resetPassword({
        nickname: 'testuser',
        email: 'notexist@example.com',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      })

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '重置密码失败',
          color: 'error'
        })
      )
    })
  })

  describe('updateProfile', () => {
    it('更新成功时应该返回 true', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 1,
        msg: '更新成功'
      })

      const { updateProfile } = useAuth()
      const result = await updateProfile({ nickname: '新昵称' })

      expect(result).toBe(true)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '更新成功',
          color: 'success'
        })
      )
    })

    it('更新失败时应该返回 false', async () => {
      mockFetch.mockResolvedValueOnce({
        code: 0,
        msg: '更新失败'
      })

      const { updateProfile } = useAuth()

      const result = await updateProfile({ nickname: '新昵称' })

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '更新失败',
          color: 'error'
        })
      )
    })
  })

  describe('fetchUserProfile', () => {
    it('获取用户信息成功', async () => {
      const mockUserData = {
        id: '123',
        email: 'test@example.com',
        nickname: 'testuser'
      }

      mockFetch.mockResolvedValueOnce({
        code: 1,
        data: mockUserData
      })

      const { fetchUserProfile, user } = useAuth()
      const result = await fetchUserProfile()

      expect(result).toBe(true)
      expect(user.value).toEqual(mockUserData)
    })

    it('401 错误时应该退出登录', async () => {
      mockFetch.mockRejectedValueOnce({
        response: { status: 401 }
      })

      const { fetchUserProfile, isLoggedIn } = useAuth()
      const result = await fetchUserProfile()

      expect(result).toBe(false)
      expect(isLoggedIn.value).toBe(false)
    })

    it('静默模式下 401 不应显示提示', async () => {
      mockFetch.mockRejectedValueOnce({
        response: { status: 401 }
      })

      const { fetchUserProfile } = useAuth()

      await fetchUserProfile(true)

      expect(mockToastAdd).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('退出登录时应该清除状态', () => {
      const { logout, user, isLoggedIn } = useAuth()

      logout()

      expect(user.value).toBeNull()
      expect(isLoggedIn.value).toBe(false)
    })

    it('静默退出时不应该显示提示', () => {
      const { logout } = useAuth()

      logout(true)

      expect(mockToastAdd).not.toHaveBeenCalled()
    })

    it('非静默退出时应该显示提示', () => {
      const { logout } = useAuth()

      logout(false)

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '已退出登录',
          color: 'neutral'
        })
      )
    })
  })
})
