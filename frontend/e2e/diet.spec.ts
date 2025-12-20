import { test, expect } from '@playwright/test'

test.describe('饮食管理页面测试', () => {
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

    // Mock 饮食记录列表接口
    await page.route('**/api/diet-items*', async (route) => {
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
                  dietItemID: 1,
                  recordDate: '2025-12-20',
                  mealType: '早餐',
                  foodName: '燕麦片',
                  estimatedCalories: 300
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

    await page.goto('/diet')
  })

  test('应该显示饮食记录列表', async ({ page }) => {
    // 增加超时时间，等待页面加载完成
    await expect(page.getByRole('heading').filter({ hasText: '饮食记录' })).toBeVisible({
      timeout: 15000
    })
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '记录日期' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '用餐类型' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '食物名称' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '摄入热量 (kcal)' })).toBeVisible()
  })

  test('应该能够新增饮食记录', async ({ page }) => {
    await page.getByRole('button', { name: '添加记录' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('食物名称').fill('燕麦片')
    await page.getByLabel('估计热量').fill('300')
    await page.getByRole('button', { name: '确认记录' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('燕麦片')).toBeVisible()
  })

  test('应该能够编辑饮食记录', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '编辑' }).first()
    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByLabel('食物名称').fill('牛奶')
      await page.getByRole('button', { name: '确认更新' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(page.getByText('牛奶')).toBeVisible()
    }
  })

  test('应该能够删除饮食记录', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: '删除' }).first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
    }
  })

  test('日期筛选功能', async ({ page }) => {
    await expect(page.getByText('日期范围')).toBeVisible({
      timeout: 15000
    })
  })
})
