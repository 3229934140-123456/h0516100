import { useState } from 'react'
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
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore } from '../store'
import { formatDateTime, cn, getStatusLabel } from '../utils'
import type { AlertOperator, NotificationChannel, AlertConditionType, AlertCondition, DeviceMetrics } from '../types'

export default function AlertRules() {
  const { state, addAlertRule, toggleAlertRule } = useStore()
  const { alertRules, groups, devices } = state

  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formConditionType, setFormConditionType] = useState<AlertConditionType>('metric')
  const [formMetric, setFormMetric] = useState<keyof DeviceMetrics>('temperature')
  const [formOperator, setFormOperator] = useState<AlertOperator>('>')
  const [formThreshold, setFormThreshold] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formGroupIds, setFormGroupIds] = useState<string[]>([])
  const [formChannels, setFormChannels] = useState<NotificationChannel[]>(['in_app'])
  const [formResponsible, setFormResponsible] = useState('')

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setFormConditionType('metric')
    setFormMetric('temperature')
    setFormOperator('>')
    setFormThreshold('')
    setFormDuration('')
    setFormGroupIds([])
    setFormChannels(['in_app'])
    setFormResponsible('')
  }

  const handleCreate = () => {
    if (!formName.trim()) return

    const condition: AlertCondition =
      formConditionType === 'metric'
        ? { type: 'metric', metric: formMetric, operator: formOperator, threshold: Number(formThreshold) }
        : { type: 'offline', duration: Number(formDuration) || 10 }

    addAlertRule({
      name: formName.trim(),
      description: formDesc.trim(),
      enabled: true,
      deviceIds: [],
      groupIds: formGroupIds,
      condition,
      channels: formChannels,
      responsibleUsers: formResponsible.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    })

    resetForm()
    setShowModal(false)
  }

  const toggleGroup = (gid: string) => {
    setFormGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid],
    )
  }

  const toggleChannel = (ch: NotificationChannel) => {
    setFormChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">告警规则管理</h1>
          <p className="text-dark-400 mt-1">
            配置设备监控阈值和告警触发条件，及时发现异常情况
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4" />
          新建规则
        </Button>
      </div>

      <div className="grid gap-4">
        {alertRules.map((rule) => {
          const MetricIcon = getMetricIcon(rule.condition.metric)
          return (
            <Card key={rule.id}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
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
                      <div className="flex items-center gap-2">
                        {rule.condition.type === 'metric' ? (
                          <>
                            <MetricIcon className="w-4 h-4 text-primary-400" />
                            <span className="text-sm text-white">
                              {getStatusLabel(rule.condition.metric || '')}{' '}
                              {getOperatorLabel(rule.condition.operator as AlertOperator)}{' '}
                              {rule.condition.threshold}
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-white">
                              设备离线超过 {rule.condition.duration} 分钟
                            </span>
                          </>
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
                              title={ch === 'sms' ? '短信' : ch === 'email' ? '邮件' : '站内信'}
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
                </div>

                <div className="flex flex-col items-end gap-3">
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
                <label className="block text-sm font-medium text-dark-300 mb-2">规则名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：温度过高告警"
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">规则描述</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="描述告警规则的用途"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">条件类型</label>
                  <select
                    value={formConditionType}
                    onChange={(e) => setFormConditionType(e.target.value as AlertConditionType)}
                    className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="metric">指标阈值</option>
                    <option value="offline">离线超时</option>
                  </select>
                </div>
                {formConditionType === 'metric' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">监控指标</label>
                    <select
                      value={formMetric}
                      onChange={(e) => setFormMetric(e.target.value as keyof DeviceMetrics)}
                      className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="temperature">温度</option>
                      <option value="battery">电量</option>
                      <option value="signal">信号强度</option>
                    </select>
                  </div>
                )}
                {formConditionType === 'offline' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">离线时长(分钟)</label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="10"
                      className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {formConditionType === 'metric' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">比较运算符</label>
                    <select
                      value={formOperator}
                      onChange={(e) => setFormOperator(e.target.value as AlertOperator)}
                      className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value=">">大于 (＞)</option>
                      <option value=">=">大于等于 (≥)</option>
                      <option value="<">小于 (＜)</option>
                      <option value="<=">小于等于 (≤)</option>
                      <option value="==">等于 (＝)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">阈值</label>
                    <input
                      type="number"
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(e.target.value)}
                      placeholder="例如：80"
                      className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">适用分组</label>
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
                      <span className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center',
                        formGroupIds.includes(g.id) ? 'bg-primary-500 border-primary-500' : 'border-dark-500',
                      )}>
                        {formGroupIds.includes(g.id) && <span className="text-white text-xs">✓</span>}
                      </span>
                      <span className="text-sm">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">通知方式</label>
                <div className="flex gap-3">
                  {([
                    { key: 'sms' as NotificationChannel, label: '短信', icon: Smartphone },
                    { key: 'email' as NotificationChannel, label: '邮件', icon: Mail },
                    { key: 'in_app' as NotificationChannel, label: '站内信', icon: MessageSquare },
                  ] as const).map(({ key, label, icon: Icon }) => (
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
                <label className="block text-sm font-medium text-dark-300 mb-2">责任人</label>
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
                disabled={!formName.trim() || (formConditionType === 'metric' && !formThreshold)}
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
