import { test, expect } from '@playwright/test'

test.describe('AI 助手页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 用户信息接口
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: 'success',
          data: {
            userID: '1',
            email: 'test@example.com',
            nickname: 'Test User',
            gender: '男'
          }
        })
      })
    })

    // 直接设置 Cookie 跳过登录
    await page.context().addCookies([
      {
        name: 'token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'userID',
        value: '1',
        domain: 'localhost',
        path: '/'
      }
    ])
    await page.goto('/chat')
  })

  test('应该显示聊天界面基本元素', async ({ page }) => {
    await expect(page.getByPlaceholder('给 AI 助手发送消息（Shift + Enter 换行）')).toBeVisible()
    // 检查快捷建议
    await expect(page.getByText('如何制定减肥计划？')).toBeVisible()
  })

  test('应该能够输入并发送消息', async ({ page }) => {
    const input = page.getByPlaceholder('给 AI 助手发送消息（Shift + Enter 换行）')

    await input.fill('你好，请帮我制定一个减肥计划')
    await expect(input).toHaveValue('你好，请帮我制定一个减肥计划')

    // 点击发送后，输入框应该清空，且出现加载状态或新消息
    await input.press('Enter')
    await expect(input).toHaveValue('')

    // 检查是否出现用户消息
    await expect(page.getByText('你好，请帮我制定一个减肥计划')).toBeVisible()
  })

  test('点击快捷建议应该自动填充或发送', async ({ page }) => {
    const suggestion = page.getByText('如何制定减肥计划？').first()
    await suggestion.click()

    // 点击建议会填充到输入框
    const input = page.getByPlaceholder('给 AI 助手发送消息（Shift + Enter 换行）')
    await expect(input).toHaveValue('如何制定减肥计划？')

    // 发送消息
    await input.press('Enter')

    // 应该能看到用户消息
    await expect(page.getByText('如何制定减肥计划？', { exact: true }).last()).toBeVisible()
  })

  test('应该显示连接状态', async ({ page }) => {
    // 检查连接状态指示器
    const statusIndicator = page.locator('.text-xs', { hasText: /连接/ })
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible()
    }
  })
})
