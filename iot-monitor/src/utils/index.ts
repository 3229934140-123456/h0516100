import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDate(date: Date | string): Date {
  if (date instanceof Date) return date
  return new Date(date)
}

export function formatDateTime(date: Date | string) {
  return format(toDate(date), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
}

export function formatDate(date: Date | string) {
  return format(toDate(date), 'yyyy-MM-dd', { locale: zhCN })
}

export function formatRelativeTime(date: Date | string) {
  const d = toDate(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 30) return `${diffDay} 天前`
  return formatDate(d)
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'online':
    case 'running':
    case 'success':
      return 'text-emerald-400'
    case 'warning':
      return 'text-amber-400'
    case 'error':
    case 'fault':
    case 'failed':
    case 'critical':
      return 'text-red-400'
    case 'offline':
    case 'idle':
      return 'text-slate-400'
    case 'maintenance':
    case 'executing':
      return 'text-blue-400'
    case 'pending':
    case 'sent':
      return 'text-yellow-400'
    default:
      return 'text-slate-400'
  }
}

export function getStatusBgColor(status: string) {
  switch (status) {
    case 'online':
    case 'running':
    case 'success':
      return 'bg-emerald-500/10 border-emerald-500/30'
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/30'
    case 'error':
    case 'fault':
    case 'failed':
    case 'critical':
      return 'bg-red-500/10 border-red-500/30'
    case 'offline':
    case 'idle':
      return 'bg-slate-500/10 border-slate-500/30'
    case 'maintenance':
    case 'executing':
      return 'bg-blue-500/10 border-blue-500/30'
    case 'pending':
    case 'sent':
      return 'bg-yellow-500/10 border-yellow-500/30'
    default:
      return 'bg-slate-500/10 border-slate-500/30'
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警',
    error: '故障',
    running: '运行中',
    idle: '空闲',
    maintenance: '维护中',
    fault: '故障',
    pending: '待执行',
    sent: '已下发',
    executing: '执行中',
    success: '成功',
    failed: '失败',
    info: '提示',
    critical: '严重',
  }
  return labels[status] || status
}
