export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error'

export type RunState = 'running' | 'idle' | 'maintenance' | 'fault'

export interface DeviceMetrics {
  temperature: number
  battery: number
  signal: number
  cpu?: number
  memory?: number
}

export interface Device {
  id: string
  name: string
  serial: string
  model: string
  location: string
  groupId: string
  status: DeviceStatus
  runState: RunState
  lastReport: Date | string
  metrics: DeviceMetrics
  protocol: 'MQTT' | 'HTTP'
  firmware: string
  createdAt: Date | string
}

export interface DeviceGroup {
  id: string
  name: string
  description: string
  deviceCount: number
  createdAt: Date | string
}

export type AlertOperator = '>' | '>=' | '<' | '<=' | '==' | '!='

export type AlertConditionType = 'metric' | 'offline'

export interface AlertCondition {
  id?: string
  type: AlertConditionType
  metric?: keyof DeviceMetrics
  operator?: AlertOperator
  threshold?: number
  duration?: number
}

export type NotificationChannel = 'sms' | 'email' | 'in_app'

export type AlertLogic = 'all' | 'any'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  deviceIds: string[]
  groupIds: string[]
  condition: AlertCondition
  conditions: AlertCondition[]
  conditionLogic: AlertLogic
  channels: NotificationChannel[]
  responsibleUsers: string[]
  createdAt: Date | string
  lastTriggered?: Date | string
}

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface HitConditionDetail {
  metric: keyof DeviceMetrics
  operator: AlertOperator
  threshold: number
  actualValue: number
  hit: boolean
}

export interface AlertNotification {
  id: string
  ruleId: string
  ruleName: string
  deviceId: string
  deviceName: string
  message: string
  level: AlertLevel
  channels: NotificationChannel[]
  read: boolean
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date | string
  resolveNote?: string
  hitConditions?: HitConditionDetail[]
  conditionLogic?: AlertLogic
  timestamp: Date | string
}

export type CommandStatus = 'pending' | 'sent' | 'executing' | 'success' | 'failed'

export interface DeviceCommand {
  id: string
  deviceId: string
  deviceName: string
  command: string
  params?: Record<string, any>
  status: CommandStatus
  operator: string
  result?: string
  error?: string
  createdAt: Date | string
  executedAt?: Date | string
}

export interface AuditLog {
  id: string
  action: string
  module: string
  targetId?: string
  targetName?: string
  operator: string
  detail: string
  ip: string
  timestamp: Date | string
}

export interface TimeSeriesData {
  time: string
  timestamp?: number
  value: number
}

export interface SimulationRecord {
  id: string
  time: Date | string
  deviceId: string
  deviceName: string
  metrics: { temperature: number; battery: number; signal: number }
  protocol: 'MQTT' | 'HTTP'
  results: SimulationRuleResult[]
}

export interface SimulationRuleResult {
  ruleId: string
  ruleName: string
  triggered: boolean
  conditionLogic: AlertLogic
  conditions: HitConditionDetail[]
}
