<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { FormSubmitEvent } from '#ui/types'
import { z } from 'zod'

definePageMeta({
  layout: 'blank'
})

const { login, register } = useAuth()
const route = useRoute()
const isRegister = ref(route.query.mode === 'register')

// 登录表单 Schema
const loginSchema = z.object({
  email: z.email('请输入正确的邮箱格式'),
  password: z.string().min(1, '请输入密码').min(6, '密码长度至少 6 个字符')
})

// 注册表单 Schema
const registerSchema = z
  .object({
    nickname: z
      .string()
      .min(1, '请输入昵称')
      .min(2, '昵称长度至少 2 个字符')
      .max(20, '昵称长度最多 20 个字符'),
    email: z.email('请输入正确的邮箱格式'),
    password: z.string().min(1, '请输入密码').min(6, '密码长度至少 6 个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
    gender: z.enum(['男', '女'], { message: '请选择性别' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword']
  })

type LoginSchema = z.output<typeof loginSchema>
type RegisterSchema = z.output<typeof registerSchema>

// 登录表单状态
const loginState = reactive<LoginSchema>({
  email: '',
  password: ''
})

// 注册表单状态
const registerState = reactive<RegisterSchema>({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '男'
})

// 使用 DateValue 类型，默认设置为今天
const calendarValue = shallowRef<DateValue>(getTodayDateValue())
const dateOfBirthError = ref('')

function validateDateOfBirth(): boolean {
  if (!calendarValue.value) {
    dateOfBirthError.value = '请选择出生日期'
    return false
  }
  dateOfBirthError.value = ''
  return true
}

function toggleMode() {
  isRegister.value = !isRegister.value
  resetForm()
}

function resetForm() {
  // 重置登录表单
  loginState.email = ''
  loginState.password = ''

  // 重置注册表单
  registerState.nickname = ''
  registerState.email = ''
  registerState.password = ''
  registerState.confirmPassword = ''
  registerState.gender = '男'

  // 重置日期选择器
  calendarValue.value = getTodayDateValue()
  dateOfBirthError.value = ''
}

function formatDateOfBirth(): string {
  if (!calendarValue.value) return '请选择出生日期'
  return dateValueToString(calendarValue.value)
}

async function onLoginSubmit(event: FormSubmitEvent<LoginSchema>) {
  const loginData = {
    email: event.data.email,
    password: event.data.password
  }

  const success = await login(loginData)
  if (success) {
    await navigateTo('/dashboard')
  }
}

async function onRegisterSubmit(event: FormSubmitEvent<RegisterSchema>) {
  // 验证出生日期
  if (!validateDateOfBirth()) {
    return
  }

  const dateOfBirth = calendarValue.value ? dateValueToString(calendarValue.value) : ''
  const registerData = {
    email: event.data.email,
    password: event.data.password,
    nickname: event.data.nickname,
    gender: event.data.gender,
    dateOfBirth
  }

  const success = await register(registerData)
  if (success) {
    isRegister.value = false
    resetForm()
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-center text-2xl font-bold">
          {{ isRegister ? '注册' : '登录' }}健康生活管理系统
        </h2>
      </template>

      <!-- 登录表单 -->
      <UForm
        v-if="!isRegister"
        :schema="loginSchema"
        :state="loginState"
        class="space-y-4"
        @submit="onLoginSubmit"
      >
        <UFormField label="邮箱" name="email">
          <UInput v-model="loginState.email" type="email" placeholder="请输入邮箱" size="lg">
            <template #leading>
              <UIcon name="i-heroicons-envelope" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="密码" name="password">
          <UInput v-model="loginState.password" type="password" placeholder="请输入密码" size="lg">
            <template #leading>
              <UIcon name="i-heroicons-lock-closed" />
            </template>
          </UInput>
        </UFormField>

        <div class="pt-2">
          <UButton type="submit" block size="lg" color="primary">
            <template #leading>
              <UIcon name="i-heroicons-check" />
            </template>
            立即登录
          </UButton>
        </div>

        <UButton variant="ghost" block color="neutral" @click="toggleMode">
          没有账户？点击注册
        </UButton>
      </UForm>

      <!-- 注册表单 -->
      <UForm
        v-else
        :schema="registerSchema"
        :state="registerState"
        class="space-y-4"
        @submit="onRegisterSubmit"
      >
        <UFormField label="昵称" name="nickname">
          <UInput v-model="registerState.nickname" placeholder="请输入昵称" size="lg">
            <template #leading>
              <UIcon name="i-heroicons-user" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="邮箱" name="email">
          <UInput v-model="registerState.email" type="email" placeholder="请输入邮箱" size="lg">
            <template #leading>
              <UIcon name="i-heroicons-envelope" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="密码" name="password">
          <UInput
            v-model="registerState.password"
            type="password"
            placeholder="请输入密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-heroicons-lock-closed" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="确认密码" name="confirmPassword">
          <UInput
            v-model="registerState.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-heroicons-lock-closed" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="性别" name="gender">
          <div class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="registerState.gender" type="radio" value="男" class="h-4 w-4" />
              <span class="text-sm">男</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="registerState.gender" type="radio" value="女" class="h-4 w-4" />
              <span class="text-sm">女</span>
            </label>
          </div>
        </UFormField>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium">出生日期</label>
          <DatePicker
            v-model="calendarValue"
            block
            size="lg"
            :placeholder="formatDateOfBirth()"
            :min-value="createCalendarDate(1900, 1, 1)"
            :max-value="createCalendarDate(2050, 12, 31)"
          />
          <p v-if="dateOfBirthError" class="text-sm">
            {{ dateOfBirthError }}
          </p>
        </div>

        <div class="pt-2">
          <UButton type="submit" block size="lg" color="primary">
            <template #leading>
              <UIcon name="i-heroicons-check" />
            </template>
            注册账户
          </UButton>
        </div>

        <UButton variant="ghost" block color="neutral" @click="toggleMode">
          已有账户？点击登录
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
