import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  Activity,
  AlertTriangle,
  TrendingUp,
  Thermometer,
  Battery,
  Signal,
  ChevronRight,
  Clock,
  Layers,
  Bell,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import {
  mockDevices,
  mockGroups,
  mockNotifications,
  generateTimeSeriesData,
} from '../data/mockData'
import { formatRelativeTime, cn } from '../utils'

export default function Dashboard() {
  const stats = useMemo(() => {
    return {
      total: mockDevices.length,
      online: mockDevices.filter((d) => d.status === 'online').length,
      offline: mockDevices.filter((d) => d.status === 'offline').length,
      warning: mockDevices.filter((d) => d.status === 'warning' || d.status === 'error').length,
    }
  }, [])

  const onlineRate = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0
  }, [stats])

  const deviceStatusData = [
    { name: '在线', value: stats.online, color: '#10b981' },
    { name: '离线', value: stats.offline, color: '#64748b' },
    { name: '异常', value: stats.warning, color: '#ef4444' },
  ]

  const temperatureTrend = useMemo(() => generateTimeSeriesData(24, 60, 15), [])
  const unreadNotifications = mockNotifications.filter((n) => !n.read).slice(0, 5)

  const recentDevices = mockDevices.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">数据概览</h1>
        <p className="text-dark-400 mt-1">欢迎回来，实时监控您的 IoT 设备运行状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="设备总数"
          value={stats.total}
          icon={Cpu}
          color="primary"
          trend="+2"
          trendLabel="较昨日"
        />
        <StatCard
          label="在线设备"
          value={stats.online}
          icon={Activity}
          color="emerald"
          trend={`${onlineRate}%`}
          trendLabel="在线率"
        />
        <StatCard
          label="离线设备"
          value={stats.offline}
          icon={Clock}
          color="slate"
          trend={`${stats.offline}`}
          trendLabel="待处理"
        />
        <StatCard
          label="告警数量"
          value={unreadNotifications.length}
          icon={AlertTriangle}
          color="red"
          trend="紧急"
          trendLabel={
            unreadNotifications.filter((n) => n.level === 'critical').length > 0
              ? `${unreadNotifications.filter((n) => n.level === 'critical').length}条严重`
              : '无严重告警'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="24小时温度趋势"
          subtitle="全平台平均温度变化"
          className="lg:col-span-2"
          action={
            <Link
              to="/devices"
              className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureTrend}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#tempGradient)"
                  name="温度 (°C)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="设备状态分布" subtitle="当前各状态设备占比">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="设备列表"
          subtitle="最近活跃的设备"
          className="lg:col-span-2"
          action={
            <Link
              to="/devices"
              className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="space-y-3">
            {recentDevices.map((device) => (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-700/30 hover:bg-dark-700/60 transition-colors border border-transparent hover:border-dark-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{device.name}</p>
                    <p className="text-xs text-dark-400">{device.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4">
                    <MiniMetric
                      icon={Thermometer}
                      value={`${device.metrics.temperature}°C`}
                      warning={device.metrics.temperature > 80}
                    />
                    <MiniMetric
                      icon={Battery}
                      value={`${device.metrics.battery}%`}
                      warning={device.metrics.battery < 20}
                    />
                    <MiniMetric
                      icon={Signal}
                      value={`${device.metrics.signal}%`}
                      warning={device.metrics.signal < 30}
                    />
                  </div>
                  <StatusBadge status={device.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card
          title="最近告警"
          subtitle="需要关注的通知"
          action={
            <Link
              to="/notifications"
              className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="space-y-3">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'p-3 rounded-xl border',
                    n.level === 'critical'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-amber-500/5 border-amber-500/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Bell
                      className={cn(
                        'w-5 h-5 mt-0.5 flex-shrink-0',
                        n.level === 'critical' ? 'text-red-400' : 'text-amber-400',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            n.level === 'critical' ? 'text-red-400' : 'text-amber-400',
                          )}
                        >
                          {n.ruleName}
                        </p>
                        <span className="text-xs text-dark-400 whitespace-nowrap">
                          {formatRelativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mt-1 truncate">{n.deviceName}</p>
                      <p className="text-xs text-dark-400 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无未读告警</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="设备分组概览" subtitle="快速查看各分组状态">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockGroups.map((group) => {
            const devices = mockDevices.filter((d) => d.groupId === group.id)
            const online = devices.filter((d) => d.status === 'online').length
            const warning = devices.filter(
              (d) => d.status === 'warning' || d.status === 'error',
            ).length
            return (
              <Link
                key={group.id}
                to="/groups"
                className="p-5 rounded-xl bg-dark-700/30 border border-dark-700 hover:border-primary-500/30 hover:bg-dark-700/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                    <Layers className="w-6 h-6 text-primary-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                  {group.name}
                </h4>
                <p className="text-xs text-dark-400 mt-1 line-clamp-1">{group.description}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-dark-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{devices.length}</p>
                    <p className="text-xs text-dark-500">总数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{online}</p>
                    <p className="text-xs text-dark-500">在线</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-400">{warning}</p>
                    <p className="text-xs text-dark-500">异常</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendLabel,
}: {
  label: string
  value: number
  icon: any
  color: 'primary' | 'emerald' | 'slate' | 'red'
  trend: string
  trendLabel: string
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700/50">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">{trend}</span>
        <span className="text-xs text-dark-400">{trendLabel}</span>
      </div>
    </div>
  )
}

function MiniMetric({
  icon: Icon,
  value,
  warning,
}: {
  icon: any
  value: string
  warning?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Icon className={cn('w-3.5 h-3.5', warning ? 'text-red-400' : 'text-dark-400')} />
      <span className={cn('text-sm', warning ? 'text-red-400' : 'text-dark-300')}>{value}</span>
    </div>
  )
}
