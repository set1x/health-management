<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { DateValue } from '@internationalized/date'
import { z } from 'zod'

interface Props {
  open: boolean
  editItem?: SleepRecord | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToast()
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// 默认使用今日日期方便快速记录
const calendarValue = shallowRef<DateValue>(getTodayDateValue())
const bedDateValue = shallowRef<DateValue>(getTodayDateValue())
const wakeDateValue = shallowRef<DateValue>(getTodayDateValue())
const bedTimeField = ref('')
const wakeTimeField = ref('')

const timePattern = /^\d{2}:\d{2}$/
const MAX_HOUR = 23
const MAX_MINUTE = 59

const combineDateAndTime = (date: DateValue | null, time: string) => {
  if (!date || !timePattern.test(time)) return ''
  return `${dateValueToString(date)}T${time}:00`
}

const cloneDateValue = (value?: DateValue | null) => {
  const target = value ?? getTodayDateValue()
  return stringToDateValue(dateValueToString(target))
}

const parseDateValueFromISO = (value?: string | null): DateValue => {
  if (!value) return getTodayDateValue()
  const [datePart] = value.split('T')
  if (!datePart) return getTodayDateValue()
  try {
    return stringToDateValue(datePart)
  } catch {
    return getTodayDateValue()
  }
}

const extractTimePart = (value?: string | null) => {
  if (!value || !value.includes('T')) return ''
  return value.slice(11, 16)
}

const formatManualTimeInput = (value: string) => {
  if (!value) return ''
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4)
  if (!digits) return ''
  let hours = digits.slice(0, 2)
  let minutes = digits.slice(2)

  if (hours.length === 1) {
    hours = `0${hours}`
  } else if (hours.length === 0) {
    hours = '00'
  }

  if (minutes.length === 0) {
    minutes = '00'
  } else if (minutes.length === 1) {
    minutes = `${minutes}0`
  }

  const hoursNumber = Math.min(parseInt(hours, 10) || 0, MAX_HOUR)
  const minutesNumber = Math.min(parseInt(minutes, 10) || 0, MAX_MINUTE)

  return `${String(hoursNumber).padStart(2, '0')}:${String(minutesNumber).padStart(2, '0')}`
}

const handleTimeBlur = (type: 'bed' | 'wake') => {
  if (type === 'bed') {
    bedTimeField.value = formatManualTimeInput(bedTimeField.value)
    return
  }
  wakeTimeField.value = formatManualTimeInput(wakeTimeField.value)
}

// 将表单值还原为后端期望的秒级 ISO 字符串
const normalizeDateTimePayload = (value?: string | null) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

const schema = z
  .object({
    bedTime: z.string().optional(),
    wakeTime: z.string().optional()
  })
  .refine(
    (data) => {
      if (!data.bedTime || !data.wakeTime) return true
      const bed = new Date(data.bedTime)
      const wake = new Date(data.wakeTime)
      if (Number.isNaN(bed.getTime()) || Number.isNaN(wake.getTime())) return true
      return bed.getTime() <= wake.getTime()
    },
    {
      message: '起床时间需要晚于或等于入睡时间',
      path: ['wakeTime']
    }
  )

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  bedTime: '',
  wakeTime: ''
})

const submitting = ref(false)

watch(
  [() => bedDateValue.value, () => bedTimeField.value],
  () => {
    state.bedTime = combineDateAndTime(bedDateValue.value, bedTimeField.value)
  },
  { immediate: true }
)

watch(
  [() => wakeDateValue.value, () => wakeTimeField.value],
  () => {
    state.wakeTime = combineDateAndTime(wakeDateValue.value, wakeTimeField.value)
  },
  { immediate: true }
)

const isEditMode = computed(() => !!props.editItem)
const dialogTitle = computed(() => (isEditMode.value ? '编辑睡眠记录' : '快速记录睡眠'))

// 打开弹窗时决定填充或重置表单数据
watch(isOpen, (val) => {
  if (!val) return
  const today = getTodayDateValue()
  if (props.editItem) {
    calendarValue.value = stringToDateValue(props.editItem.recordDate)
    if (props.editItem.bedTime) {
      bedDateValue.value = parseDateValueFromISO(props.editItem.bedTime)
      bedTimeField.value = extractTimePart(props.editItem.bedTime)
    } else {
      bedDateValue.value = cloneDateValue(calendarValue.value)
      bedTimeField.value = ''
    }
    if (props.editItem.wakeTime) {
      wakeDateValue.value = parseDateValueFromISO(props.editItem.wakeTime)
      wakeTimeField.value = extractTimePart(props.editItem.wakeTime)
    } else {
      wakeDateValue.value = cloneDateValue(calendarValue.value)
      wakeTimeField.value = ''
    }
  } else {
    calendarValue.value = today
    bedDateValue.value = cloneDateValue(today)
    wakeDateValue.value = cloneDateValue(today)
    bedTimeField.value = ''
    wakeTimeField.value = ''
  }
})

