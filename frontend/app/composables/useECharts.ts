/**
 * 图表状态管理
 */

import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 只注册一次
let registered = false

export function useECharts() {
  if (!registered) {
    echarts.use([
      TitleComponent,
      TooltipComponent,
      GridComponent,
      LegendComponent,
      LineChart,
      CanvasRenderer
    ])
    registered = true
  }

  const initChart = (container: HTMLElement) => {
    return echarts.init(container)
  }

  const disposeChart = (chart: echarts.ECharts | null) => {
    if (chart) {
      chart.dispose()
    }
  }

  return {
    echarts,
    initChart,
    disposeChart
  }
}
