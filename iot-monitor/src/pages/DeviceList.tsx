import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Thermometer,
  Battery,
  Signal,
  Cpu,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Activity,
} from 'lucide-react'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import { useStore } from '../store'
import { formatRelativeTime, cn } from '../utils'
import type { DeviceStatus } from '../types'

export default function DeviceList() {
  const navigate = useNavigate()
  const { state } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')

  const filteredDevices = useMemo(() => {
    return state.devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter
      const matchesGroup = groupFilter === 'all' || device.groupId === groupFilter
      return matchesSearch && matchesStatus && matchesGroup
    })
  }, [searchTerm, statusFilter, groupFilter, state.devices])

  const stats = useMemo(() => {
    return {
      total: state.devices.length,
      online: state.devices.filter((d) => d.status === 'online').length,
      offline: state.devices.filter((d) => d.status === 'offline').length,
      warning: state.devices.filter((d) => d.status === 'warning' || d.status === 'error').length,
    }
  }, [state.devices])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="设备总数" value={stats.total} icon={Cpu} color="primary" />
        <StatCard label="在线设备" value={stats.online} icon={Activity} color="emerald" />
        <StatCard label="离线设备" value={stats.offline} icon={Activity} color="slate" />
        <StatCard label="异常设备" value={stats.warning} icon={Activity} color="red" />
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="搜索设备名称、编号、位置..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
                className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="warning">告警</option>
                <option value="error">故障</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-8 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">全部分组</option>
                {state.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <Button>
              <Plus className="w-4 h-4" />
              添加设备
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 -my-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  设备信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  温度
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  电量
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  信号
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  最后上报
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredDevices.map((device) => {
                const isOffline = device.status === 'offline' || device.status === 'error'
                const lastReportMinutes =
                  (new Date().getTime() - device.lastReport.getTime()) / 60000
                const shouldHighlight = lastReportMinutes > 10

                return (
                  <tr
                    key={device.id}
                    className={cn(
                      'hover:bg-dark-700/30 transition-colors cursor-pointer',
                      shouldHighlight && 'bg-red-500/5',
                    )}
                    onClick={() => navigate(`/devices/${device.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{device.name}</p>
                          <p className="text-sm text-dark-400">
                            {device.serial} · {device.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={isOffline ? 'offline' : device.status} />
                    </td>
                    <td className="px-6 py-4">
                      <MetricDisplay
                        value={device.metrics.temperature}
                        unit="°C"
                        icon={Thermometer}
                        warning={device.metrics.temperature > 80}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <MetricDisplay
                        value={device.metrics.battery}
                        unit="%"
                        icon={Battery}
                        warning={device.metrics.battery < 20}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <MetricDisplay
                        value={device.metrics.signal}
                        unit="%"
                        icon={Signal}
                        warning={device.metrics.signal < 30}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'text-sm',
                          shouldHighlight ? 'text-red-400 font-medium' : 'text-dark-300',
                        )}
                      >
                        {formatRelativeTime(device.lastReport)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/devices/${device.id}`)
                        }}
                      >
                        详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>未找到匹配的设备</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: any
  color: 'primary' | 'emerald' | 'slate' | 'red'
}) {
  const colors = {
    primary: 'from-primary-500/20 to-primary-600/5 text-primary-400 border-primary-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
    slate: 'from-slate-500/20 to-slate-600/5 text-slate-400 border-slate-500/20',
    red: 'from-red-500/20 to-red-600/5 text-red-400 border-red-500/20',
  }

  return (
    <div
      className={cn(
        'bg-dark-800 border rounded-xl p-5 bg-gradient-to-br',
        colors[color],
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-dark-700/50 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function MetricDisplay({
  value,
  unit,
  icon: Icon,
  warning,
}: {
  value: number
  unit: string
  icon: any
  warning?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-4 h-4', warning ? 'text-red-400' : 'text-dark-400')} />
      <span className={cn('font-medium', warning ? 'text-red-400' : 'text-white')}>
        {value}
        {unit}
      </span>
    </div>
  )
}
