import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Thermometer,
  Battery,
  Signal,
  Cpu,
  Activity,
  Calendar,
  MapPin,
  Tag,
  Wifi,
  HardDrive,
  Send,
  RefreshCw,
  Download,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import {
  getDeviceById,
  getGroupById,
  generateTimeSeriesData,
  mockCommands,
} from '../data/mockData'
import { formatDateTime, cn } from '../utils'

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [showCommandModal, setShowCommandModal] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState('')
  const [commandParams, setCommandParams] = useState('')

  const device = useMemo(() => (id ? getDeviceById(id) : undefined), [id])
  const group = useMemo(() => (device ? getGroupById(device.groupId) : undefined), [device])

  const timeRangeHours: Record<TimeRange, number> = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 168,
    '30d': 720,
  }

  const temperatureData = useMemo(
    () => generateTimeSeriesData(timeRangeHours[timeRange], 65, 20),
    [timeRange],
  )
  const batteryData = useMemo(
    () => generateTimeSeriesData(timeRangeHours[timeRange], 85, 10),
    [timeRange],
  )
  const signalData = useMemo(
    () => generateTimeSeriesData(timeRangeHours[timeRange], 90, 15),
    [timeRange],
  )

  const deviceCommands = useMemo(
    () => mockCommands.filter((c) => c.deviceId === id),
    [id],
  )

  if (!device) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-400 mb-4">设备不存在</p>
        <Button onClick={() => navigate('/devices')}>返回设备列表</Button>
      </div>
    )
  }

  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '1h', label: '1小时' },
    { key: '6h', label: '6小时' },
    { key: '24h', label: '24小时' },
    { key: '7d', label: '7天' },
    { key: '30d', label: '30天' },
  ]

  const commands = [
    { value: 'reboot', label: '重启设备' },
    { value: 'firmware_upgrade', label: '固件升级' },
    { value: 'diagnose', label: '远程诊断' },
    { value: 'config', label: '参数配置' },
    { value: 'reset', label: '恢复出厂设置' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/devices')}
            className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{device.name}</h1>
              <StatusBadge status={device.status} />
            </div>
            <p className="text-dark-400 mt-1">
              {device.serial} · {device.model}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowCommandModal(true)}>
            <Send className="w-4 h-4" />
            下发指令
          </Button>
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MetricCard
                label="温度"
                value={device.metrics.temperature}
                unit="°C"
                icon={Thermometer}
                color="orange"
                warning={device.metrics.temperature > 80}
              />
              <MetricCard
                label="电量"
                value={device.metrics.battery}
                unit="%"
                icon={Battery}
                color="green"
                warning={device.metrics.battery < 20}
              />
              <MetricCard
                label="信号"
                value={device.metrics.signal}
                unit="%"
                icon={Signal}
                color="blue"
                warning={device.metrics.signal < 30}
              />
              <MetricCard
                label="运行状态"
                value={device.runState === 'running' ? '正常' : device.runState}
                icon={Activity}
                color="purple"
              />
            </div>
          </Card>

          <Card
            title="历史数据趋势"
            subtitle="查看设备关键指标的历史变化"
            action={
              <div className="flex items-center gap-2">
                <div className="flex bg-dark-700 rounded-lg p-1">
                  {timeRanges.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setTimeRange(r.key)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md transition-colors',
                        timeRange === r.key
                          ? 'bg-primary-600 text-white'
                          : 'text-dark-300 hover:text-white',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4" />
                  导出
                </Button>
              </div>
            }
          >
            <div className="space-y-8">
              <ChartSection title="温度趋势" unit="°C" data={temperatureData} color="#f97316" />
              <ChartSection title="电量趋势" unit="%" data={batteryData} color="#22c55e" />
              <ChartSection title="信号强度" unit="%" data={signalData} color="#3b82f6" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="设备信息">
            <div className="space-y-4">
              <InfoItem icon={Tag} label="设备编号" value={device.serial} />
              <InfoItem icon={HardDrive} label="设备型号" value={device.model} />
              <InfoItem icon={Wifi} label="通信协议" value={device.protocol} />
              <InfoItem icon={Activity} label="固件版本" value={device.firmware} />
              <InfoItem icon={MapPin} label="安装位置" value={device.location} />
              <InfoItem
                icon={Tag}
                label="所属分组"
                value={
                  group ? (
                    <Link
                      to={`/groups`}
                      className="text-primary-400 hover:text-primary-300"
                    >
                      {group.name}
                    </Link>
                  ) : (
                    '未分组'
                  )
                }
              />
              <InfoItem icon={Calendar} label="最后上报" value={formatDateTime(device.lastReport)} />
              <InfoItem icon={Calendar} label="注册时间" value={formatDateTime(device.createdAt)} />
            </div>
          </Card>

          <Card
            title="系统资源"
            subtitle="设备CPU和内存使用情况"
          >
            <div className="space-y-4">
              <ResourceBar label="CPU 使用率" value={device.metrics.cpu || 0} color="#3b82f6" />
              <ResourceBar label="内存使用率" value={device.metrics.memory || 0} color="#8b5cf6" />
            </div>
          </Card>

          <Card title="最近操作" subtitle="设备指令执行记录">
            {deviceCommands.length > 0 ? (
              <div className="space-y-3">
                {deviceCommands.slice(0, 5).map((cmd) => (
                  <div
                    key={cmd.id}
                    className="flex items-start justify-between py-2 border-b border-dark-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{cmd.command}</p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {formatDateTime(cmd.createdAt)} · {cmd.operator}
                      </p>
                    </div>
                    <StatusBadge status={cmd.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">暂无操作记录</p>
            )}
          </Card>
        </div>
      </div>

      {showCommandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-md animate-fade-in">
            <div className="px-6 py-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">下发远程指令</h3>
              <p className="text-sm text-dark-400 mt-1">
                目标设备：{device.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  选择指令
                </label>
                <select
                  value={selectedCommand}
                  onChange={(e) => setSelectedCommand(e.target.value)}
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="">请选择指令...</option>
                  {commands.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  指令参数（可选）
                </label>
                <textarea
                  value={commandParams}
                  onChange={(e) => setCommandParams(e.target.value)}
                  placeholder='JSON格式参数，如: {"interval": 30}'
                  rows={4}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-300">
                  ⚠️ 远程指令将发送到设备，请确保设备在线且固件支持对应指令。操作将被记录到审计日志。
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-dark-700 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCommandModal(false)}>
                取消
              </Button>
              <Button
                disabled={!selectedCommand}
                onClick={() => {
                  alert(`指令已下发：${selectedCommand}`)
                  setShowCommandModal(false)
                }}
              >
                确认下发
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  warning,
}: {
  label: string
  value: number | string
  unit?: string
  icon: any
  color: 'orange' | 'green' | 'blue' | 'purple'
  warning?: boolean
}) {
  const colors = {
    orange: 'text-orange-400 bg-orange-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }

  return (
    <div className="text-center">
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3',
          colors[color],
        )}
      >
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-sm text-dark-400">{label}</p>
      <p
        className={cn(
          'text-2xl font-bold mt-1',
          warning ? 'text-red-400' : 'text-white',
        )}
      >
        {value}
        {unit && <span className="text-sm font-normal text-dark-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function ChartSection({
  title,
  unit,
  data,
  color,
}: {
  title: string
  unit: string
  data: any[]
  color: string
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-3">{title} ({unit})</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              itemStyle={{ color }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-dark-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-dark-400">{label}</p>
        <p className="text-sm text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

function ResourceBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-dark-300">{label}</span>
        <span className="text-sm font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
