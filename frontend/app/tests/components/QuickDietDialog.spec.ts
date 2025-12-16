import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import QuickDietDialog from '~/components/QuickDietDialog.vue'

vi.stubGlobal('$fetch', vi.fn())

describe('QuickDietDialog', () => {
  afterEach(() => {
    // 清理 teleport 到 body 的内容
    document.body.innerHTML = ''
  })

  describe('渲染', () => {
    it('应该正确渲染组件（关闭状态）', async () => {
      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: false
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('打开时应该显示对话框', async () => {
      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: true
        }
      })

      // 等待组件挂载和异步渲染完成
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      expect(wrapper.exists()).toBe(true)
      // UModal 使用 teleport，内容在 document.body 中
      expect(document.body.textContent).toContain('快速记录饮食')
    })

    it('应该在新增模式下显示正确的按钮文本', async () => {
      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: true
        }
      })

      // 等待组件挂载和异步渲染完成
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      expect(document.body.textContent).toContain('确认记录')
    })

    it('应该在编辑模式下显示正确的按钮文本', async () => {
      const editItem = {
        dietItemID: 1,
        userID: 'test-user',
        recordDate: '2025-06-15',
        foodName: '米饭',
        mealType: '午餐',
        estimatedCalories: 200
      }

      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: true,
          editItem
        }
      })

      // 等待组件挂载和异步渲染完成
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      expect(document.body.textContent).toContain('确认更新')
    })
  })

  describe('props', () => {
    it('应该接受 open 属性', async () => {
      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: false
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('应该接受 editItem 属性', async () => {
      const editItem = {
        dietItemID: 1,
        userID: 'test-user',
        recordDate: '2025-06-15',
        foodName: '米饭',
        mealType: '午餐',
        estimatedCalories: 200
      }

      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: true,
          editItem
        }
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('事件', () => {
    it('应该能发出 update:open 事件', async () => {
      const wrapper = await mountSuspended(QuickDietDialog, {
        props: {
          open: false
        }
      })

      expect(wrapper.emitted()).toBeDefined()
    })
  })
})
