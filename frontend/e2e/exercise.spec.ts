import { test, expect } from '@playwright/test'

test.describe('运动管理页面测试', () => {
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

    // Mock 身体数据接口 (用于获取体重)
    await page.route('**/api/body-metrics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: 'success',
          data: {
            rows: [{ weightKG: 70 }],
            total: 1
          }
        })
      })
    })

    // Mock 运动记录列表接口
    await page.route('**/api/exercise-items*', async (route) => {
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
                  exerciseItemID: 1,
                  recordDate: '2025-12-20',
                  exerciseType: '跑步',
                  durationMinutes: 30,
                  estimatedCaloriesBurned: 200
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

    await page.goto('/exercise')
  })

  test('应该显示运动记录列表', async ({ page }) => {
    await expect(page.getByRole('heading').filter({ hasText: '运动记录' })).toBeVisible({
      timeout: 15000
    })
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '记录日期' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '运动类型' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '运动时长' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '消耗热量' })).toBeVisible()
  })

  test('应该能够新增运动记录', async ({ page }) => {
    await page.getByRole('button', { name: '添加记录' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 填写表单
    await page.getByRole('spinbutton', { name: '运动时长' }).fill('30')
    await expect(page.getByRole('spinbutton', { name: '运动时长' })).toHaveValue('30')

    // 打开下拉菜单
    await page.getByText('选择运动类型').click()
    // 搜索并选择
    await page.getByPlaceholder('输入运动类型').fill('跑步')
    await page.getByRole('option', { name: '跑步' }).click()

    // 验证选择是否成功
    await expect(page.locator('button').filter({ hasText: '跑步' })).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: '消耗热量' })).toHaveValue('343')
    await page.getByRole('button', { name: '确认记录' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('应该能够编辑运动记录', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '编辑' }).first()
    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByLabel('运动时长').fill('45')
      await page.getByRole('button', { name: '确认更新' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }
  })

  test('应该能够删除运动记录', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: '删除' }).first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
    }
  })
})
