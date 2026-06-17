import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Thermometer,
  Battery,
  Signal,
  Send,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { useStore } from '../store'
import { cn, formatDateTime } from '../utils'

export default function DataSimulator() {
  const { state, reportDeviceData } = useStore()
  const { devices, alertRules, notifications } = state

  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || '')
  const [temperature, setTemperature] = useState(45)
  const [battery, setBattery] = useState(80)
  const [signal, setSignal] = useState(90)
  const [protocol, setProtocol] = useState<'MQTT' | 'HTTP'>('MQTT')
  const [reportHistory, setReportHistory] = useState<
    { time: Date; deviceId: string; deviceName: string; metrics: { temperature: number; battery: number; signal: number }; triggeredAlerts: string[] }[]
  >([])

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  const matchingRules = alertRules.filter((rule) => {
    if (!rule.enabled || rule.condition.type !== 'metric') return false
    if (!selectedDevice) return false
    const appliesToGroup = rule.groupIds.includes(selectedDevice.groupId)
    const appliesToDevice = rule.deviceIds.includes(selectedDeviceId)
    return appliesToGroup || appliesToDevice
  })

  const handleReport = () => {
    if (!selectedDeviceId) return

    const metrics = { temperature, battery, signal }

    const beforeAlertCount = state.notifications.length

    reportDeviceData(selectedDeviceId, metrics, protocol)

    const afterAlertCount = state.notifications.length
    const newAlertCount = afterAlertCount - beforeAlertCount

    const triggeredAlerts: string[] = []
    if (newAlertCount > 0) {
      const newNotifs = state.notifications.slice(0, newAlertCount)
      newNotifs.forEach((n) => {
        if (!triggeredAlerts.includes(n.ruleName)) {
          triggeredAlerts.push(n.ruleName)
        }
      })
    }

    setReportHistory((prev) => [
      {
        time: new Date(),
        deviceId: selectedDeviceId,
        deviceName: selectedDevice?.name || '',
        metrics: { ...metrics },
        triggeredAlerts,
      },
      ...prev.slice(0, 19),
    ])
  }

  const handleRandomReport = () => {
    if (!selectedDeviceId) return
    const randomTemp = Math.round((Math.random() * 100) * 10) / 10
    const randomBattery = Math.round(Math.random() * 100)
    const randomSignal = Math.round(Math.random() * 100)
    setTemperature(randomTemp)
    setBattery(randomBattery)
    setSignal(randomSignal)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">数据模拟上报</h1>
        <p className="text-dark-400 mt-1">
          模拟设备通过 MQTT/HTTP 上报实时数据，验证告警规则和通知联动
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="上报配置" subtitle="选择设备并设置上报数据">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">选择设备</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.serial})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">通信协议</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProtocol('MQTT')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border transition-colors',
                      protocol === 'MQTT'
                        ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                    )}
                  >
                    <Radio className="w-4 h-4" />
                    MQTT
                  </button>
                  <button
                    onClick={() => setProtocol('HTTP')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border transition-colors',
                      protocol === 'HTTP'
                        ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-primary-500',
                    )}
                  >
                    <Send className="w-4 h-4" />
                    HTTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <Thermometer className="w-4 h-4 inline mr-1" />
                    温度 (°C)
                  </label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="-20"
                    max="120"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full mt-2 accent-orange-500"
                  />
                  <p className={cn('text-xs mt-1', temperature > 80 ? 'text-red-400' : 'text-dark-500')}>
                    {temperature > 80 ? '⚠️ 超过常见告警阈值' : `当前值：${temperature}°C`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <Battery className="w-4 h-4 inline mr-1" />
                    电量 (%)
                  </label>
                  <input
                    type="number"
                    value={battery}
                    onChange={(e) => setBattery(Number(e.target.value))}
                    className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={battery}
                    onChange={(e) => setBattery(Number(e.target.value))}
                    className="w-full mt-2 accent-emerald-500"
                  />
                  <p className={cn('text-xs mt-1', battery < 20 ? 'text-red-400' : 'text-dark-500')}>
                    {battery < 20 ? '⚠️ 低于常见告警阈值' : `当前值：${battery}%`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <Signal className="w-4 h-4 inline mr-1" />
                    信号 (%)
                  </label>
                  <input
                    type="number"
                    value={signal}
                    onChange={(e) => setSignal(Number(e.target.value))}
                    className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={signal}
                    onChange={(e) => setSignal(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-500"
                  />
                  <p className={cn('text-xs mt-1', signal < 30 ? 'text-red-400' : 'text-dark-500')}>
                    {signal < 30 ? '⚠️ 低于常见告警阈值' : `当前值：${signal}%`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleReport} className="flex-1">
                  <Send className="w-4 h-4" />
                  模拟上报数据
                </Button>
                <Button variant="secondary" onClick={handleRandomReport}>
                  <Zap className="w-4 h-4" />
                  随机数据
                </Button>
              </div>
            </div>
          </Card>

          <Card title="上报记录" subtitle="最近的数据上报操作">
            {reportHistory.length > 0 ? (
              <div className="space-y-3">
                {reportHistory.map((record, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-4 rounded-xl border',
                      record.triggeredAlerts.length > 0
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-dark-700/30 border-dark-700',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{record.deviceName}</span>
                          {record.triggeredAlerts.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              触发告警
                            </span>
                          )}
                          {record.triggeredAlerts.length === 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              正常
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-2">
                          <span className="text-xs text-dark-400">
                            温度：<span className={cn(record.metrics.temperature > 80 ? 'text-red-400' : 'text-white')}>{record.metrics.temperature}°C</span>
                          </span>
                          <span className="text-xs text-dark-400">
                            电量：<span className={cn(record.metrics.battery < 20 ? 'text-red-400' : 'text-white')}>{record.metrics.battery}%</span>
                          </span>
                          <span className="text-xs text-dark-400">
                            信号：<span className={cn(record.metrics.signal < 30 ? 'text-red-400' : 'text-white')}>{record.metrics.signal}%</span>
                          </span>
                        </div>
                        {record.triggeredAlerts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {record.triggeredAlerts.map((alert) => (
                              <span key={alert} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                {alert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-dark-400 whitespace-nowrap">
                        {formatDateTime(record.time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                <Send className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">尚未进行数据上报</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="当前设备状态">
            {selectedDevice ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedDevice.name}</p>
                    <p className="text-xs text-dark-400">{selectedDevice.serial}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                    <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{selectedDevice.metrics.temperature}°C</p>
                    <p className="text-xs text-dark-400">温度</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                    <Battery className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{selectedDevice.metrics.battery}%</p>
                    <p className="text-xs text-dark-400">电量</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                    <Signal className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{selectedDevice.metrics.signal}%</p>
                    <p className="text-xs text-dark-400">信号</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">设备状态</span>
                  <StatusBadge status={selectedDevice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">最后上报</span>
                  <span className="text-sm text-white">{formatDateTime(selectedDevice.lastReport)}</span>
                </div>
                <Link
                  to={`/devices/${selectedDevice.id}`}
                  className="block text-center text-sm text-primary-400 hover:text-primary-300 mt-2"
                >
                  查看设备详情 →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">请选择设备</p>
            )}
          </Card>

          <Card title="匹配的告警规则" subtitle="当前设备适用的已启用规则">
            {matchingRules.length > 0 ? (
              <div className="space-y-3">
                {matchingRules.map((rule) => (
                  <div key={rule.id} className="p-3 rounded-lg bg-dark-700/30 border border-dark-700">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">{rule.name}</span>
                    </div>
                    <p className="text-xs text-dark-400">
                      {rule.condition.metric === 'temperature' && `温度 ${rule.condition.operator} ${rule.condition.threshold}°C`}
                      {rule.condition.metric === 'battery' && `电量 ${rule.condition.operator} ${rule.condition.threshold}%`}
                      {rule.condition.metric === 'signal' && `信号 ${rule.condition.operator} ${rule.condition.threshold}%`}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-dark-500">通知：</span>
                      {rule.channels.map((ch) => (
                        <span key={ch} className="text-xs text-dark-400">
                          {ch === 'sms' ? '短信' : ch === 'email' ? '邮件' : '站内信'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">当前设备无匹配规则</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
