import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  Filter,
  Download,
  User,
  Cpu,
  AlertTriangle,
  Layers,
  Settings,
  Globe,
  ChevronDown,
  ChevronUp,
  Bell,
  ExternalLink,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { useStore } from '../store'
import { formatDateTime, cn } from '../utils'
import type { AuditLog, DeviceCommand } from '../types'

type TabType = 'audit' | 'commands'

export default function AuditLogs() {
  const { state } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('audit')
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const modules = ['系统', '设备管理', '告警管理', '分组管理', '用户管理', '通知管理']

  const filteredLogs = state.auditLogs.filter((log) => {
    const matchesSearch =
      log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
    return matchesSearch && matchesModule
  })

  const filteredCommands = state.commands.filter((cmd) => {
    const matchesSearch =
      cmd.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.operator.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      actionFilter === 'all' || cmd.status === actionFilter
    return matchesSearch && matchesStatus
  })

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case '设备管理':
        return Cpu
      case '告警管理':
        return AlertTriangle
      case '分组管理':
        return Layers
      case '系统':
        return Settings
      case '通知管理':
        return Bell
      default:
        return User
    }
  }

  const getModuleColor = (moduleName: string) => {
    switch (moduleName) {
      case '设备管理':
        return 'text-blue-400 bg-blue-500/10'
      case '告警管理':
        return 'text-amber-400 bg-amber-500/10'
      case '分组管理':
        return 'text-purple-400 bg-purple-500/10'
      case '系统':
        return 'text-slate-400 bg-slate-500/10'
      case '通知管理':
        return 'text-red-400 bg-red-500/10'
      default:
        return 'text-primary-400 bg-primary-500/10'
    }
  }

  const getTargetLink = (log: AuditLog) => {
    if (!log.targetId) return null
    if (log.module === '设备管理' || log.module === '通知管理') {
      const device = state.devices.find((d) => d.id === log.targetId)
      if (device) return `/devices/${device.id}`
      const notif = state.notifications.find((n) => n.id === log.targetId)
      if (notif) return `/devices/${notif.deviceId}`
    }
    if (log.module === '告警管理') return '/alert-rules'
    if (log.module === '分组管理') return '/groups'
    if (log.module === '通知管理') return '/notifications'
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">操作审计</h1>
          <p className="text-dark-400 mt-1">
            查看系统操作日志和设备指令执行记录
          </p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4" />
          导出日志
        </Button>
      </div>

      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700 w-fit">
        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'audit'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'text-dark-300 hover:text-white',
          )}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            审计日志
          </div>
        </button>
        <button
          onClick={() => setActiveTab('commands')}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'commands'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'text-dark-300 hover:text-white',
          )}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            指令记录
          </div>
        </button>
      </div>

      {activeTab === 'audit' ? (
        <Card>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="搜索操作人、操作内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">全部模块</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 -my-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    操作时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    模块
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    操作类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    操作详情
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    IP地址
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredLogs.map((log: AuditLog) => {
                  const ModuleIcon = getModuleIcon(log.module)
                  const targetLink = getTargetLink(log)
                  return (
                    <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-300">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                            getModuleColor(log.module),
                            'border-transparent',
                          )}
                        >
                          <ModuleIcon className="w-3.5 h-3.5" />
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-dark-300">{log.detail}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {log.targetName && (
                              <p className="text-xs text-dark-500">
                                目标：{log.targetName}
                              </p>
                            )}
                            {targetLink && (
                              <Link
                                to={targetLink}
                                className="inline-flex items-center gap-0.5 text-xs text-primary-400 hover:text-primary-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                                查看
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-dark-300" />
                          </div>
                          <span className="text-sm text-white">{log.operator}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-dark-400">
                          <Globe className="w-3.5 h-3.5" />
                          {log.ip}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无审计日志</p>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="搜索设备名称、指令、操作人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="pending">待执行</option>
                <option value="sent">已下发</option>
                <option value="executing">执行中</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredCommands.map((cmd: DeviceCommand) => (
              <div
                key={cmd.id}
                className="bg-dark-700/30 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{cmd.command}</h4>
                        <StatusBadge status={cmd.status} />
                      </div>
                      <p className="text-sm text-dark-400 mt-1">
                        目标设备：{cmd.deviceName}
                      </p>
                      {cmd.params && (
                        <p className="text-xs text-dark-500 mt-1">
                          参数：{JSON.stringify(cmd.params)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-dark-400">下发时间</p>
                    <p className="text-sm text-white mt-0.5">
                      {formatDateTime(cmd.createdAt)}
                    </p>
                    {cmd.executedAt && (
                      <>
                        <p className="text-sm text-dark-400 mt-2">执行时间</p>
                        <p className="text-sm text-white mt-0.5">
                          {formatDateTime(cmd.executedAt)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {(cmd.result || cmd.error) && (
                  <div
                    className={cn(
                      'mt-4 pt-4 border-t border-dark-700',
                      cmd.error ? 'bg-red-500/5 -mx-5 -mb-5 px-5 py-4 rounded-b-xl border-t-red-500/20' : '',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {cmd.error ? (
                        <ChevronDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={cn('text-sm font-medium', cmd.error ? 'text-red-400' : 'text-emerald-400')}>
                          {cmd.error ? '执行失败' : '执行结果'}
                        </p>
                        <p className="text-sm text-dark-300 mt-1">
                          {cmd.error || cmd.result}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-dark-300" />
                    </div>
                    <span className="text-sm text-dark-300">操作人：{cmd.operator}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-center py-12 text-dark-400">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无指令记录</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
