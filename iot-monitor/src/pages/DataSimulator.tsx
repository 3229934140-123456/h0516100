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
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { useStore } from '../store'
import { cn, formatDateTime } from '../utils'
import type { AlertLogic, HitConditionDetail, SimulationRuleResult } from '../types'

export default function DataSimulator() {
  const { state, reportDeviceData, addSimulationRecord } = useStore()
  const { devices, alertRules } = state
  const simulationRecords = state.simulationRecords || []

  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || '')
  const [temperature, setTemperature] = useState(45)
  const [battery, setBattery] = useState(80)
  const [signal, setSignal] = useState(90)
  const [protocol, setProtocol] = useState<'MQTT' | 'HTTP'>('MQTT')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  const matchingRules = alertRules.filter((rule) => {
    if (!rule.enabled) return false
    if (!selectedDevice) return false
    const appliesToGroup = rule.groupIds.includes(selectedDevice.groupId)
    const appliesToDevice = rule.deviceIds.includes(selectedDeviceId)
    return appliesToGroup || appliesToDevice
  })

  const evaluateRule = (rule: typeof alertRules[0], metrics: { temperature: number; battery: number; signal: number }) => {
    const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
    const hitDetails: HitConditionDetail[] = conditions
      .filter((c) => c.type === 'metric' && c.metric && c.operator && c.threshold !== undefined)
      .map((c) => {
        const actualValue = (metrics as any)[c.metric!] ?? 0
        let hit = false
        switch (c.operator!) {
          case '>': hit = actualValue > c.threshold!; break
          case '>=': hit = actualValue >= c.threshold!; break
          case '<': hit = actualValue < c.threshold!; break
          case '<=': hit = actualValue <= c.threshold!; break
          case '==': hit = actualValue === c.threshold!; break
          case '!=': hit = actualValue !== c.threshold!; break
        }
        return { metric: c.metric!, operator: c.operator!, threshold: c.threshold!, actualValue, hit }
      })

    const triggered = rule.conditionLogic === 'all'
      ? hitDetails.every((h) => h.hit)
      : hitDetails.some((h) => h.hit)

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered,
      conditionLogic: rule.conditionLogic as AlertLogic,
      conditions: hitDetails,
    }
  }

  const handleReport = () => {
    if (!selectedDeviceId) return

    const metrics = { temperature, battery, signal }

    const results = matchingRules.map((rule) => evaluateRule(rule, metrics))

    reportDeviceData(selectedDeviceId, metrics, protocol)

    addSimulationRecord({
      time: new Date(),
      deviceId: selectedDeviceId,
      deviceName: selectedDevice?.name || '',
      metrics: { ...metrics },
      protocol,
      results,
    })
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

  const getMetricLabel = (m: string) =>
    m === 'temperature' ? '温度' : m === 'battery' ? '电量' : '信号'

  const getOpLabel = (op: string) =>
    op === '>' ? '超过' : op === '<' ? '低于' : op === '>=' ? '不低于' : op === '<=' ? '不高于' : op === '==' ? '等于' : '不等于'

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

          <Card title="模拟记录" subtitle="最近的数据上报及规则触发详情（刷新后保留）">
            {simulationRecords.length > 0 ? (
              <div className="space-y-3">
                {simulationRecords.map((record) => {
                  const hasTriggered = record.results.some((r) => r.triggered)
                  const isExpanded = expandedRecord === record.id

                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'p-4 rounded-xl border',
                        hasTriggered
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-dark-700/30 border-dark-700',
                      )}
                    >
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{record.deviceName}</span>
                            <span className="text-xs text-dark-500">{record.protocol}</span>
                            {hasTriggered && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                {record.results.filter((r) => r.triggered).length} 条规则触发
                              </span>
                            )}
                            {!hasTriggered && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                全部正常
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
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark-400 whitespace-nowrap">
                            {formatDateTime(record.time)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-dark-700 space-y-2">
                          {record.results.map((result) => (
                            <RuleResultDetail key={result.ruleId} result={result} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                {matchingRules.map((rule) => {
                  const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
                  return (
                    <div key={rule.id} className="p-3 rounded-lg bg-dark-700/30 border border-dark-700">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-white">{rule.name}</span>
                        <span className="text-xs text-dark-500">
                          ({rule.conditionLogic === 'all' ? '全部满足' : '任一满足'})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {conditions.filter((c) => c.type === 'metric').map((c, idx) => (
                          <p key={idx} className="text-xs text-dark-400">
                            {c.metric === 'temperature' ? '温度' : c.metric === 'battery' ? '电量' : '信号'} {c.operator} {c.threshold}
                            {c.metric === 'temperature' ? '°C' : '%'}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-dark-500">通知：</span>
                        {rule.channels.map((ch) => (
                          <span key={ch} className="text-xs text-dark-400">
                            {ch === 'sms' ? '短信' : ch === 'email' ? '邮件' : '站内信'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
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

function RuleResultDetail({ result }: { result: SimulationRuleResult }) {
  const getMetricLabel = (m: string) =>
    m === 'temperature' ? '温度' : m === 'battery' ? '电量' : '信号'
  const getOpLabel = (op: string) =>
    op === '>' ? '超过' : op === '<' ? '低于' : op === '>=' ? '不低于' : op === '<=' ? '不高于' : op === '==' ? '等于' : '不等于'
  const logicLabel = result.conditionLogic === 'all' ? '且（AND）' : '或（OR）'
  const hitCount = result.conditions.filter((c) => c.hit).length

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      result.triggered ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20',
    )}>
      <div className="flex items-center gap-2 mb-2">
        {result.triggered ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        )}
        <span className="text-sm font-medium text-white">{result.ruleName}</span>
        <span className="text-xs text-dark-500">{logicLabel}</span>
        {result.triggered && (
          <span className="ml-auto text-xs text-red-400">
            {hitCount}/{result.conditions.length} 项命中
          </span>
        )}
        {!result.triggered && (
          <span className="ml-auto text-xs text-emerald-400">未触发</span>
        )}
      </div>
      <div className="space-y-1.5">
        {result.conditions.map((cond, idx) => {
          const unit = cond.metric === 'temperature' ? '°C' : '%'
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              {cond.hit ? (
                <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-dark-500 flex-shrink-0" />
              )}
              <span className={cn(cond.hit ? 'text-red-300' : 'text-dark-400')}>
                {getMetricLabel(cond.metric)} {getOpLabel(cond.operator)} {cond.threshold}{unit}
              </span>
              <span className="text-dark-500">→</span>
              <span className={cn(cond.hit ? 'text-red-400 font-medium' : 'text-dark-400')}>
                当前 {cond.actualValue}{unit}
              </span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-xs',
                cond.hit ? 'bg-red-500/10 text-red-400' : 'bg-dark-700 text-dark-500',
              )}>
                {cond.hit ? '命中' : '未命中'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
