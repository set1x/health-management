import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { DateValue } from '@internationalized/date'

const mockToastAdd = vi.fn()
mockNuxtImport('useToast', () => {
  return () => ({
    add: mockToastAdd
  })
})

const mockUserID = { value: 'test-user-id' as string | null }
const mockToken = { value: 'test-token' as string | null }
mockNuxtImport('useCookie', () => {
  return (key: string) => {
    if (key === 'userID') return mockUserID
    if (key === 'token') return mockToken
    return { value: null }
  }
})

mockNuxtImport('dateValueToString', () => {
  return (date: DateValue) => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  }
})

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockCreateElement = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockClick = vi.fn()

describe('useExport', () => {
  let mockLink: Partial<HTMLAnchorElement>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockToastAdd.mockReset()

    mockLink = {
      href: '',
      download: '',
      style: { display: '' } as CSSStyleDeclaration,
      click: mockClick
    }

    mockCreateElement.mockReturnValue(mockLink)
    mockCreateObjectURL.mockReturnValue('blob:mock-url')

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL
    })

    vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)

    mockUserID.value = 'test-user-id'
    mockToken.value = 'test-token'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportData', () => {
    it('应该在未登录时显示错误提示', async () => {
      mockUserID.value = null

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10
      })

      expect(mockToastAdd).toHaveBeenCalledWith({
        title: '请先登录',
        color: 'error'
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('应该在没有 token 时显示错误提示', async () => {
      mockToken.value = null

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10
      })

      expect(mockToastAdd).toHaveBeenCalledWith({
        title: '请先登录',
        color: 'error'
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('应该使用正确的参数调用导出接口', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/body-metrics/export',
        filename: 'body-metrics.csv',
        page: 2,
        pageSize: 20
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/body-metrics/export?page=2&pageSize=20&userID=test-user-id',
        {
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      )
    })

    it('应该在导出成功时下载文件并显示成功提示', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10
      })

      // 验证创建 blob URL
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)

      // 验证创建 link 元素
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe('blob:mock-url')
      expect(mockLink.download).toBe('test.csv')
      expect(mockLink.style?.display).toBe('none')

      // 验证 DOM 操作
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
      expect(mockClick).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)

      // 验证清理 URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

      // 验证成功提示
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: '导出成功',
        color: 'success'
      })
    })

    it('应该在包含日期范围时正确构建查询参数', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      const dateRange = {
        start: { year: 2024, month: 1, day: 1 } as DateValue,
        end: { year: 2024, month: 12, day: 31 } as DateValue
      }

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10,
        dateRange
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/export?page=1&pageSize=10&userID=test-user-id&startDate=2024-01-01&endDate=2024-12-31',
        expect.any(Object)
      )
    })

    it('应该在包含额外参数时正确构建查询参数', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/diet-items/export',
        filename: 'diet.csv',
        page: 1,
        pageSize: 10,
        additionalParams: {
          mealType: '早餐'
        }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/diet-items/export?page=1&pageSize=10&userID=test-user-id&mealType=%E6%97%A9%E9%A4%90',
        expect.any(Object)
      )
    })

    it('应该同时处理日期范围和额外参数', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      const dateRange = {
        start: { year: 2024, month: 6, day: 1 } as DateValue,
        end: { year: 2024, month: 6, day: 30 } as DateValue
      }

      await exportData({
        endpoint: '/api/exercise-items/export',
        filename: 'exercise.csv',
        page: 1,
        pageSize: 10,
        dateRange,
        additionalParams: {
          exerciseType: '跑步'
        }
      })

      const url = mockFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('page=1')
      expect(url).toContain('pageSize=10')
      expect(url).toContain('userID=test-user-id')
      expect(url).toContain('startDate=2024-06-01')
      expect(url).toContain('endDate=2024-06-30')
      expect(url).toContain('exerciseType')
    })

    it('应该在请求失败时显示错误提示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10
      })

      expect(mockToastAdd).toHaveBeenCalledWith({
        title: '导出失败',
        color: 'error'
      })

      // 不应该创建下载链接
      expect(mockCreateObjectURL).not.toHaveBeenCalled()
      expect(document.createElement).not.toHaveBeenCalled()
    })

    it('应该在网络错误时显示错误提示', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10
      })

      expect(mockToastAdd).toHaveBeenCalledWith({
        title: '导出失败',
        color: 'error'
      })
    })

    it('应该处理没有日期范围的情况', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10,
        dateRange: null
      })

      const url = mockFetch.mock.calls[0]?.[0] as string
      expect(url).not.toContain('startDate')
      expect(url).not.toContain('endDate')
    })

    it('应该处理日期范围只有部分数据的情况', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      const incompleteDateRange = {
        start: { year: 2024, month: 1, day: 1 } as DateValue,
        end: null as unknown as DateValue
      }

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10,
        dateRange: incompleteDateRange
      })

      const url = mockFetch.mock.calls[0]?.[0] as string
      expect(url).not.toContain('startDate')
      expect(url).not.toContain('endDate')
    })

    it('应该处理空的额外参数对象', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      })

      const { exportData } = useExport()

      await exportData({
        endpoint: '/api/test/export',
        filename: 'test.csv',
        page: 1,
        pageSize: 10,
        additionalParams: {}
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/export?page=1&pageSize=10&userID=test-user-id',
        expect.any(Object)
      )
    })
  })
})
