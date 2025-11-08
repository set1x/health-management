<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { DateValue } from '@internationalized/date'

// TableColumn 类型别名
type TableColumn<T> = ColumnDef<T>

interface PageInfo {
  current: number
  size: number
  total: number
}

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const toast = useToast()

const showAIChatPalette = ref(false)
const exerciseList = ref<ExerciseRecord[]>([])
const todayExerciseList = ref<ExerciseRecord[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingItem = ref<ExerciseRecord | null>(null)

const pageInfo = reactive<PageInfo>({
  current: 1,
  size: 10,
  total: 0
})

// 筛选器状态
const filterExerciseType = ref<string | undefined>(undefined)

// 日期配置
const startDateCalendar = shallowRef<DateValue | null>(null)
const endDateCalendar = shallowRef<DateValue | null>(null)

// 运动类型选项
const exerciseTypeOptions = [
  { label: '跑步', value: '跑步', icon: 'i-heroicons-bolt' },
  { label: '游泳', value: '游泳', icon: 'i-heroicons-bolt' },
  { label: '骑行', value: '骑行', icon: 'i-heroicons-bolt' },
  { label: '篮球', value: '篮球', icon: 'i-heroicons-trophy' },
  { label: '足球', value: '足球', icon: 'i-heroicons-trophy' },
  { label: '健身', value: '健身', icon: 'i-heroicons-fire' },
  { label: '瑜伽', value: '瑜伽', icon: 'i-heroicons-heart' },
  { label: '其他', value: '其他', icon: 'i-heroicons-ellipsis-horizontal-circle' }
]

// 今日统计计算属性
const todayCalories = computed(() => {
  return todayExerciseList.value.reduce(
    (sum, exercise) => sum + (exercise.estimatedCaloriesBurned || 0),
    0
  )
})

const todayDuration = computed(() => {
  return todayExerciseList.value.reduce((sum, exercise) => sum + (exercise.durationMinutes || 0), 0)
})

const todayCount = computed(() => {
  return todayExerciseList.value.length
})

// 健康目标
const healthGoals = reactive({ dailyCaloriesBurn: null as number | null })

const loadHealthGoals = () => {
  if (!import.meta.client) return
  const savedGoals = localStorage.getItem('healthGoals')
  if (savedGoals) {
    const parsed = JSON.parse(savedGoals)
    healthGoals.dailyCaloriesBurn = parsed.dailyCaloriesBurn
  }
}

// 获取运动类型的图标
const getExerciseTypeIcon = (type: string) => {
  const option = exerciseTypeOptions.find((o) => o.value === type)
  return option?.icon || 'i-heroicons-bolt'
}

// 运动强度等级
const getIntensityLevel = (
  caloriesBurned: number | null,
  duration: number | null
): { text: string; color: 'success' | 'warning' | 'error' } => {
  if (!caloriesBurned || !duration) return { text: '未知', color: 'success' }
  const intensity = caloriesBurned / duration
  if (intensity < 5) return { text: '轻度', color: 'success' }
  if (intensity < 10) return { text: '中度', color: 'warning' }
  return { text: '高强度', color: 'error' }
}

// 表格列定义
const columns: TableColumn<ExerciseRecord>[] = [
  {
    accessorKey: 'recordDate',
    header: '记录日期',
    cell: ({ row }) => {
      return h(
        'span',
        {
          class:
            'rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        },
        formatDisplayDate(row.original.recordDate)
      )
    }
  },
  {
    accessorKey: 'exerciseType',
    header: '运动类型',
    cell: ({ row }) => {
      const icon = getExerciseTypeIcon(row.original.exerciseType)
      return h(
        'span',
        {
          class:
            'inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        },
        [h('i', { class: icon }), row.original.exerciseType]
      )
    }
  },
  {
    accessorKey: 'durationMinutes',
    header: '运动时长',
    cell: ({ row }) => {
      return h('span', { class: 'font-medium' }, `${row.original.durationMinutes} 分钟`)
    }
  },
  {
    accessorKey: 'estimatedCaloriesBurned',
    header: '消耗热量',
    cell: ({ row }) => {
      const calories = row.original.estimatedCaloriesBurned ?? 0
      const level = getIntensityLevel(calories, row.original.durationMinutes)
      const levelColorClasses: Record<string, string> = {
        success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      }
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-bold text-orange-600' }, `${calories} kcal`),
        h(
          'span',
          {
            class: `rounded-md px-2 py-0.5 text-xs font-medium ${levelColorClasses[level.color]}`
          },
          level.text
        )
      ])
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(
          'button',
          {
            class: 'text-primary-600 hover:text-primary-700 text-sm font-medium',
            onClick: () => openEditDialog(row.original)
          },
          '编辑'
        ),
        h(
          'button',
          {
            class: 'text-red-600 hover:text-red-700 text-sm font-medium',
            onClick: () => deleteItem(row.original.exerciseItemID!)
          },
          '删除'
        )
      ])
    }
  }
]

