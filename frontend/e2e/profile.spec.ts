import { test, expect } from '@playwright/test'

test.describe('个人资料页面测试', () => {
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
    await page.route('**/api/user/profile*', async (route) => {
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

    // Mock 修改密码接口
    await page.route('**/api/auth/password/reset', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: 'success',
          data: null
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

    await page.goto('/profile')
  })

  test('应该显示个人基本信息', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '个人资料' })).toBeVisible()
    await expect(page.getByText('基本信息')).toBeVisible()
    await expect(page.getByText('健康目标')).toBeVisible()
  })

  test('应该能够打开编辑个人信息对话框', async ({ page }) => {
    await page.getByRole('button', { name: '编辑', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('昵称')).toBeVisible()
    await expect(page.getByLabel('性别')).toBeVisible()

    // 关闭对话框
    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('应该能够打开设置健康目标对话框', async ({ page }) => {
    await page.getByRole('button', { name: '设置目标' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('目标体重（kg）')).toBeVisible()
    await expect(page.getByLabel('每日卡路里摄入目标（kcal）')).toBeVisible()

    // 尝试修改
    await page.getByLabel('目标体重（kg）').fill('65')
    await page.getByRole('button', { name: '保存目标' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('应该能够修改密码', async ({ page }) => {
    // 打开编辑对话框
    await page.getByRole('button', { name: '编辑', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByPlaceholder('请输入新密码').fill('newpassword123')
    await page.getByPlaceholder('请再次输入新密码').fill('newpassword123')
    await page.getByRole('button', { name: '更新密码' }).click()

    // 验证成功提示
    await expect(page.getByText('密码已更新').first()).toBeVisible()
  })

  test('退出登录流程', async ({ page }) => {
    await page.locator('button[aria-haspopup="menu"]').last().click()
    await expect(page.getByRole('menuitem', { name: '退出登录' })).toBeVisible()
    await page.getByRole('menuitem', { name: '退出登录' }).click()

    await expect(page).toHaveURL('/login')
  })
})
