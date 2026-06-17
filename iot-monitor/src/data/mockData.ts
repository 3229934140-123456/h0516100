import type {
  Device,
  DeviceGroup,
  AlertRule,
  AlertNotification,
  DeviceCommand,
  AuditLog,
  TimeSeriesData,
} from '../types'

const now = new Date()
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60000)
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000)
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)

export const mockGroups: DeviceGroup[] = [
  {
    id: 'g1',
    name: '温度传感器组',
    description: '厂房内所有温度监测设备',
    deviceCount: 15,
    createdAt: daysAgo(60),
  },
  {
    id: 'g2',
    name: '电力监测组',
    description: '电力监控设备与电量采集终端',
    deviceCount: 8,
    createdAt: daysAgo(45),
  },
  {
    id: 'g3',
    name: '网关设备组',
    description: '边缘计算网关与通信设备',
    deviceCount: 5,
    createdAt: daysAgo(30),
  },
  {
    id: 'g4',
    name: '环境监测组',
    description: '温湿度、空气质量监测设备',
    deviceCount: 12,
    createdAt: daysAgo(20),
  },
]

export const mockDevices: Device[] = [
  {
    id: 'd001',
    name: '一号车间温度传感器-A1',
    serial: 'TS-2024-00001',
    model: 'TS-Pro-200',
    location: '一号车间 3F-A区',
    groupId: 'g1',
    status: 'online',
    runState: 'running',
    lastReport: minutesAgo(2),
    metrics: { temperature: 67.5, battery: 87, signal: 92, cpu: 23, memory: 56 },
    protocol: 'MQTT',
    firmware: 'v2.3.1',
    createdAt: daysAgo(120),
  },
  {
    id: 'd002',
    name: '一号车间温度传感器-A2',
    serial: 'TS-2024-00002',
    model: 'TS-Pro-200',
    location: '一号车间 3F-B区',
    groupId: 'g1',
    status: 'warning',
    runState: 'running',
    lastReport: minutesAgo(1),
    metrics: { temperature: 82.3, battery: 65, signal: 78, cpu: 45, memory: 62 },
    protocol: 'MQTT',
    firmware: 'v2.3.1',
    createdAt: daysAgo(120),
  },
  {
    id: 'd003',
    name: '电力终端-B1',
    serial: 'PM-2024-01001',
    model: 'PM-5000',
    location: '配电室 #1',
    groupId: 'g2',
    status: 'online',
    runState: 'running',
    lastReport: minutesAgo(5),
    metrics: { temperature: 45.2, battery: 100, signal: 98, cpu: 18, memory: 42 },
    protocol: 'HTTP',
    firmware: 'v1.8.0',
    createdAt: daysAgo(90),
  },
  {
    id: 'd004',
    name: '边缘网关-G1',
    serial: 'GW-2024-00001',
    model: 'EG-3000',
    location: '机房 A-01',
    groupId: 'g3',
    status: 'online',
    runState: 'running',
    lastReport: minutesAgo(1),
    metrics: { temperature: 52.8, battery: 100, signal: 100, cpu: 67, memory: 73 },
    protocol: 'MQTT',
    firmware: 'v3.1.2',
    createdAt: daysAgo(60),
  },
  {
    id: 'd005',
    name: '环境监测-E1',
    serial: 'EM-2024-00101',
    model: 'EM-100',
    location: '办公区 2F',
    groupId: 'g4',
    status: 'offline',
    runState: 'idle',
    lastReport: hoursAgo(3),
    metrics: { temperature: 24.5, battery: 32, signal: 45, cpu: 5, memory: 20 },
    protocol: 'MQTT',
    firmware: 'v1.5.0',
    createdAt: daysAgo(45),
  },
  {
    id: 'd006',
    name: '温度传感器-B1',
    serial: 'TS-2024-00015',
    model: 'TS-Pro-200',
    location: '二号车间 1F',
    groupId: 'g1',
    status: 'error',
    runState: 'fault',
    lastReport: hoursAgo(12),
    metrics: { temperature: 0, battery: 5, signal: 0 },
    protocol: 'MQTT',
    firmware: 'v2.3.0',
    createdAt: daysAgo(100),
  },
  {
    id: 'd007',
    name: '电力终端-B2',
    serial: 'PM-2024-01002',
    model: 'PM-5000',
    location: '配电室 #2',
    groupId: 'g2',
    status: 'online',
    runState: 'idle',
    lastReport: minutesAgo(8),
    metrics: { temperature: 38.1, battery: 100, signal: 95, cpu: 12, memory: 38 },
    protocol: 'HTTP',
    firmware: 'v1.8.0',
    createdAt: daysAgo(85),
  },
  {
    id: 'd008',
    name: '边缘网关-G2',
    serial: 'GW-2024-00002',
    model: 'EG-3000',
    location: '机房 B-02',
    groupId: 'g3',
    status: 'online',
    runState: 'maintenance',
    lastReport: minutesAgo(3),
    metrics: { temperature: 48.0, battery: 100, signal: 99, cpu: 85, memory: 88 },
    protocol: 'MQTT',
    firmware: 'v3.2.0-beta',
    createdAt: daysAgo(55),
  },
]