// 日期格式化
const formatDate = (date: DateValue | null, placeholder: string): string => {
  if (!date) return placeholder
  return dateValueToString(date)
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const userID = useCookie('userID')
    const token = useCookie('token')

    if (!userID.value || !token.value) {
      throw new Error('用户未登录')
    }

    const params: Record<string, string | number> = {
      page: pageInfo.current,
      pageSize: pageInfo.size,
      userID: userID.value
    }

    // 处理日期筛选
    if (startDateCalendar.value || endDateCalendar.value) {
      const startStr = startDateCalendar.value ? dateValueToString(startDateCalendar.value) : null
      const endStr = endDateCalendar.value
        ? dateValueToString(endDateCalendar.value)
        : dateValueToString(getTodayDateValue())

      // 如果只选了开始日期，使用默认结束日期（今天）
      if (startStr && endStr) {
        // 验证日期范围：开始日期不能晚于结束日期
        if (startStr > endStr) {
          toast.add({
            title: '日期范围错误',
            description: '开始日期不能晚于结束日期',
            color: 'error'
          })
          loading.value = false
          return
        }
        params.startDate = startStr
        params.endDate = endStr
      }
    }

    if (filterExerciseType.value) {
      params.exerciseType = filterExerciseType.value
    }

    const response = await $fetch<{
      code: number
      data: { rows: ExerciseRecord[]; total: number }
    }>('/api/exercise-items', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      params
    })

    if (response.code === 1 && response.data) {
      exerciseList.value = response.data.rows || []
      pageInfo.total = response.data.total || 0
    } else {
      throw new Error('数据格式错误')
    }
  } catch {
    toast.add({ title: '加载运动数据失败', color: 'error' })
    exerciseList.value = []
    pageInfo.total = 0
  } finally {
    loading.value = false
  }
}

// 加载今日数据
const loadTodayData = async () => {
  try {
    const userID = useCookie('userID')
    const token = useCookie('token')

    if (!userID.value || !token.value) {
      todayExerciseList.value = []
      return
    }

    const todayLocal = dateValueToString(getTodayDateValue())

    const response = await $fetch<{ code: number; data: { rows: ExerciseRecord[] } }>(
      '/api/exercise-items',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        params: {
          userID: userID.value,
          startDate: todayLocal,
          endDate: todayLocal,
          page: 1,
          pageSize: 1000
        }
      }
    )

    if (response.code === 1 && response.data) {
      todayExerciseList.value = response.data.rows || []
    }
  } catch {
    todayExerciseList.value = []
  }
}

