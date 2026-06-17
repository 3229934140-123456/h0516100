import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
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
  AlertLogic,
  HitConditionDetail,
  SimulationRecord,
  SimulationRuleResult,
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

const STORAGE_KEY = 'iot-monitor-store-v3'

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
  simulationRecords: SimulationRecord[]
  initialized: boolean
}

type Action =
  | { type: 'INIT'; payload: AppState }
  | { type: 'HYDRATE_DATES' }
  | { type: 'ADD_ALERT_RULE'; payload: AlertRule }
  | { type: 'TOGGLE_ALERT_RULE'; payload: string }
  | { type: 'SEND_COMMAND'; payload: DeviceCommand }
  | { type: 'ADD_GROUP'; payload: DeviceGroup }
  | { type: 'REPORT_DEVICE_DATA'; payload: { deviceId: string; metrics: DeviceMetrics; protocol: 'MQTT' | 'HTTP' } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'RESOLVE_NOTIFICATION'; payload: { id: string; note: string } }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
  | { type: 'ADD_NOTIFICATION'; payload: AlertNotification }
  | { type: 'ADD_SIMULATION_RECORD'; payload: SimulationRecord }
  | { type: 'RESET_STORE' }

function toDate(v: Date | string | undefined): Date {
  if (!v) return new Date()
  return v instanceof Date ? v : new Date(v)
}

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

function enrichMockRules(): AlertRule[] {
  return mockAlertRules.map((r) => ({
    ...r,
    conditions: [r.condition],
    conditionLogic: 'any' as AlertLogic,
  }))
}

function hydrateDates(state: AppState): AppState {
  try {
    return {
      ...state,
      devices: state.devices.map((d) => ({
        ...d,
        lastReport: toDate(d.lastReport),
        createdAt: toDate(d.createdAt),
      })),
      groups: state.groups.map((g) => ({ ...g, createdAt: toDate(g.createdAt) })),
      alertRules: state.alertRules.map((r) => ({
        ...r,
        createdAt: toDate(r.createdAt),
        lastTriggered: r.lastTriggered ? toDate(r.lastTriggered) : undefined,
        conditions: r.conditions?.length ? r.conditions : [r.condition],
        conditionLogic: r.conditionLogic || 'any',
      })),
      notifications: state.notifications.map((n) => ({
        ...n,
        timestamp: toDate(n.timestamp),
        resolvedAt: n.resolvedAt ? toDate(n.resolvedAt) : undefined,
      })),
      commands: state.commands.map((c) => ({
        ...c,
        createdAt: toDate(c.createdAt),
        executedAt: c.executedAt ? toDate(c.executedAt) : undefined,
      })),
      auditLogs: state.auditLogs.map((a) => ({ ...a, timestamp: toDate(a.timestamp) })),
      simulationRecords: (state.simulationRecords || []).map((s) => ({
        ...s,
        time: toDate(s.time),
      })),
      initialized: true,
    }
  } catch (e) {
    return state
  }
}

function getInitialState(): AppState {
  return {
    devices: mockDevices.map((d) => ({ ...d, lastReport: toDate(d.lastReport), createdAt: toDate(d.createdAt) })),
    groups: mockGroups.map((g) => ({ ...g, createdAt: toDate(g.createdAt) })),
    alertRules: enrichMockRules().map((r) => ({
      ...r,
      createdAt: toDate(r.createdAt),
      lastTriggered: r.lastTriggered ? toDate(r.lastTriggered) : undefined,
    })),
    notifications: mockNotifications.map((n) => ({ ...n, timestamp: toDate(n.timestamp) })),
    commands: mockCommands.map((c) => ({
      ...c,
      createdAt: toDate(c.createdAt),
      executedAt: c.executedAt ? toDate(c.executedAt) : undefined,
    })),
    auditLogs: mockAuditLogs.map((a) => ({ ...a, timestamp: toDate(a.timestamp) })),
    timeSeries: buildInitialTimeSeries(),
    simulationRecords: [],
    initialized: true,
  }
}

function checkSingleCondition(
  condition: AlertCondition,
  metrics: DeviceMetrics,
): boolean {
  if (condition.type === 'offline') return false
  if (!condition.metric || condition.operator === undefined || condition.threshold === undefined)
    return false
  const value = metrics[condition.metric]
  if (typeof value !== 'number') return false
  switch (condition.operator) {
    case '>': return value > condition.threshold
    case '>=': return value >= condition.threshold
    case '<': return value < condition.threshold
    case '<=': return value <= condition.threshold
    case '==': return value === condition.threshold
    case '!=': return value !== condition.threshold
    default: return false
  }
}

