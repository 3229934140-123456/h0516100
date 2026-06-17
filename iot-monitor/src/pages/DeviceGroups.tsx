import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  Plus,
  Cpu,
  ChevronRight,
  Edit2,
  Activity,
  Users,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { useStore } from '../store'
import { cn } from '../utils'

export default function DeviceGroups() {
  const { state, addGroup } = useStore()
  const { groups, devices } = state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const getGroupStats = (groupId: string) => {
    const groupDevices = devices.filter((d) => d.groupId === groupId)
    return {
      total: groupDevices.length,
      online: groupDevices.filter((d) => d.status === 'online').length,
      offline: groupDevices.filter((d) => d.status === 'offline').length,
      warning: groupDevices.filter((d) => d.status === 'warning' || d.status === 'error').length,
    }
  }

  const selectedDevices = selectedGroup
    ? devices.filter((d) => d.groupId === selectedGroup)
    : []

  const selectedGroupData = selectedGroup
    ? groups.find((g) => g.id === selectedGroup)
    : null

  const handleCreateGroup = () => {
    if (!formName.trim()) return
    addGroup({ name: formName.trim(), description: formDesc.trim() })
    setFormName('')
    setFormDesc('')
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">设备分组管理</h1>
          <p className="text-dark-400 mt-1">
            按业务类型或区域对设备进行分组，统一查看和管理
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          新建分组
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title="分组列表" subtitle={`共 ${groups.length} 个分组`}>
            <div className="space-y-2 -mx-2">
              {groups.map((group) => {
                const stats = getGroupStats(group.id)
                const isSelected = selectedGroup === group.id
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(isSelected ? null : group.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl transition-all border',
                      isSelected
                        ? 'bg-primary-500/10 border-primary-500/30'
                        : 'bg-dark-700/30 border-transparent hover:bg-dark-700/60 hover:border-dark-600',
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            isSelected ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-600 text-dark-400',
                          )}
                        >
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={cn('font-semibold', isSelected ? 'text-white' : 'text-dark-200')}>
                            {group.name}
                          </p>
                          <p className="text-xs text-dark-400 mt-0.5">{group.description}</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          'w-5 h-5 transition-transform',
                          isSelected && 'rotate-90 text-primary-400',
                          !isSelected && 'text-dark-500',
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <StatMini label="总数" value={stats.total} color="primary" />
                      <StatMini label="在线" value={stats.online} color="emerald" />
                      <StatMini label="离线" value={stats.offline} color="slate" />
                      <StatMini label="异常" value={stats.warning} color="red" />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedGroup && selectedGroupData ? (
            <Card
              title={selectedGroupData.name}
              subtitle={selectedGroupData.description}
              action={
                <Button variant="secondary" size="sm">
                  <Edit2 className="w-4 h-4" />
                  编辑
                </Button>
              }
            >
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <Cpu className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{selectedDevices.length}</p>
                  <p className="text-xs text-dark-400">设备总数</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <Activity className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">
                    {getGroupStats(selectedGroup).online}
                  </p>
                  <p className="text-xs text-dark-400">在线设备</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-400">
                    {getGroupStats(selectedGroup).offline}
                  </p>
                  <p className="text-xs text-dark-400">离线设备</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <Activity className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">
                    {getGroupStats(selectedGroup).warning}
                  </p>
                  <p className="text-xs text-dark-400">异常设备</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white mb-3">组内设备</h4>
              <div className="space-y-2">
                {selectedDevices.map((device) => (
                  <Link
                    key={device.id}
                    to={`/devices/${device.id}`}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl hover:bg-dark-700/60 transition-colors border border-transparent hover:border-dark-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{device.name}</p>
                        <p className="text-xs text-dark-400">{device.serial} · {device.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-white">{device.metrics.temperature}°C</p>
                        <p className="text-xs text-dark-400">电量 {device.metrics.battery}%</p>
                      </div>
                      <StatusBadge status={device.status} />
                    </div>
                  </Link>
                ))}
                {selectedDevices.length === 0 && (
                  <div className="text-center py-12 text-dark-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>该分组暂无设备</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-16 text-dark-400">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">请从左侧选择一个分组</p>
                <p className="text-sm mt-1">查看分组详情和组内设备列表</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-md animate-fade-in">
            <div className="px-6 py-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-white">新建设备分组</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">分组名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：温度传感器组"
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">分组描述</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="描述该分组的用途和范围"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-dark-700 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setFormName(''); setFormDesc(''); setShowModal(false) }}>
                取消
              </Button>
              <Button onClick={handleCreateGroup} disabled={!formName.trim()}>
                创建分组
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatMini({ label, value, color }: { label: string; value: number; color: 'primary' | 'emerald' | 'slate' | 'red' }) {
  const colors = { primary: 'text-primary-400', emerald: 'text-emerald-400', slate: 'text-slate-400', red: 'text-red-400' }
  return (
    <div className="text-center">
      <p className={cn('text-lg font-bold', colors[color])}>{value}</p>
      <p className="text-xs text-dark-500">{label}</p>
    </div>
  )
}
