import { test, expect } from '@playwright/test'

test.describe('仪表板页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 登录接口
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: 'success',
          data: 'mock-token'
        })
      })
    })

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

    // Mock 身体数据列表接口
    await page.route('**/api/body-metrics*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1,
            message: 'success',
            data: {
              rows: [
                {
                  id: 1,
                  recordDate: '2025-12-20',
                  weightKG: 70.0,
                  heightCM: 175,
                  bmi: 22.9
                }
              ],
              total: 1
            }
          })
        })
      } else if (route.request().method() === 'POST') {
        // Mock 新增
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1,
            message: 'success',
            data: null
          })
        })
      } else if (route.request().method() === 'PUT') {
        // Mock 更新
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1,
            message: 'success',
            data: null
          })
        })
      } else if (route.request().method() === 'DELETE') {
        // Mock 删除
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1,
            message: 'success',
            data: null
          })
        })
      } else {
        await route.continue()
      }
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

    await page.goto('/dashboard')
    await page.waitForURL('/dashboard')
  })

  test('应该显示健康数据概览卡片', async ({ page }) => {
    await expect(page.getByText('当前体重')).toBeVisible()
    await expect(page.getByText('今日摄入')).toBeVisible()
    await expect(page.getByText('今日消耗')).toBeVisible()
    await expect(page.getByText('今日睡眠')).toBeVisible()
  })

  test('应该渲染体重和卡路里图表', async ({ page }) => {
    await expect(page.locator('canvas').first()).toBeVisible()
    await expect(page.locator('canvas').nth(1)).toBeVisible()
  })

  test('应该能够导航到各个功能页面', async ({ page }) => {
    await page.getByRole('link', { name: '身体数据' }).click()
    await expect(page).toHaveURL('/body-data')
    await page.goto('/dashboard')

    await page.getByRole('link', { name: '饮食管理' }).click()
    await expect(page).toHaveURL('/diet')
    await page.goto('/dashboard')

    await page.getByRole('link', { name: '运动管理' }).click()
    await expect(page).toHaveURL('/exercise')
    await page.goto('/dashboard')

    await page.getByRole('link', { name: '睡眠管理' }).click()
    await expect(page).toHaveURL('/sleep')
  })
})