export const mockAlertRules: AlertRule[] = [
  {
    id: 'r1',
    name: '温度过高告警',
    description: '设备温度超过80度时触发告警',
    enabled: true,
    deviceIds: [],
    groupIds: ['g1', 'g4'],
    condition: { type: 'metric', metric: 'temperature', operator: '>', threshold: 80 },
    conditions: [{ type: 'metric', metric: 'temperature', operator: '>', threshold: 80 }],
    conditionLogic: 'any',
    channels: ['sms', 'email', 'in_app'],
    responsibleUsers: ['张三', '李四'],
    createdAt: daysAgo(50),
    lastTriggered: hoursAgo(2),
  },
  {
    id: 'r2',
    name: '设备离线告警',
    description: '设备连续10分钟未上报数据时触发告警',
    enabled: true,
    deviceIds: [],
    groupIds: ['g1', 'g2', 'g3', 'g4'],
    condition: { type: 'offline', duration: 10 },
    conditions: [{ type: 'offline', duration: 10 }],
    conditionLogic: 'any',
    channels: ['email', 'in_app'],
    responsibleUsers: ['王五'],
    createdAt: daysAgo(60),
    lastTriggered: hoursAgo(5),
  },
  {
    id: 'r3',
    name: '电量过低告警',
    description: '设备电池电量低于20%时触发告警',
    enabled: true,
    deviceIds: [],
    groupIds: ['g1', 'g4'],
    condition: { type: 'metric', metric: 'battery', operator: '<', threshold: 20 },
    conditions: [{ type: 'metric', metric: 'battery', operator: '<', threshold: 20 }],
    conditionLogic: 'any',
    channels: ['in_app'],
    responsibleUsers: ['张三'],
    createdAt: daysAgo(40),
    lastTriggered: daysAgo(2),
  },
  {
    id: 'r4',
    name: '信号强度告警',
    description: '设备信号强度低于30%时触发告警',
    enabled: false,
    deviceIds: ['d005', 'd006'],
    groupIds: [],
    condition: { type: 'metric', metric: 'signal', operator: '<', threshold: 30 },
    conditions: [{ type: 'metric', metric: 'signal', operator: '<', threshold: 30 }],
    conditionLogic: 'any',
    channels: ['in_app'],
    responsibleUsers: ['李四'],
    createdAt: daysAgo(30),
  },
]

export const mockNotifications: AlertNotification[] = [
  {
    id: 'n1',
    ruleId: 'r1',
    ruleName: '温度过高告警',
    deviceId: 'd002',
    deviceName: '一号车间温度传感器-A2',
    message: '设备温度达到 82.3°C，超过阈值 80°C',
    level: 'warning',
    channels: ['sms', 'email', 'in_app'],
    read: false,
    resolved: false,
    timestamp: hoursAgo(2),
  },
  {
    id: 'n2',
    ruleId: 'r2',
    ruleName: '设备离线告警',
    deviceId: 'd005',
    deviceName: '环境监测-E1',
    message: '设备已离线超过 3 小时，请检查设备状态',
    level: 'critical',
    channels: ['email', 'in_app'],
    read: false,
    resolved: false,
    timestamp: hoursAgo(3),
  },
  {
    id: 'n3',
    ruleId: 'r2',
    ruleName: '设备离线告警',
    deviceId: 'd006',
    deviceName: '温度传感器-B1',
    message: '设备已离线超过 12 小时，请尽快处理',
    level: 'critical',
    channels: ['email', 'in_app'],
    read: true,
    resolved: false,
    timestamp: hoursAgo(12),
  },
  {
    id: 'n4',
    ruleId: 'r3',
    ruleName: '电量过低告警',
    deviceId: 'd006',
    deviceName: '温度传感器-B1',
    message: '设备电量仅剩 5%，请及时更换电池',
    level: 'warning',
    channels: ['in_app'],
    read: true,
    resolved: true,
    timestamp: daysAgo(1),
  },
  {
    id: 'n5',
    ruleId: 'r1',
    ruleName: '温度过高告警',
    deviceId: 'd001',
    deviceName: '一号车间温度传感器-A1',
    message: '设备温度达到 81.5°C，超过阈值 80°C',
    level: 'warning',
    channels: ['sms', 'email', 'in_app'],
    read: true,
    resolved: true,
    timestamp: daysAgo(2),
  },
]

