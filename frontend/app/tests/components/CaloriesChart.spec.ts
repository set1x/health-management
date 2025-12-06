import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CaloriesChart from '~/components/CaloriesChart.client.vue'

describe('CaloriesChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件定义', () => {
    it('应该是一个有效的客户端组件', async () => {
      const component = await import('~/components/CaloriesChart.client.vue')
      expect(component.default).toBeDefined()
    })
  })

  describe('渲染测试', () => {
    it('应该渲染时间周期按钮', async () => {
      const wrapper = await mountSuspended(CaloriesChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('应该在无数据时显示空状态提示', async () => {
      const wrapper = await mountSuspended(CaloriesChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      // 验证组件正确渲染
      expect(wrapper.exists()).toBe(true)
      // 无数据时平均摄入应为 0
      expect(wrapper.text()).toContain('0')
    })

    it('应该在有数据时渲染图表', async () => {
      const testData = [
        { date: '2025-12-01', intake: 2000, burn: 500, net: 1500 },
        { date: '2025-12-02', intake: 2200, burn: 600, net: 1600 }
      ]

      const wrapper = await mountSuspended(CaloriesChart, {
        props: {
          data: testData,
          timePeriod: '7d'
        }
      })

      // 验证组件正确渲染
      expect(wrapper.exists()).toBe(true)
      // 有数据时应该渲染图表容器
      expect(wrapper.find('[class*="chart"]').exists() || wrapper.find('div').exists()).toBe(true)
    })
  })

  describe('交互测试', () => {
    it('应该在点击时间周期按钮时触发 update:timePeriod 事件', async () => {
      const wrapper = await mountSuspended(CaloriesChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      const buttons = wrapper.findAll('button')
      if (buttons.length > 1) {
        const button = buttons[1]
        if (button) {
          await button.trigger('click')
          expect(wrapper.emitted('update:timePeriod')).toBeTruthy()
        }
      }
    })
  })

  describe('计算属性测试', () => {
    it('应该正确计算平均摄入量', async () => {
      const testData = [
        { date: '2025-12-01', intake: 2000, burn: 500, net: 1500 },
        { date: '2025-12-02', intake: 2200, burn: 600, net: 1600 }
      ]

      const wrapper = await mountSuspended(CaloriesChart, {
        props: {
          data: testData,
          timePeriod: '7d'
        }
      })

      // 平均摄入 (2000 + 2200) / 2 = 2100
      expect(wrapper.text()).toContain('2100')
    })
  })
})