// 只在前端预估一次睡眠时长展示
const sleepDurationPreview = computed(() => {
  if (!state.bedTime || !state.wakeTime) return '--'
  const bed = new Date(state.bedTime)
  const wake = new Date(state.wakeTime)
  if (Number.isNaN(bed.getTime()) || Number.isNaN(wake.getTime())) return '--'
  const minutes = Math.max(0, Math.round((wake.getTime() - bed.getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return `${hours} 小时 ${restMinutes} 分`
})

// 统一处理新增与编辑请求，成功后回调刷新列表
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  submitting.value = true

  try {
    const userID = useCookie('userID')
    const token = useCookie('token')

    if (!userID.value || !token.value) {
      toast.add({ title: '请先登录', color: 'error' })
      return
    }

    const recordDate = dateValueToString(calendarValue.value)

    const body: SleepRequest = {
      userID: userID.value,
      recordDate,
      bedTime: normalizeDateTimePayload(event.data.bedTime),
      wakeTime: normalizeDateTimePayload(event.data.wakeTime)
    }

    if (isEditMode.value && props.editItem?.sleepItemID) {
      const response = await $fetch<{ code: number; msg?: string }>(
        `/api/sleep-items/${props.editItem.sleepItemID}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token.value}`
          },
          body
        }
      )

      if (response.code === 1) {
        toast.add({ title: '睡眠记录更新成功', color: 'success' })
        emit('success')
        isOpen.value = false
      } else {
        toast.add({ title: response.msg || '更新失败', color: 'error' })
      }
    } else {
      const response = await $fetch<{ code: number; msg?: string }>(`/api/sleep-items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        body
      })

      if (response.code === 1) {
        toast.add({ title: '睡眠记录已添加', color: 'success' })
        emit('success')
        isOpen.value = false
      } else {
        toast.add({ title: response.msg || '记录失败', color: 'error' })
      }
    }
  } catch (error) {
    const err = error as { data?: { message?: string }; message?: string }
    toast.add({
      title: err.data?.message || err.message || (isEditMode.value ? '更新失败' : '记录失败'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="dialogTitle"
    description="记录入睡与起床时间，方便追踪睡眠情况"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body="{ close }">
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="记录日期" name="recordDate">
          <DatePicker v-model="calendarValue" block />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="入睡日期" name="bedDate">
            <DatePicker v-model="bedDateValue" block />
          </UFormField>

          <UFormField label="入睡时间" name="bedTime">
            <UInput
              v-model="bedTimeField"
              placeholder="HH:MM"
              inputmode="numeric"
              @blur="() => handleTimeBlur('bed')"
            >
              <template #leading>
                <UIcon name="heroicons:clock" />
              </template>
            </UInput>
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="起床日期" name="wakeDate">
            <DatePicker v-model="wakeDateValue" block />
          </UFormField>

          <UFormField label="起床时间" name="wakeTime">
            <UInput
              v-model="wakeTimeField"
              placeholder="HH:MM"
              inputmode="numeric"
              @blur="() => handleTimeBlur('wake')"
            >
              <template #leading>
                <UIcon name="heroicons:clock" />
              </template>
            </UInput>
          </UFormField>
        </div>

        <UCard v-if="state.bedTime && state.wakeTime">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-sm font-semibold">
              <UIcon name="mdi:sleep" />
              预估睡眠时长
            </span>
            <UBadge color="primary" variant="soft">{{ sleepDurationPreview }}</UBadge>
          </div>
        </UCard>

        <UAlert
          icon="heroicons:information-circle"
          color="primary"
          variant="soft"
          title="提示"
          description="若不填写具体时间，系统将仅记录日期信息"
        />

        <div class="flex justify-end gap-2 pt-4">
          <UButton color="neutral" variant="outline" @click="close"> 取消 </UButton>
          <UButton type="submit" color="primary" :loading="submitting">
            <template #leading>
              <UIcon name="heroicons:check" />
            </template>
            {{
              submitting
                ? isEditMode
                  ? '更新中...'
                  : '记录中...'
                : isEditMode
                  ? '确认更新'
                  : '确认记录'
            }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