export const mockCommands: DeviceCommand[] = [
  {
    id: 'c1',
    deviceId: 'd001',
    deviceName: '一号车间温度传感器-A1',
    command: '重启设备',
    status: 'success',
    operator: '张三',
    result: '设备重启成功，已恢复正常运行',
    createdAt: daysAgo(3),
    executedAt: daysAgo(3),
  },
  {
    id: 'c2',
    deviceId: 'd004',
    deviceName: '边缘网关-G1',
    command: '固件升级',
    params: { version: 'v3.1.2' },
    status: 'success',
    operator: '李四',
    result: '固件升级成功，当前版本 v3.1.2',
    createdAt: daysAgo(15),
    executedAt: daysAgo(15),
  },
  {
    id: 'c3',
    deviceId: 'd005',
    deviceName: '环境监测-E1',
    command: '远程诊断',
    status: 'failed',
    operator: '王五',
    error: '设备离线，指令下发失败',
    createdAt: hoursAgo(2),
  },
  {
    id: 'c4',
    deviceId: 'd008',
    deviceName: '边缘网关-G2',
    command: '参数配置',
    params: { reportInterval: 30 },
    status: 'executing',
    operator: '张三',
    createdAt: minutesAgo(5),
  },
]

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'a1',
    action: '创建告警规则',
    module: '告警管理',
    targetId: 'r1',
    targetName: '温度过高告警',
    operator: '张三',
    detail: '创建告警规则：温度超过80度时通过短信/邮件通知',
    ip: '192.168.1.101',
    timestamp: daysAgo(50),
  },
  {
    id: 'a2',
    action: '下发设备指令',
    module: '设备管理',
    targetId: 'd001',
    targetName: '一号车间温度传感器-A1',
    operator: '张三',
    detail: '下发指令：重启设备',
    ip: '192.168.1.101',
    timestamp: daysAgo(3),
  },
  {
    id: 'a3',
    action: '修改设备分组',
    module: '分组管理',
    targetId: 'g1',
    targetName: '温度传感器组',
    operator: '李四',
    detail: '向分组中添加 3 台设备',
    ip: '192.168.1.102',
    timestamp: daysAgo(10),
  },
  {
    id: 'a4',
    action: '禁用告警规则',
    module: '告警管理',
    targetId: 'r4',
    targetName: '信号强度告警',
    operator: '李四',
    detail: '禁用告警规则',
    ip: '192.168.1.102',
    timestamp: daysAgo(5),
  },
  {
    id: 'a5',
    action: '用户登录',
    module: '系统',
    operator: '王五',
    detail: '用户登录成功',
    ip: '192.168.1.103',
    timestamp: hoursAgo(8),
  },
  {
    id: 'a6',
    action: '固件升级',
    module: '设备管理',
    targetId: 'd004',
    targetName: '边缘网关-G1',
    operator: '李四',
    detail: '升级固件至 v3.1.2',
    ip: '192.168.1.102',
    timestamp: daysAgo(15),
  },
  {
    id: 'a7',
    action: '查看设备数据',
    module: '设备管理',
    targetId: 'd002',
    targetName: '一号车间温度传感器-A2',
    operator: '张三',
    detail: '导出设备历史数据（近7天）',
    ip: '192.168.1.101',
    timestamp: hoursAgo(5),
  },
]

export function generateTimeSeriesData(hours: number = 24, baseValue: number = 50, variance: number = 15): TimeSeriesData[] {
  const data: TimeSeriesData[] = []
  const pointsPerHour = 6
  const totalPoints = hours * pointsPerHour

  for (let i = totalPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * (60000 / pointsPerHour) * 60)
    const hour = time.getHours()
    const dayVariation = Math.sin((hour / 24) * Math.PI * 2) * variance * 0.5
    const randomVariation = (Math.random() - 0.5) * variance
    const value = Math.round((baseValue + dayVariation + randomVariation) * 10) / 10

    data.push({
      time: formatTime(time),
      timestamp: time.getTime(),
      value: Math.max(0, value),
    })
  }

  return data
}

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getDeviceById(id: string): Device | undefined {
  return mockDevices.find(d => d.id === id)
}

export function getGroupById(id: string): DeviceGroup | undefined {
  return mockGroups.find(g => g.id === id)
}

export function getDevicesByGroup(groupId: string): Device[] {
  return mockDevices.filter(d => d.groupId === groupId)
}