function checkRuleConditions(rule: AlertRule, metrics: DeviceMetrics): boolean {
  const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
  if (conditions.length === 0) return false
  const results = conditions.map((c) => checkSingleCondition(c, metrics))
  return rule.conditionLogic === 'all'
    ? results.every(Boolean)
    : results.some(Boolean)
}

function formatTsTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return hydrateDates(action.payload)

    case 'HYDRATE_DATES':
      return hydrateDates(state)

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

    case 'TOGGLE_ALERT_RULE': {
      const target = state.alertRules.find((r) => r.id === action.payload)
      const enable = !target?.enabled
      return {
        ...state,
        alertRules: state.alertRules.map((r) =>
          r.id === action.payload ? { ...r, enabled: enable } : r,
        ),
        auditLogs: [
          {
            id: `a_${Date.now()}`,
            action: enable ? '启用告警规则' : '禁用告警规则',
            module: '告警管理',
            targetId: action.payload,
            targetName: target?.name,
            operator: '管理员',
            detail: `${enable ? '启用' : '禁用'}告警规则：${target?.name}`,
            ip: '192.168.1.101',
            timestamp: new Date(),
          },
          ...state.auditLogs,
        ],
      }
    }

    case 'SEND_COMMAND': {
      const newCmd = action.payload
      const updatedCmd: DeviceCommand = {
        ...newCmd,
        status: 'success',
        executedAt: new Date(),
        result: `指令"${newCmd.command}"执行成功`,
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
      const { deviceId, metrics } = action.payload
      const device = state.devices.find((d) => d.id === deviceId)
      if (!device) return state

      const now = new Date()
      const tsPoint = formatTsTime(now)
      const tsMs = now.getTime()

      const newStatus: DeviceStatus = (() => {
        if (metrics.temperature > 80 || metrics.battery < 20 || metrics.signal < 30)
          return 'warning'
        return 'online'
      })()

      const updatedDevices = state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, metrics: { ...d.metrics, ...metrics }, lastReport: now, status: newStatus }
          : d,
      )

      const updatedTs = { ...state.timeSeries }
      const prevTs = updatedTs[deviceId] || { temperature: [], battery: [], signal: [] }
      updatedTs[deviceId] = {
        temperature: [...prevTs.temperature.slice(-287), { time: tsPoint, timestamp: tsMs, value: metrics.temperature }],
        battery: [...prevTs.battery.slice(-287), { time: tsPoint, timestamp: tsMs, value: metrics.battery }],
        signal: [...prevTs.signal.slice(-287), { time: tsPoint, timestamp: tsMs, value: metrics.signal }],
      }

      const newNotifications: AlertNotification[] = []
      const triggeredRuleIds: string[] = []

      state.alertRules.forEach((rule) => {
        if (!rule.enabled) return
        const appliesToGroup = rule.groupIds.includes(device.groupId)
        const appliesToDevice = rule.deviceIds.includes(deviceId)
        if (!appliesToGroup && !appliesToDevice) return

        const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
        const hitDetails: HitConditionDetail[] = conditions
          .filter((c) => c.type === 'metric' && c.metric && c.operator && c.threshold !== undefined)
          .map((c) => {
            const actualValue = metrics[c.metric!] ?? 0
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

        if (!triggered) return

        triggeredRuleIds.push(rule.id)

        const hitCount = hitDetails.filter((h) => h.hit).length
        const logicLabel = rule.conditionLogic === 'all' ? '且' : '或'
        const hitDescs = hitDetails.map((h) => {
          const label = h.metric === 'temperature' ? '温度' : h.metric === 'battery' ? '电量' : '信号'
          const opLabel = h.operator === '>' ? '超过' : h.operator === '<' ? '低于' : h.operator
          return h.hit
            ? `${label} ${opLabel} ${h.threshold}（当前 ${h.actualValue}，命中）`
            : `${label} ${opLabel} ${h.threshold}（当前 ${h.actualValue}，未命中）`
        }).join(` ${logicLabel} `)

        const hasCritical = hitDetails.some((h) => h.hit && h.metric === 'temperature' && (h.operator === '>' || h.operator === '>='))

        newNotifications.push({
          id: `n_${Date.now()}_${rule.id}_${Math.random().toString(36).slice(2, 6)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          deviceId,
          deviceName: device.name,
          message: `${hitCount}/${hitDetails.length} 项条件命中：${hitDescs}`,
          level: hasCritical ? 'critical' : 'warning',
          channels: rule.channels,
          read: false,
          resolved: false,
          hitConditions: hitDetails,
          conditionLogic: rule.conditionLogic,
          timestamp: now,
        })
      })

      const updatedRules = state.alertRules.map((r) =>
        triggeredRuleIds.includes(r.id) ? { ...r, lastTriggered: now } : r,
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

    case 'RESOLVE_NOTIFICATION': {
      const target = state.notifications.find((n) => n.id === action.payload.id)
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id
            ? { ...n, resolved: true, read: true, resolvedBy: '管理员', resolvedAt: new Date(), resolveNote: action.payload.note }
            : n,
        ),
        auditLogs: target
          ? [
              {
                id: `a_${Date.now()}`,
                action: '处理告警',
                module: '通知管理',
                targetId: target.id,
                targetName: target.ruleName,
                operator: '管理员',
                detail: `处理告警：${target.ruleName}（${target.deviceName}），处理备注：${action.payload.note || '无'}`,
                ip: '192.168.1.101',
                timestamp: new Date(),
              },
              ...state.auditLogs,
            ]
          : state.auditLogs,
      }
    }

    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] }

    case 'ADD_SIMULATION_RECORD':
      return {
        ...state,
        simulationRecords: [action.payload, ...(state.simulationRecords || []).slice(0, 49)],
      }

    case 'RESET_STORE':
      localStorage.removeItem(STORAGE_KEY)
      return getInitialState()

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
  resolveNotification: (id: string, note: string) => void
  resetStore: () => void
  addSimulationRecord: (record: Omit<SimulationRecord, 'id'>) => void
  getDeviceById: (id: string) => Device | undefined
  getGroupById: (id: string) => DeviceGroup | undefined
  getDevicesByGroup: (groupId: string) => Device[]
  getCommandsByDevice: (deviceId: string) => DeviceCommand[]
  getDeviceTimeSeries: (deviceId: string) => { temperature: TimeSeriesData[]; battery: TimeSeriesData[]; signal: TimeSeriesData[] }
  getAffectedDevicesForRule: (rule: AlertRule) => Device[]
  getTriggeredNotificationsForRule: (ruleId: string) => AlertNotification[]
  filterTimeSeriesByRange: (data: TimeSeriesData[], rangeHours: number) => TimeSeriesData[]
}

const StoreContext = createContext<StoreContextType | null>(null)

function serializeState(state: AppState): string {
  return JSON.stringify(state, (_, value) => {
    if (value instanceof Date) return { __type: 'Date', value: value.toISOString() }
    return value
  })
}

function deserializeState(json: string): AppState {
  const raw = JSON.parse(json, (_, value) => {
    if (value && value.__type === 'Date') return new Date(value.value)
    return value
  })
  return raw as AppState
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = deserializeState(saved)
        if (parsed && parsed.devices && parsed.initialized) {
          dispatch({ type: 'INIT', payload: parsed })
        }
      }
    } catch (e) {
      console.warn('Failed to load store:', e)
    }
  }, [])

  useEffect(() => {
    if (state.initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeState(state))
      } catch (e) {
        console.warn('Failed to save store:', e)
      }
    }
  }, [state])

  const addAlertRule = useCallback(
    (rule: Omit<AlertRule, 'id' | 'createdAt'>) => {
      const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
      dispatch({
        type: 'ADD_ALERT_RULE',
        payload: {
          ...rule,
          conditions,
          conditionLogic: rule.conditionLogic || 'any',
          id: `r_${Date.now()}`,
          createdAt: new Date(),
        } as AlertRule,
      })
    },
    [],
  )

  const toggleAlertRule = useCallback((id: string) => dispatch({ type: 'TOGGLE_ALERT_RULE', payload: id }), [])

  const sendCommand = useCallback(
    (cmd: Omit<DeviceCommand, 'id' | 'createdAt' | 'status' | 'executedAt' | 'result' | 'error'>) => {
      dispatch({
        type: 'SEND_COMMAND',
        payload: { ...cmd, id: `c_${Date.now()}`, status: 'pending', createdAt: new Date() } as DeviceCommand,
      })
    },
    [],
  )

  const addGroup = useCallback(
    (group: Omit<DeviceGroup, 'id' | 'createdAt' | 'deviceCount'>) => {
      dispatch({
        type: 'ADD_GROUP',
        payload: { ...group, id: `g_${Date.now()}`, deviceCount: 0, createdAt: new Date() } as DeviceGroup,
      })
    },
    [],
  )

  const reportDeviceData = useCallback(
    (deviceId: string, metrics: DeviceMetrics, protocol: 'MQTT' | 'HTTP') => {
      dispatch({ type: 'REPORT_DEVICE_DATA', payload: { deviceId, metrics, protocol } })
    },
    [],
  )

  const markNotificationRead = useCallback((id: string) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }), [])
  const markAllNotificationsRead = useCallback(() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }), [])
  const resolveNotification = useCallback(
    (id: string, note: string) => dispatch({ type: 'RESOLVE_NOTIFICATION', payload: { id, note } }),
    [],
  )
  const resetStore = useCallback(() => dispatch({ type: 'RESET_STORE' }), [])

  const addSimulationRecord = useCallback(
    (record: Omit<SimulationRecord, 'id'>) => {
      dispatch({
        type: 'ADD_SIMULATION_RECORD',
        payload: { ...record, id: `sim_${Date.now()}` } as SimulationRecord,
      })
    },
    [],
  )

  const getDeviceById = useCallback((id: string) => state.devices.find((d) => d.id === id), [state.devices])
  const getGroupById = useCallback((id: string) => state.groups.find((g) => g.id === id), [state.groups])
  const getDevicesByGroup = useCallback(
    (groupId: string) => state.devices.filter((d) => d.groupId === groupId),
    [state.devices],
  )
  const getCommandsByDevice = useCallback(
    (deviceId: string) => state.commands.filter((c) => c.deviceId === deviceId),
    [state.commands],
  )
  const getDeviceTimeSeries = useCallback(
    (deviceId: string) => {
      if (state.timeSeries[deviceId]) return state.timeSeries[deviceId]
      const fallback = {
        temperature: generateTimeSeriesData(24, 50, 15),
        battery: generateTimeSeriesData(24, 80, 10),
        signal: generateTimeSeriesData(24, 90, 15),
      }
      return fallback
    },
    [state.timeSeries],
  )

  const getAffectedDevicesForRule = useCallback(
    (rule: AlertRule) => {
      return state.devices.filter(
        (d) => rule.groupIds.includes(d.groupId) || rule.deviceIds.includes(d.id),
      )
    },
    [state.devices],
  )

  const getTriggeredNotificationsForRule = useCallback(
    (ruleId: string) => state.notifications.filter((n) => n.ruleId === ruleId).slice(0, 10),
    [state.notifications],
  )

  const filterTimeSeriesByRange = useCallback((data: TimeSeriesData[], rangeHours: number) => {
    if (!data.length) return data
    if (rangeHours <= 0) return data
    const cutoff = Date.now() - rangeHours * 3600 * 1000
    const withTs = data.filter((d) => d.timestamp !== undefined)
    if (withTs.length > 0) {
      return withTs.filter((d) => (d.timestamp || 0) >= cutoff)
    }
    const pointsPerHour = 6
    const take = Math.min(data.length, rangeHours * pointsPerHour + 1)
    return data.slice(-take)
  }, [])

  const value = useMemo<StoreContextType>(
    () => ({
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
      resetStore,
      addSimulationRecord,
      getDeviceById,
      getGroupById,
      getDevicesByGroup,
      getCommandsByDevice,
      getDeviceTimeSeries,
      getAffectedDevicesForRule,
      getTriggeredNotificationsForRule,
      filterTimeSeriesByRange,
    }),
    [
      state,
      addAlertRule,
      toggleAlertRule,
      sendCommand,
      addGroup,
      reportDeviceData,
      markNotificationRead,
      markAllNotificationsRead,
      resolveNotification,
      resetStore,
      addSimulationRecord,
      getDeviceById,
      getGroupById,
      getDevicesByGroup,
      getCommandsByDevice,
      getDeviceTimeSeries,
      getAffectedDevicesForRule,
      getTriggeredNotificationsForRule,
      filterTimeSeriesByRange,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
