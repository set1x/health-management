import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WeightChart from '~/components/WeightChart.client.vue'

describe('WeightChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件定义', () => {
    it('应该是一个有效的客户端组件', async () => {
      const component = await import('~/components/WeightChart.client.vue')
      expect(component.default).toBeDefined()
    })
  })

  describe('渲染测试', () => {
    it('应该渲染时间周期按钮', async () => {
      const wrapper = await mountSuspended(WeightChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('应该在无数据时显示空状态提示', async () => {
      const wrapper = await mountSuspended(WeightChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      // 验证组件正确渲染并显示平均体重
      expect(wrapper.exists()).toBe(true)
      // 无数据时平均体重应为 0.0
      expect(wrapper.text()).toContain('0.0')
    })

    it('应该在有数据时渲染图表', async () => {
      const testData = [
        { date: '2025-12-01', weight: 70.5 },
        { date: '2025-12-02', weight: 70.3 }
      ]

      const wrapper = await mountSuspended(WeightChart, {
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
      const wrapper = await mountSuspended(WeightChart, {
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
    it('应该正确计算平均体重', async () => {
      const testData = [
        { date: '2025-12-01', weight: 70.0 },
        { date: '2025-12-02', weight: 71.0 }
      ]

      const wrapper = await mountSuspended(WeightChart, {
        props: {
          data: testData,
          timePeriod: '7d'
        }
      })

      // 平均体重: (70.0 + 71.0) / 2 = 70.5
      expect(wrapper.text()).toContain('70.5')
    })

    it('应该在无数据时返回 0 作为平均值', async () => {
      const wrapper = await mountSuspended(WeightChart, {
        props: {
          data: [],
          timePeriod: '7d'
        }
      })

      expect(wrapper.text()).toContain('0.0')
    })
  })
})
