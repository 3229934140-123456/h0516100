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
  lastReport: Date
  metrics: DeviceMetrics
  protocol: 'MQTT' | 'HTTP'
  firmware: string
  createdAt: Date
}

export interface DeviceGroup {
  id: string
  name: string
  description: string
  deviceCount: number
  createdAt: Date
}

export type AlertOperator = '>' | '>=' | '<' | '<=' | '==' | '!='

export type AlertConditionType = 'metric' | 'offline'

export interface AlertCondition {
  type: AlertConditionType
  metric?: keyof DeviceMetrics
  operator?: AlertOperator
  threshold?: number
  duration?: number
}

export type NotificationChannel = 'sms' | 'email' | 'in_app'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  deviceIds: string[]
  groupIds: string[]
  condition: AlertCondition
  channels: NotificationChannel[]
  responsibleUsers: string[]
  createdAt: Date
  lastTriggered?: Date
}

export interface AlertNotification {
  id: string
  ruleId: string
  ruleName: string
  deviceId: string
  deviceName: string
  message: string
  level: 'info' | 'warning' | 'critical'
  channels: NotificationChannel[]
  read: boolean
  resolved: boolean
  timestamp: Date
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
  createdAt: Date
  executedAt?: Date
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
  timestamp: Date
}

export interface TimeSeriesData {
  time: string
  value: number
}
