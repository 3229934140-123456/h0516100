import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Plus,
  Clock,
  Thermometer,
  Battery,
  Signal,
  Mail,
  MessageSquare,
  Smartphone,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Check,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store'
import { formatDateTime, formatRelativeTime, cn, getStatusLabel } from '../utils'
import type {
  AlertOperator,
  NotificationChannel,
  AlertConditionType,
  AlertCondition,
  DeviceMetrics,
  AlertLogic,
  AlertLevel,
} from '../types'

export default function AlertRules() {
  const {
    state,
    addAlertRule,
    toggleAlertRule,
    getAffectedDevicesForRule,
    getTriggeredNotificationsForRule,
  } = useStore()
  const rules = state.alertRules
  const groups = state.groups
  const devices = state.devices

  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [scopeTab, setScopeTab] = useState<'group' | 'device'>('group')
  const [formGroupIds, setFormGroupIds] = useState<string[]>([])
  const [formDeviceIds, setFormDeviceIds] = useState<string[]>([])
  const [formChannels, setFormChannels] = useState<NotificationChannel[]>(['in_app'])
  const [formResponsible, setFormResponsible] = useState('')
  const [formLogic, setFormLogic] = useState<AlertLogic>('any')
  const [formConditions, setFormConditions] = useState<AlertCondition[]>([
    {
      id: `c_${Date.now()}_1`,
      type: 'metric',
      metric: 'temperature',
      operator: '>',
      threshold: 80,
    },
  ])

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setScopeTab('group')
    setFormGroupIds([])
    setFormDeviceIds([])
    setFormChannels(['in_app'])
    setFormResponsible('')
    setFormLogic('any')
    setFormConditions([
      {
        id: `c_${Date.now()}_1`,
        type: 'metric',
        metric: 'temperature',
        operator: '>',
        threshold: 80,
      },
    ])
  }

  const handleCreate = () => {
    if (!formName.trim()) return

    addAlertRule({
      name: formName,
      description: formDesc,
      enabled: true,
      deviceIds: scopeTab === 'device' ? formDeviceIds : [],
      groupIds: scopeTab === 'group' ? formGroupIds : [],
      condition: formConditions[0],
      conditions: formConditions,
      conditionLogic: formLogic,
      channels: formChannels,
      responsibleUsers: formResponsible
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
    })

    resetForm()
    setShowModal(false)
  }

  const toggleGroup = (gid: string) => {
    setFormGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid],
    )
  }

  const toggleDevice = (did: string) => {
    setFormDeviceIds((prev) =>
      prev.includes(did) ? prev.filter((id) => id !== did) : [...prev, did],
    )
  }

  const toggleChannel = (ch: NotificationChannel) => {
    setFormChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    )
  }

  const addCondition = () => {
    setFormConditions((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}_${prev.length + 1}`,
        type: 'metric',
        metric: 'temperature',
        operator: '>',
        threshold: 80,
      },
    ])
  }

  const removeCondition = (id: string) => {
    if (formConditions.length <= 1) return
    setFormConditions((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCondition = (id: string, patch: Partial<AlertCondition>) => {
    setFormConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }

  const getMetricIcon = (metric?: string) => {
    switch (metric) {
      case 'temperature':
        return Thermometer
      case 'battery':
        return Battery
      case 'signal':
        return Signal
      default:
        return AlertTriangle
    }
  }

  const getOperatorLabel = (op: AlertOperator) => {
    const labels: Record<AlertOperator, string> = {
      '>': '大于',
      '>=': '大于等于',
      '<': '小于',
      '<=': '小于等于',
      '==': '等于',
      '!=': '不等于',
    }
    return labels[op] || op
  }

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'sms':
        return Smartphone
      case 'email':
        return Mail
      case 'in_app':
        return MessageSquare
    }
  }

  const getLevelColor = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-blue-500'
    }
  }

  const [expandedNotifs, setExpandedNotifs] = useState<Set<string>>(new Set())

  const toggleNotifExpanded = (id: string) => {
    setExpandedNotifs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getMetricLabel = (m: string) =>
    m === 'temperature' ? '温度' : m === 'battery' ? '电量' : '信号'

  const getOpLabel = (op: string) =>
    op === '>' ? '超过' : op === '<' ? '低于' : op === '>=' ? '不低于' : op === '<=' ? '不高于' : op === '==' ? '等于' : '不等于'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">告警规则管理</h1>
          <p className="text-dark-400 mt-1">
            配置设备监控阈值和告警触发条件，及时发现异常情况
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4" />
          新建规则
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => {
          const MetricIcon = getMetricIcon(rule.condition.metric)
          const affectedDevices = getAffectedDevicesForRule(rule)
          const triggeredNotifications = getTriggeredNotificationsForRule(rule.id)

          return (
            <Card key={rule.id}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                    {rule.enabled ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                        已启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 border border-slate-500/30 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        已禁用
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400 mb-4">{rule.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-2">触发条件</p>
                      <div className="space-y-1.5">
                        {(rule.conditions?.length ? rule.conditions : [rule.condition])
                          .filter((c) => c.type === 'metric')
                          .map((c, idx) => {
                            const MIcon = getMetricIcon(c.metric)
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <MIcon className="w-4 h-4 text-primary-400" />
                                <span className="text-sm text-white">
                                  {getStatusLabel(c.metric || '')} {getOperatorLabel(c.operator as AlertOperator)} {c.threshold}
                                  {c.metric === 'temperature' ? '°C' : '%'}
                                </span>
                                {idx === 0 && (rule.conditions?.length || 1) > 1 && (
                                  <span className="text-xs text-dark-500 ml-1">
                                    ({rule.conditionLogic === 'all' ? '且' : '或'})
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        {rule.condition.type === 'offline' && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-white">
                              设备离线超过 {rule.condition.duration} 分钟
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-2">适用范围</p>
                      <div className="flex flex-wrap gap-1">
                        {rule.groupIds.length > 0 &&
                          rule.groupIds.map((gid) => {
                            const group = groups.find((g) => g.id === gid)
                            return group ? (
                              <span
                                key={gid}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-500/10 text-primary-400 border border-primary-500/30"
                              >
                                {group.name}
                              </span>
                            ) : null
                          })}
                        {rule.deviceIds.length > 0 &&
                          rule.deviceIds.slice(0, 3).map((did) => {
                            const device = devices.find((d) => d.id === did)
                            return device ? (
                              <span
                                key={did}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-dark-600 text-dark-200"
                              >
                                {device.name}
                              </span>
                            ) : null
                          })}
                        {rule.deviceIds.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-dark-600 text-dark-400">
                            +{rule.deviceIds.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-2">通知方式</p>
                      <div className="flex items-center gap-2">
                        {rule.channels.map((ch) => {
                          const ChannelIcon = getChannelIcon(ch)
                          return (
                            <div
                              key={ch}
                              className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center"
                              title={
                                ch === 'sms' ? '短信' : ch === 'email' ? '邮件' : '站内信'
                              }
                            >
                              <ChannelIcon className="w-4 h-4 text-dark-300" />
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-1 ml-2">
                          <Users className="w-4 h-4 text-dark-400" />
                          <span className="text-sm text-dark-300">
                            {rule.responsibleUsers.join('、')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-dark-400" />
                        <p className="text-sm font-medium text-white">命中设备范围</p>
                        <span className="text-xs text-dark-400">
                          共 {affectedDevices.length} 台设备
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {affectedDevices.length === 0 ? (
                          <span className="text-xs text-dark-400">暂无匹配设备</span>
                        ) : (
                          <>
                            {affectedDevices.slice(0, 5).map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-dark-700 text-dark-200 border border-dark-600"
                              >
                                {d.name}
                              </span>
                            ))}
                            {affectedDevices.length > 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-dark-700 text-dark-400 border border-dark-600">
                                +{affectedDevices.length - 5}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-dark-400" />
                        <p className="text-sm font-medium text-white">最近触发记录</p>
                      </div>
                      <div className="space-y-1.5">
                        {triggeredNotifications.length === 0 ? (
                          <span className="text-xs text-dark-400">暂无触发记录</span>
                        ) : (
                          triggeredNotifications.slice(0, 5).map((n) => {
                            const isExpanded = expandedNotifs.has(n.id)
                            const hitConds = n.hitConditions || []
                            const hitCount = hitConds.filter((h) => h.hit).length
                            return (
                              <div
                                key={n.id}
                                className="py-1.5 px-2 rounded bg-dark-700/30"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full flex-shrink-0',
                                      getLevelColor(n.level),
                                    )}
                                  />
                                  <Link
                                    to={`/devices/${n.deviceId}`}
                                    className="text-sm text-primary-400 hover:text-primary-300 truncate flex-shrink-0"
                                  >
                                    {n.deviceName}
                                  </Link>
                                  <span className="text-xs text-dark-300 truncate flex-1 min-w-0">
                                    {hitConds.length > 0
                                      ? `${hitCount}/${hitConds.length} 项命中`
                                      : n.message.length > 30
                                      ? `${n.message.slice(0, 30)}...`
                                      : n.message
                                    }
                                  </span>
                                  {hitConds.length > 0 && (
                                    <button
                                      onClick={() => toggleNotifExpanded(n.id)}
                                      className="text-dark-400 hover:text-dark-300 flex-shrink-0"
                                    >
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  )}
                                  <span className="text-xs text-dark-500 flex-shrink-0">
                                    {formatRelativeTime(n.timestamp)}
                                  </span>
                                </div>
                                {isExpanded && hitConds.length > 0 && (
                                  <div className="mt-1.5 pl-4 flex flex-wrap gap-1">
                                    {hitConds.map((hc, i) => {
                                      const unit = hc.metric === 'temperature' ? '°C' : '%'
                                      return (
                                        <span
                                          key={i}
                                          className={cn(
                                            'text-xs px-1.5 py-0.5 rounded',
                                            hc.hit ? 'bg-red-500/10 text-red-400' : 'bg-dark-700 text-dark-500',
                                          )}
                                        >
                                          {getMetricLabel(hc.metric)} {getOpLabel(hc.operator)} {hc.threshold}{unit}
                                          → {hc.actualValue}{unit} {hc.hit ? '✓' : '✗'}
                                        </span>
                                      )
                                    })}
                                    <Link to="/notifications" className="text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-0.5 ml-1">
                                      <ExternalLink className="w-3 h-3" />通知
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-dark-400">最近触发</p>
                    <p className="text-sm text-white mt-0.5">
                      {rule.lastTriggered ? formatDateTime(rule.lastTriggered) : '暂无'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlertRule(rule.id)}
                      className="text-dark-300 hover:text-white transition-colors"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-dark-500" />
                      )}
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-dark-700 hover:bg-red-500/20 flex items-center justify-center text-dark-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="px-6 py-4 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
              <h3 className="text-lg font-semibold text-white">新建告警规则</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  规则名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：温度过高告警"
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  规则描述
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="描述告警规则的用途"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  适用范围
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setScopeTab('group')}
                    className={cn(
                      'flex-1 h-10 rounded-lg border transition-colors text-sm font-medium',
                      scopeTab === 'group'
                        ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                    )}
                  >
                    按分组
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab('device')}
                    className={cn(
                      'flex-1 h-10 rounded-lg border transition-colors text-sm font-medium',
                      scopeTab === 'device'
                        ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                    )}
                  >
                    按设备
                  </button>
                </div>
                {scopeTab === 'group' && (
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
                          formGroupIds.includes(g.id)
                            ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                        )}
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center',
                            formGroupIds.includes(g.id)
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-dark-500',
                          )}
                        >
                          {formGroupIds.includes(g.id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </span>
                        <span className="text-sm">{g.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {scopeTab === 'device' && (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleDevice(d.id)}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
                          formDeviceIds.includes(d.id)
                            ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                        )}
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                            formDeviceIds.includes(d.id)
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-dark-500',
                          )}
                        >
                          {formDeviceIds.includes(d.id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </span>
                        <span className="text-sm truncate">{d.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-dark-600 text-dark-400 truncate max-w-[100px]">
                          {d.model}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-dark-300">
                    触发条件（支持多个条件组合）
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormLogic('any')}
                      className={cn(
                        'px-3 h-7 rounded-md text-xs font-medium border transition-colors',
                        formLogic === 'any'
                          ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                          : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                      )}
                    >
                      满足任一（OR）
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormLogic('all')}
                      className={cn(
                        'px-3 h-7 rounded-md text-xs font-medium border transition-colors',
                        formLogic === 'all'
                          ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                          : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                      )}
                    >
                      满足全部（AND）
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {formConditions.map((cond, idx) => (
                    <div
                      key={cond.id}
                      className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-lg border border-dark-600"
                    >
                      <span className="text-xs text-dark-400 flex-shrink-0 w-6">
                        #{idx + 1}
                      </span>
                      <select
                        value={cond.type}
                        onChange={(e) =>
                          updateCondition(cond.id!, {
                            type: e.target.value as AlertConditionType,
                          })
                        }
                        className="h-8 bg-dark-700 border border-dark-600 rounded-md px-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors flex-shrink-0"
                      >
                        <option value="metric">指标阈值</option>
                        <option value="offline">离线超时</option>
                      </select>
                      {cond.type === 'metric' ? (
                        <>
                          <select
                            value={cond.metric || 'temperature'}
                            onChange={(e) =>
                              updateCondition(cond.id!, {
                                metric: e.target.value as keyof DeviceMetrics,
                              })
                            }
                            className="h-8 bg-dark-700 border border-dark-600 rounded-md px-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors flex-shrink-0"
                          >
                            <option value="temperature">温度</option>
                            <option value="battery">电量</option>
                            <option value="signal">信号强度</option>
                          </select>
                          <select
                            value={cond.operator || '>'}
                            onChange={(e) =>
                              updateCondition(cond.id!, {
                                operator: e.target.value as AlertOperator,
                              })
                            }
                            className="h-8 bg-dark-700 border border-dark-600 rounded-md px-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors flex-shrink-0"
                          >
                            <option value=">">大于</option>
                            <option value=">=">大于等于</option>
                            <option value="<">小于</option>
                            <option value="<=">小于等于</option>
                            <option value="==">等于</option>
                            <option value="!=">不等于</option>
                          </select>
                          <input
                            type="number"
                            value={cond.threshold ?? ''}
                            onChange={(e) =>
                              updateCondition(cond.id!, {
                                threshold: Number(e.target.value),
                              })
                            }
                            placeholder="阈值"
                            className="w-20 h-8 bg-dark-700 border border-dark-600 rounded-md px-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors flex-shrink-0"
                          />
                        </>
                      ) : (
                        <input
                          type="number"
                          value={cond.duration ?? ''}
                          onChange={(e) =>
                            updateCondition(cond.id!, {
                              duration: Number(e.target.value),
                            })
                          }
                          placeholder="分钟"
                          className="w-24 h-8 bg-dark-700 border border-dark-600 rounded-md px-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors flex-shrink-0"
                        />
                      )}
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => removeCondition(cond.id!)}
                        disabled={formConditions.length <= 1}
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center transition-colors flex-shrink-0',
                          formConditions.length <= 1
                            ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                            : 'bg-dark-700 text-dark-300 hover:bg-red-500/20 hover:text-red-400',
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCondition}
                    className="w-full h-9 rounded-lg border border-dashed border-dark-600 text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加条件
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  通知方式
                </label>
                <div className="flex gap-3">
                  {(
                    [
                      {
                        key: 'sms' as NotificationChannel,
                        label: '短信',
                        icon: Smartphone,
                      },
                      {
                        key: 'email' as NotificationChannel,
                        label: '邮件',
                        icon: Mail,
                      },
                      {
                        key: 'in_app' as NotificationChannel,
                        label: '站内信',
                        icon: MessageSquare,
                      },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleChannel(key)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border transition-colors',
                        formChannels.includes(key)
                          ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                          : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  责任人
                </label>
                <input
                  type="text"
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                  placeholder="输入责任人姓名，多个用逗号分隔"
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-dark-700 flex justify-end gap-3 sticky bottom-0 bg-dark-800">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !formName.trim() ||
                  formConditions.some(
                    (c) =>
                      (c.type === 'metric' && !c.threshold) ||
                      (c.type === 'offline' && !c.duration),
                  )
                }
              >
                创建规则
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