// 打开添加对话框
const openAddDialog = () => {
  editingItem.value = null
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (item: ExerciseRecord) => {
  editingItem.value = item
  showDialog.value = true
}

// 对话框成功回调
const handleDialogSuccess = () => {
  loadData()
  loadTodayData()
}

// 删除
const deleteItem = async (id: number) => {
  if (!confirm('确认删除这条记录吗？')) return

  try {
    const token = useCookie('token')
    if (!token.value) {
      toast.add({ title: '请先登录', color: 'error' })
      return
    }

    await $fetch(`/api/exercise-items/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    toast.add({ title: '删除成功', color: 'success' })
    loadData()
    loadTodayData()
  } catch {
    toast.add({ title: '删除失败', color: 'error' })
  }
}

// 重置筛选器
const resetFilter = () => {
  startDateCalendar.value = null
  endDateCalendar.value = null
  filterExerciseType.value = undefined
  pageInfo.current = 1
  loadData()
}

// 分页变化
const handlePageChange = (page: number) => {
  pageInfo.current = page
  loadData()
}

// 生命周期
onMounted(() => {
  loadHealthGoals()
  loadData()
  loadTodayData()
})
</script>

<template>
  <UPage>
    <UPageHeader title="运动管理" description="记录和管理您的运动数据">
      <template #icon>
        <UIcon name="i-heroicons-bolt" />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- 统计卡片 -->
      <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- 今日消耗卡路里 -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-orange-500 p-3 text-white">
              <UIcon name="i-heroicons-fire" class="text-2xl" />
            </div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ todayCalories }}
              </div>
              <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                今日消耗卡路里（kcal）
              </div>
              <div v-if="healthGoals.dailyCaloriesBurn" class="text-xs text-gray-400">
                目标: {{ healthGoals.dailyCaloriesBurn }} kcal
              </div>
              <div v-else class="text-xs text-gray-400">目标: 未设置</div>
            </div>
          </div>
        </UCard>

        <!-- 今日运动时长 -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-blue-500 p-3 text-white">
              <UIcon name="i-heroicons-clock" class="text-2xl" />
            </div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ todayDuration }}
              </div>
              <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">今日运动时长（分钟）</div>
            </div>
          </div>
        </UCard>

        <!-- 今日运动次数 -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-green-500 p-3 text-white">
              <UIcon name="i-heroicons-trophy" class="text-2xl" />
            </div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ todayCount }}</div>
              <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">今日运动次数</div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 筛选器 -->
      <UCard class="mb-8">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="flex items-center gap-2 text-lg font-semibold">
              <UIcon name="i-heroicons-funnel" />
              数据筛选
            </h3>
          </div>
        </template>

        <div class="flex flex-wrap gap-4">
          <!-- 开始日期 -->
          <div class="min-w-[200px] flex-1">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              开始日期
            </label>
            <DatePicker
              v-model="startDateCalendar"
              block
              :placeholder="formatDate(startDateCalendar, '选择开始日期')"
              @update:model-value="loadData"
            />
          </div>

          <!-- 结束日期 -->
          <div class="min-w-[200px] flex-1">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              结束日期
            </label>
            <DatePicker
              v-model="endDateCalendar"
              block
              :placeholder="formatDate(endDateCalendar, '选择结束日期')"
              @update:model-value="loadData"
            />
          </div>

          <!-- 运动类型 -->
          <div class="min-w-[200px] flex-1">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              运动类型
            </label>
            <UInputMenu
              v-model="filterExerciseType"
              :items="exerciseTypeOptions"
              value-key="value"
              placeholder="全部类型"
              @change="loadData"
            >
              <template #leading="{ modelValue }">
                <UIcon v-if="modelValue" :name="getExerciseTypeIcon(modelValue)" />
              </template>
            </UInputMenu>
          </div>

          <!-- 按钮 -->
          <div class="flex items-end gap-2">
            <UButton color="neutral" variant="outline" @click="resetFilter">重置</UButton>
          </div>
        </div>
      </UCard>

      <!-- 数据表格 -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">运动记录</h3>
            <UButton color="primary" @click="openAddDialog">
              <template #leading>
                <UIcon name="i-heroicons-plus" />
              </template>
              添加记录
            </UButton>
          </div>
        </template>

        <UTable :data="exerciseList" :columns="columns" :loading="loading" />

        <template #footer>
          <div class="flex items-center justify-center border-t pt-4">
            <UPagination
              v-model:page="pageInfo.current"
              :total="pageInfo.total"
              :items-per-page="pageInfo.size"
              @update:page="handlePageChange"
            />
          </div>
        </template>
      </UCard>

      <!-- 运动记录对话框 -->
      <QuickExerciseDialog
        v-model:open="showDialog"
        :edit-item="editingItem"
        @success="handleDialogSuccess"
      />

      <!-- AI 聊天面板 -->
      <AIChatPalette v-model:open="showAIChatPalette" />
    </UPageBody>
  </UPage>
</template>
