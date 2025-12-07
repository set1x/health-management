import type { DateValue } from '@internationalized/date'

interface ExportOptions {
  endpoint: string
  filename: string
  page: number
  pageSize: number
  dateRange?: { start: DateValue; end: DateValue } | null
  additionalParams?: Record<string, string | number>
}

export function useExport() {
  const toast = useToast()

  const exportData = async (options: ExportOptions) => {
    try {
      const userID = useCookie('userID')
      const token = useCookie('token')

      if (!userID.value || !token.value) {
        toast.add({ title: '请先登录', color: 'error' })
        return
      }

      const params: Record<string, string | number> = {
        page: options.page,
        pageSize: options.pageSize,
        userID: userID.value
      }

      if (options.dateRange?.start && options.dateRange?.end) {
        params.startDate = dateValueToString(options.dateRange.start)
        params.endDate = dateValueToString(options.dateRange.end)
      }

      if (options.additionalParams) {
        Object.assign(params, options.additionalParams)
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString()

      const url = `${options.endpoint}?${queryString}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error('导出失败')
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = options.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)

      toast.add({ title: '导出成功', color: 'success' })
    } catch {
      toast.add({ title: '导出失败', color: 'error' })
    }
  }

  return {
    exportData
  }
}
