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
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store'
import { formatDateTime, cn } from '../utils'
import type { AlertNotification, AlertLevel, HitConditionDetail } from '../types'

export default function Notifications() {
  const {
    state,
    markNotificationRead,
    markAllNotificationsRead,
    resolveNotification,
  } = useStore()
  const notifications = state.notifications
  const devices = state.devices
  const rules = state.alertRules

  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'resolved'>('all')
  const [ruleFilter, setRuleFilter] = useState<string>('all')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | AlertLevel>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<AlertNotification | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolveNoteError, setResolveNoteError] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set())

  const toggleNoteExpanded = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleConditions = (id: string) => {
    setExpandedConditions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      n.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'unread'
        ? !n.read
        : n.resolved

    const matchesRule = ruleFilter === 'all' ? true : n.ruleId === ruleFilter
    const matchesDevice = deviceFilter === 'all' ? true : n.deviceId === deviceFilter
    const matchesLevel = levelFilter === 'all' ? true : n.level === levelFilter

    return matchesSearch && matchesStatus && matchesRule && matchesDevice && matchesLevel
  })

  const unreadCount = state.notifications.filter((n) => !n.read).length
  const unresolvedCount = notifications.filter((n) => !n.resolved).length

  const getLevelIcon = (level: AlertNotification['level']) => {
    switch (level) {
      case 'critical': return AlertCircle
      case 'warning': return AlertTriangle
      default: return Info
    }
  }

  const getLevelLabel = (level: AlertNotification['level']) => {
    switch (level) {
      case 'critical': return '严重'
      case 'warning': return '警告'
      default: return '提示'
    }
  }

  const getLevelStyles = (level: AlertNotification['level'], read: boolean, resolved: boolean) => {
    const baseOpacity = resolved ? 'opacity-80' : read ? '' : ''
    switch (level) {
      case 'critical':
        return cn('border-2 border-red-500/50 bg-red-500/10', !read && !resolved && 'ring-2 ring-red-500/30', baseOpacity)
      case 'warning':
        return cn('border-2 border-amber-500/50 bg-amber-500/10', !read && !resolved && 'ring-2 ring-amber-500/30', baseOpacity)
      default:
        return cn('border border-dark-600 bg-dark-700/50', !read && !resolved && 'ring-2 ring-blue-500/30', baseOpacity)
    }
  }

  const getLevelBadgeStyles = (level: AlertNotification['level']) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
    }
  }

  const getMetricLabel = (m: string) =>
    m === 'temperature' ? '温度' : m === 'battery' ? '电量' : '信号'

  const getOpLabel = (op: string) =>
    op === '>' ? '超过' : op === '<' ? '低于' : op === '>=' ? '不低于' : op === '<=' ? '不高于' : op === '==' ? '等于' : '不等于'

  const openResolveModal = (notification: AlertNotification) => {
    setCurrentNotification(notification)
    setResolveNote('')
    setResolveNoteError('')
    setResolveModalOpen(true)
  }

  const closeResolveModal = () => {
    setResolveModalOpen(false)
    setCurrentNotification(null)
    setResolveNote('')
    setResolveNoteError('')
  }

  const handleConfirmResolve = () => {
    if (!resolveNote.trim()) {
      setResolveNoteError('请填写处理说明')
      return
    }
    if (currentNotification) {
      resolveNotification(currentNotification.id, resolveNote.trim())
      closeResolveModal()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">通知消息</h1>
          <p className="text-dark-400 mt-1">查看系统告警通知，及时处理设备异常</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
          >
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
        <div className="flex flex-col lg:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="unread">未读</option>
              <option value="resolved">已处理</option>
            </select>
          </div>
          <div className="relative">
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="h-10 bg-dark-700 border border-dark-600 rounded-lg px-3 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">全部规则</option>
              {rules.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="h-10 bg-dark-700 border border-dark-600 rounded-lg px-3 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">全部设备</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="h-10 bg-dark-700 border border-dark-600 rounded-lg px-3 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">全部级别</option>
              <option value="critical">严重</option>
              <option value="warning">警告</option>
              <option value="info">提示</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((n) => {
            const LevelIcon = getLevelIcon(n.level)
            const isNoteExpanded = expandedNotes.has(n.id)
            const isCondExpanded = expandedConditions.has(n.id)
            const hitConditions = n.hitConditions || []
            const hitCount = hitConditions.filter((h) => h.hit).length
            const logicLabel = n.conditionLogic === 'all' ? '且（AND）' : n.conditionLogic === 'any' ? '或（OR）' : ''

            return (
              <div
                key={n.id}
                className={cn('rounded-xl p-4 transition-all', getLevelStyles(n.level, n.read, n.resolved))}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      n.level === 'critical' ? 'bg-red-500/30 text-red-300' :
                      n.level === 'warning' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-blue-500/30 text-blue-300',
                    )}
                  >
                    <LevelIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white">{n.ruleName}</h4>
                          <span className={cn('inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border', getLevelBadgeStyles(n.level))}>
                            {getLevelLabel(n.level)}
                          </span>
                          {!n.read && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                              新消息
                            </span>
                          )}
                          {n.resolved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />已处理
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <Link to={`/devices/${n.deviceId}`} className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            设备：{n.deviceName}
                          </Link>
                          <Link to="/alerts" className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            查看规则
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-dark-400">通知渠道：</span>
                            <div className="flex gap-1">
                              {n.channels.includes('sms') && (
                                <span title="短信" className="inline-flex items-center justify-center w-5 h-5 rounded bg-dark-700 text-dark-300">
                                  <Smartphone className="w-3 h-3" />
                                </span>
                              )}
                              {n.channels.includes('email') && (
                                <span title="邮件" className="inline-flex items-center justify-center w-5 h-5 rounded bg-dark-700 text-dark-300">
                                  <Mail className="w-3 h-3" />
                                </span>
                              )}
                              {n.channels.includes('in_app') && (
                                <span title="站内信" className="inline-flex items-center justify-center w-5 h-5 rounded bg-dark-700 text-dark-300">
                                  <MessageSquare className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {hitConditions.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                                n.conditionLogic === 'all'
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                              )}>
                                {n.conditionLogic === 'all' ? '全部满足 · AND' : '任一满足 · OR'}
                              </span>
                              {hitConditions.filter((h) => h.hit).map((hc, i) => {
                                const unit = hc.metric === 'temperature' ? '°C' : '%'
                                return (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-300 border border-red-500/30"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    {getMetricLabel(hc.metric)} {getOpLabel(hc.operator)} {hc.threshold}{unit}
                                    <span className="text-red-400 font-medium">（当前 {hc.actualValue}{unit}）</span>
                                  </span>
                                )
                              })}
                              {hitConditions.filter((h) => !h.hit).length > 0 && (
                                <button
                                  onClick={() => toggleConditions(n.id)}
                                  className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-300 transition-colors"
                                >
                                  <span>查看 {hitConditions.filter((h) => !h.hit).length} 项未命中条件</span>
                                  {isCondExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            {isCondExpanded && hitConditions.some((h) => !h.hit) && (
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {hitConditions.filter((h) => !h.hit).map((hc, i) => {
                                  const unit = hc.metric === 'temperature' ? '°C' : '%'
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-dark-700/50 border border-dark-700"
                                    >
                                      <Check className="w-3 h-3 text-dark-500 flex-shrink-0" />
                                      <span className="text-dark-400">
                                        {getMetricLabel(hc.metric)} {getOpLabel(hc.operator)} {hc.threshold}{unit}
                                      </span>
                                      <span className="text-dark-500">→</span>
                                      <span className="text-dark-400">当前 {hc.actualValue}{unit}</span>
                                      <span className="ml-auto px-1 py-0.5 rounded text-xs bg-dark-700 text-dark-500">
                                        未命中
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {!hitConditions?.length && (
                          <p className="text-sm text-dark-200 mt-2">{n.message}</p>
                        )}

                        {n.resolved && n.resolvedBy && (
                          <div className="mt-3 pt-3 border-t border-dark-600/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-sm text-emerald-400 font-medium">
                                  处理人：{n.resolvedBy} · {n.resolvedAt && formatDateTime(n.resolvedAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {n.resolveNote && (
                                  <button
                                    onClick={() => toggleNoteExpanded(n.id)}
                                    className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-300 transition-colors"
                                  >
                                    {isNoteExpanded ? '收起备注' : '查看备注'}
                                    {isNoteExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                )}
                                <Link to="/audit" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                                  <ExternalLink className="w-3 h-3" />
                                  审计记录
                                </Link>
                              </div>
                            </div>
                            {isNoteExpanded && n.resolveNote && (
                              <div className="mt-2 p-3 bg-dark-800/50 rounded-lg border border-dark-600/50">
                                <p className="text-xs text-dark-400 mb-1">处理备注：</p>
                                <p className="text-sm text-dark-300 whitespace-pre-wrap">{n.resolveNote}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-dark-400 whitespace-nowrap">
                        {formatDateTime(n.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3"></div>
                      <div className="flex gap-2">
                        {!n.read && (
                          <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                            <Check className="w-4 h-4" />标记已读
                          </Button>
                        )}
                        {!n.resolved && (
                          <Button size="sm" onClick={() => openResolveModal(n)}>
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

      {resolveModalOpen && currentNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeResolveModal} />
          <div className="relative bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                处理告警
              </h3>
              <button
                onClick={closeResolveModal}
                className="text-dark-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-dark-400 mb-1">告警规则</p>
                  <Link to="/alerts" className="text-sm text-white font-medium hover:text-primary-400 inline-flex items-center gap-1">
                    {currentNotification.ruleName}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">设备名称</p>
                  <Link to={`/devices/${currentNotification.deviceId}`} className="text-sm text-white font-medium hover:text-primary-400 inline-flex items-center gap-1">
                    {currentNotification.deviceName}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">告警消息</p>
                  <div className={cn(
                    'p-3 rounded-lg text-sm border',
                    currentNotification.level === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                    currentNotification.level === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                    'bg-blue-500/10 border-blue-500/30 text-blue-300',
                  )}>
                    {currentNotification.message}
                  </div>
                </div>
                {currentNotification.hitConditions && currentNotification.hitConditions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-dark-400">条件命中详情</p>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                        currentNotification.conditionLogic === 'all'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      )}>
                        {currentNotification.conditionLogic === 'all' ? '全部满足 · AND' : '任一满足 · OR'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {currentNotification.hitConditions.filter((h) => h.hit).map((hc, i) => {
                        const unit = hc.metric === 'temperature' ? '°C' : '%'
                        return (
                          <div key={`hit-${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span className="text-red-300 font-medium">
                              {getMetricLabel(hc.metric)} {getOpLabel(hc.operator)} {hc.threshold}{unit}
                            </span>
                            <span className="text-red-400 ml-auto font-medium">
                              当前 {hc.actualValue}{unit} · 命中
                            </span>
                          </div>
                        )
                      })}
                      {currentNotification.hitConditions.filter((h) => !h.hit).map((hc, i) => {
                        const unit = hc.metric === 'temperature' ? '°C' : '%'
                        return (
                          <div key={`miss-${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dark-700/50 border border-dark-700 text-xs">
                            <Check className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
                            <span className="text-dark-400">
                              {getMetricLabel(hc.metric)} {getOpLabel(hc.operator)} {hc.threshold}{unit}
                            </span>
                            <span className="text-dark-500 ml-auto">
                              当前 {hc.actualValue}{unit} · 未命中
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  处理备注 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => {
                    setResolveNote(e.target.value)
                    if (resolveNoteError) setResolveNoteError('')
                  }}
                  placeholder="请填写处理说明，如：已现场检查设备、已联系运维..."
                  rows={4}
                  className={cn(
                    'w-full bg-dark-700 border rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none',
                    resolveNoteError ? 'border-red-500' : 'border-dark-600',
                  )}
                />
                {resolveNoteError && (
                  <p className="text-xs text-red-400 mt-1">{resolveNoteError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700 bg-dark-800/50">
              <Button variant="ghost" onClick={closeResolveModal}>取消</Button>
              <Button onClick={handleConfirmResolve}>确认处理</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
