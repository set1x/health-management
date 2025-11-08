/**
 * 日期工具函数
 */

import type { DateValue } from '@internationalized/date'
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date'

/**
 * 获取今日日期 (DateValue 类型，使用所在地时区)
 */
export function getTodayDateValue(): DateValue {
  return today(getLocalTimeZone())
}

/**
 * 将 DateValue 转换为字符串 (YYYY-MM-DD 格式)
 */
export function dateValueToString(date: DateValue): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

/**
 * 将字符串转换为 DateValue (YYYY-MM-DD 格式)
 */
export function stringToDateValue(dateString: string): DateValue {
  return parseDate(dateString)
}

/**
 * 创建 CalendarDate 对象
 */
export function createCalendarDate(year: number, month: number, day: number): CalendarDate {
  return new CalendarDate(year, month, day)
}

/**
 * 格式化显示日期（中文格式：2024 年 1 月 1 日）
 * 支持 DateValue 和字符串
 */
export function formatDisplayDate(date: DateValue | string): string {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('zh-CN')
  }
  return `${date.year} 年 ${date.month} 月 ${date.day} 日`
}

/**
 * 格式化简短日期（MM/DD 格式）
 * 支持 DateValue 和字符串
 */
export function formatShortDate(date: DateValue | string): string {
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    return dateObj
      .toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric'
      })
      .replace('月', '/')
      .replace('日', '')
  }
  return `${date.month}/${date.day}`
}

/**
 * 检查 DateValue 是否为今天
 */
export function isTodayDateValue(date: DateValue): boolean {
  const today = getTodayDateValue()
  return date.year === today.year && date.month === today.month && date.day === today.day
}
