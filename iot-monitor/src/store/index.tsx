import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type {
  Device,
  DeviceGroup,
  AlertRule,
  AlertNotification,
  DeviceCommand,
  AuditLog,
  TimeSeriesData,
  DeviceMetrics,
  AlertCondition,
  DeviceStatus,
} from '../types'
import {
  mockDevices,
  mockGroups,
  mockAlertRules,
  mockNotifications,
  mockCommands,
  mockAuditLogs,
  generateTimeSeriesData,
} from '../data/mockData'

const STORAGE_KEY = 'iot-monitor-store'

interface TimeSeriesMap {
  [deviceId: string]: {
    temperature: TimeSeriesData[]
    battery: TimeSeriesData[]
    signal: TimeSeriesData[]
  }
}

interface AppState {
  devices: Device[]
  groups: DeviceGroup[]
  alertRules: AlertRule[]
  notifications: AlertNotification[]
  commands: DeviceCommand[]
  auditLogs: AuditLog[]
  timeSeries: TimeSeriesMap
  initialized: boolean
}

type Action =
  | { type: 'INIT'; payload: AppState }
  | { type: 'ADD_ALERT_RULE'; payload: AlertRule }
  | { type: 'TOGGLE_ALERT_RULE'; payload: string }
  | { type: 'SEND_COMMAND'; payload: DeviceCommand }
  | { type: 'UPDATE_COMMAND'; payload: { id: string; status: DeviceCommand['status']; result?: string; error?: string } }
  | { type: 'ADD_GROUP'; payload: DeviceGroup }
  | { type: 'REPORT_DEVICE_DATA'; payload: { deviceId: string; metrics: DeviceMetrics; protocol: 'MQTT' | 'HTTP' } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'RESOLVE_NOTIFICATION'; payload: string }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
  | { type: 'ADD_NOTIFICATION'; payload: AlertNotification }

function buildInitialTimeSeries(): TimeSeriesMap {
  const ts: TimeSeriesMap = {}
  mockDevices.forEach((d) => {
    ts[d.id] = {
      temperature: generateTimeSeriesData(24, d.metrics.temperature, 15),
      battery: generateTimeSeriesData(24, d.metrics.battery, 10),
      signal: generateTimeSeriesData(24, d.metrics.signal, 15),
    }
  })
  return ts
}

function getInitialState(): AppState {
  return {
    devices: mockDevices.map((d) => ({ ...d })),
    groups: mockGroups.map((g) => ({ ...g })),
    alertRules: mockAlertRules.map((r) => ({ ...r })),
    notifications: mockNotifications.map((n) => ({ ...n })),
    commands: mockCommands.map((c) => ({ ...c })),
    auditLogs: mockAuditLogs.map((a) => ({ ...a })),
    timeSeries: buildInitialTimeSeries(),
    initialized: true,
  }
}

function checkAlertCondition(
  condition: AlertCondition,
  metrics: DeviceMetrics,
): boolean {
  if (condition.type === 'offline') return false
  if (!condition.metric || condition.operator === undefined || condition.threshold === undefined)
    return false

  const value = metrics[condition.metric]
  if (typeof value !== 'number') return false

  switch (condition.operator) {
    case '>':
      return value > condition.threshold
    case '>=':
      return value >= condition.threshold
    case '<':
      return value < condition.threshold
    case '<=':
      return value <= condition.threshold
    case '==':
      return value === condition.threshold
    case '!=':
      return value !== condition.threshold
    default:
      return false
  }
}

function formatTsTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...action.payload, initialized: true }

    case 'ADD_ALERT_RULE':
      return {
        ...state,
        alertRules: [action.payload, ...state.alertRules],
        auditLogs: [
          {
            id: `a_${Date.now()}`,
            action: '创建告警规则',
            module: '告警管理',
            targetId: action.payload.id,
            targetName: action.payload.name,
            operator: '管理员',
            detail: `创建告警规则：${action.payload.name}`,
            ip: '192.168.1.101',
            timestamp: new Date(),
          },
          ...state.auditLogs,
        ],
      }

    case 'TOGGLE_ALERT_RULE':
      return {
        ...state,
        alertRules: state.alertRules.map((r) =>
          r.id === action.payload ? { ...r, enabled: !r.enabled } : r,
        ),
        auditLogs: [
          {
            id: `a_${Date.now()}`,
            action: state.alertRules.find((r) => r.id === action.payload)?.enabled
              ? '禁用告警规则'
              : '启用告警规则',
            module: '告警管理',
            targetId: action.payload,
            targetName: state.alertRules.find((r) => r.id === action.payload)?.name,
            operator: '管理员',
            detail: `${state.alertRules.find((r) => r.id === action.payload)?.enabled ? '禁用' : '启用'}告警规则`,
            ip: '192.168.1.101',
            timestamp: new Date(),
          },
          ...state.auditLogs,
        ],
      }

    case 'SEND_COMMAND': {
      const newCmd = action.payload
      const simulatedStatus = newCmd.status === 'pending' ? 'success' : newCmd.status
      const updatedCmd = {
        ...newCmd,
        status: simulatedStatus as DeviceCommand['status'],
        executedAt: new Date(),
        result: simulatedStatus === 'success' ? `指令"${newCmd.command}"执行成功` : undefined,
        error: simulatedStatus === 'failed' ? '指令执行失败' : undefined,
      }
      return {
        ...state,
        commands: [updatedCmd, ...state.commands],
        auditLogs: [
          {
            id: `a_${Date.now()}`,
            action: '下发设备指令',
            module: '设备管理',
            targetId: newCmd.deviceId,
            targetName: newCmd.deviceName,
            operator: newCmd.operator,
            detail: `下发指令：${newCmd.command}${newCmd.params ? `，参数：${JSON.stringify(newCmd.params)}` : ''}`,
            ip: '192.168.1.101',
            timestamp: new Date(),
          },
          ...state.auditLogs,
        ],
      }
    }

    case 'ADD_GROUP':
      return {
        ...state,
        groups: [action.payload, ...state.groups],
        auditLogs: [
          {
            id: `a_${Date.now()}`,
            action: '创建设备分组',
            module: '分组管理',
            targetId: action.payload.id,
            targetName: action.payload.name,
            operator: '管理员',
            detail: `创建设备分组：${action.payload.name}`,
            ip: '192.168.1.101',
            timestamp: new Date(),
          },
          ...state.auditLogs,
        ],
      }

    case 'REPORT_DEVICE_DATA': {
      const { deviceId, metrics, protocol } = action.payload
      const device = state.devices.find((d) => d.id === deviceId)
      if (!device) return state

      const now = new Date()
      const tsPoint = formatTsTime(now)

      const newStatus: DeviceStatus = (() => {
        if (metrics.temperature > 80 || metrics.battery < 20 || metrics.signal < 30)
          return 'warning'
        return 'online'
      })()

      const updatedDevices = state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              metrics: { ...d.metrics, ...metrics },
              lastReport: now,
              status: newStatus,
              runState: newStatus === 'warning' ? 'running' : d.runState,
            }
          : d,
      )

      const updatedTs = { ...state.timeSeries }
      if (updatedTs[deviceId]) {
        updatedTs[deviceId] = {
          temperature: [
            ...updatedTs[deviceId].temperature.slice(-143),
            { time: tsPoint, value: metrics.temperature },
          ],
          battery: [
            ...updatedTs[deviceId].battery.slice(-143),
            { time: tsPoint, value: metrics.battery },
          ],
          signal: [
            ...updatedTs[deviceId].signal.slice(-143),
            { time: tsPoint, value: metrics.signal },
          ],
        }
      } else {
        updatedTs[deviceId] = {
          temperature: [{ time: tsPoint, value: metrics.temperature }],
          battery: [{ time: tsPoint, value: metrics.battery }],
          signal: [{ time: tsPoint, value: metrics.signal }],
        }
      }

      const newNotifications: AlertNotification[] = []
      const triggeredRuleIds: string[] = []

      state.alertRules.forEach((rule) => {
        if (!rule.enabled) return
        if (rule.condition.type === 'offline') return

        const appliesToGroup = rule.groupIds.includes(device.groupId)
        const appliesToDevice = rule.deviceIds.includes(deviceId)
        if (!appliesToGroup && !appliesToDevice) return

        if (checkAlertCondition(rule.condition, metrics)) {
          triggeredRuleIds.push(rule.id)
          const metricLabel =
            rule.condition.metric === 'temperature'
              ? '温度'
              : rule.condition.metric === 'battery'
              ? '电量'
              : rule.condition.metric === 'signal'
              ? '信号'
              : rule.condition.metric
          const operatorLabel =
            rule.condition.operator === '>'
              ? '超过'
              : rule.condition.operator === '<'
              ? '低于'
              : rule.condition.operator
          const actualValue = rule.condition.metric ? metrics[rule.condition.metric] : 0

          newNotifications.push({
            id: `n_${Date.now()}_${rule.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            deviceId,
            deviceName: device.name,
            message: `设备${metricLabel}${operatorLabel}阈值 ${rule.condition.threshold}，当前值 ${actualValue}`,
            level: rule.condition.metric === 'temperature' && (rule.condition.operator === '>' || rule.condition.operator === '>=') ? 'critical' : 'warning',
            channels: rule.channels,
            read: false,
            resolved: false,
            timestamp: new Date(),
          })
        }
      })

      const updatedRules = state.alertRules.map((r) =>
        triggeredRuleIds.includes(r.id) ? { ...r, lastTriggered: new Date() } : r,
      )

      return {
        ...state,
        devices: updatedDevices,
        alertRules: updatedRules,
        notifications: [...newNotifications, ...state.notifications],
        timeSeries: updatedTs,
      }
    }

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n,
        ),
      }

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case 'RESOLVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, resolved: true, read: true } : n,
        ),
      }

    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLogs: [action.payload, ...state.auditLogs],
      }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      }

    default:
      return state
  }
}

interface StoreContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void
  toggleAlertRule: (id: string) => void
  sendCommand: (cmd: Omit<DeviceCommand, 'id' | 'createdAt' | 'status' | 'executedAt' | 'result' | 'error'>) => void
  addGroup: (group: Omit<DeviceGroup, 'id' | 'createdAt' | 'deviceCount'>) => void
  reportDeviceData: (deviceId: string, metrics: DeviceMetrics, protocol: 'MQTT' | 'HTTP') => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  resolveNotification: (id: string) => void
  getDeviceById: (id: string) => Device | undefined
  getGroupById: (id: string) => DeviceGroup | undefined
  getDevicesByGroup: (groupId: string) => Device[]
  getCommandsByDevice: (deviceId: string) => DeviceCommand[]
  getDeviceTimeSeries: (deviceId: string) => { temperature: TimeSeriesData[]; battery: TimeSeriesData[]; signal: TimeSeriesData[] }
}

const StoreContext = createContext<StoreContextType | null>(null)

function serializeState(state: AppState): string {
  return JSON.stringify(state, (key, value) => {
    if (value instanceof Date) return { __type: 'Date', value: value.toISOString() }
    return value
  })
}

function deserializeState(json: string): AppState {
  return JSON.parse(json, (key, value) => {
    if (value && value.__type === 'Date') return new Date(value.value)
    return value
  })
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = deserializeState(saved)
        if (parsed && parsed.devices) {
          dispatch({ type: 'INIT', payload: parsed })
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (state.initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeState(state))
      } catch {
        // ignore
      }
    }
  }, [state])

  const addAlertRule = useCallback(
    (rule: Omit<AlertRule, 'id' | 'createdAt'>) => {
      dispatch({
        type: 'ADD_ALERT_RULE',
        payload: { ...rule, id: `r_${Date.now()}`, createdAt: new Date() } as AlertRule,
      })
    },
    [dispatch],
  )

  const toggleAlertRule = useCallback(
    (id: string) => {
      dispatch({ type: 'TOGGLE_ALERT_RULE', payload: id })
    },
    [dispatch],
  )

  const sendCommand = useCallback(
    (cmd: Omit<DeviceCommand, 'id' | 'createdAt' | 'status' | 'executedAt' | 'result' | 'error'>) => {
      dispatch({
        type: 'SEND_COMMAND',
        payload: {
          ...cmd,
          id: `c_${Date.now()}`,
          status: 'pending',
          createdAt: new Date(),
        } as DeviceCommand,
      })
    },
    [dispatch],
  )

  const addGroup = useCallback(
    (group: Omit<DeviceGroup, 'id' | 'createdAt' | 'deviceCount'>) => {
      dispatch({
        type: 'ADD_GROUP',
        payload: {
          ...group,
          id: `g_${Date.now()}`,
          deviceCount: 0,
          createdAt: new Date(),
        } as DeviceGroup,
      })
    },
    [dispatch],
  )

  const reportDeviceData = useCallback(
    (deviceId: string, metrics: DeviceMetrics, protocol: 'MQTT' | 'HTTP') => {
      dispatch({ type: 'REPORT_DEVICE_DATA', payload: { deviceId, metrics, protocol } })
    },
    [dispatch],
  )

  const markNotificationRead = useCallback(
    (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
    },
    [dispatch],
  )

  const markAllNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })
  }, [dispatch])

  const resolveNotification = useCallback(
    (id: string) => {
      dispatch({ type: 'RESOLVE_NOTIFICATION', payload: id })
    },
    [dispatch],
  )

  const getDeviceById = useCallback(
    (id: string) => state.devices.find((d) => d.id === id),
    [state.devices],
  )

  const getGroupById = useCallback(
    (id: string) => state.groups.find((g) => g.id === id),
    [state.groups],
  )

  const getDevicesByGroup = useCallback(
    (groupId: string) => state.devices.filter((d) => d.groupId === groupId),
    [state.devices],
  )

  const getCommandsByDevice = useCallback(
    (deviceId: string) => state.commands.filter((c) => c.deviceId === deviceId),
    [state.commands],
  )

  const getDeviceTimeSeries = useCallback(
    (deviceId: string) =>
      state.timeSeries[deviceId] || {
        temperature: generateTimeSeriesData(24, 50, 15),
        battery: generateTimeSeriesData(24, 80, 10),
        signal: generateTimeSeriesData(24, 90, 15),
      },
    [state.timeSeries],
  )

  const value: StoreContextType = {
    state,
    dispatch,
    addAlertRule,
    toggleAlertRule,
    sendCommand,
    addGroup,
    reportDeviceData,
    markNotificationRead,
    markAllNotificationsRead,
    resolveNotification,
    getDeviceById,
    getGroupById,
    getDevicesByGroup,
    getCommandsByDevice,
    getDeviceTimeSeries,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
