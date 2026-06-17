import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Mail,
  Smartphone,
  MessageSquare,
  Filter,
  Search,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { mockNotifications } from '../data/mockData'
import { formatDateTime, cn } from '../utils'
import type { AlertNotification } from '../types'

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      n.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'unread'
        ? !n.read
        : n.resolved
    return matchesSearch && matchesFilter
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const unresolvedCount = notifications.filter((n) => !n.resolved).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const resolveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, resolved: true, read: true } : n)),
    )
  }

  const getLevelIcon = (level: AlertNotification['level']) => {
    switch (level) {
      case 'critical':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      default:
        return Info
    }
  }

  const getLevelStyles = (level: AlertNotification['level']) => {
    switch (level) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/5 text-red-400'
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-400'
      default:
        return 'border-blue-500/30 bg-blue-500/5 text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">通知消息</h1>
          <p className="text-dark-400 mt-1">
            查看系统告警通知，及时处理设备异常
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4" />
            全部已读
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">全部消息</p>
              <p className="text-3xl font-bold text-white mt-1">{notifications.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">未读消息</p>
              <p className="text-3xl font-bold text-white mt-1">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">待处理</p>
              <p className="text-3xl font-bold text-white mt-1">{unresolvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="搜索通知内容、设备名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">全部消息</option>
              <option value="unread">未读消息</option>
              <option value="resolved">已处理</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((n) => {
            const LevelIcon = getLevelIcon(n.level)
            return (
              <div
                key={n.id}
                className={cn(
                  'border rounded-xl p-4 transition-all',
                  getLevelStyles(n.level),
                  !n.read && 'ring-1 ring-offset-1 ring-offset-dark-800',
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      n.level === 'critical'
                        ? 'bg-red-500/20'
                        : n.level === 'warning'
                        ? 'bg-amber-500/20'
                        : 'bg-blue-500/20',
                    )}
                  >
                    <LevelIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white">{n.ruleName}</h4>
                          {!n.read && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                              新消息
                            </span>
                          )}
                          {n.resolved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              已处理
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/devices/${n.deviceId}`}
                          className="text-sm text-primary-400 hover:text-primary-300 mt-0.5 inline-block"
                        >
                          {n.deviceName}
                        </Link>
                        <p className="text-sm text-dark-300 mt-2">{n.message}</p>
                      </div>
                      <span className="text-xs text-dark-400 whitespace-nowrap">
                        {formatDateTime(n.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-dark-400">通知渠道：</span>
                        <div className="flex gap-1.5">
                          {n.channels.includes('sms') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-dark-700 text-dark-300">
                              <Smartphone className="w-3 h-3" />
                              短信
                            </span>
                          )}
                          {n.channels.includes('email') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-dark-700 text-dark-300">
                              <Mail className="w-3 h-3" />
                              邮件
                            </span>
                          )}
                          {n.channels.includes('in_app') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-dark-700 text-dark-300">
                              <MessageSquare className="w-3 h-3" />
                              站内信
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(n.id)}
                          >
                            <Check className="w-4 h-4" />
                            标记已读
                          </Button>
                        )}
                        {!n.resolved && (
                          <Button size="sm" onClick={() => resolveNotification(n.id)}>
                            处理完成
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无通知消息</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
