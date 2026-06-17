import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Bell,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  Cpu as CpuIcon,
} from 'lucide-react'
import { cn } from '../utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentPath: string
}

const menuItems = [
  { path: '/dashboard', label: '数据概览', icon: LayoutDashboard },
  { path: '/devices', label: '设备管理', icon: Cpu },
  { path: '/alerts', label: '告警规则', icon: AlertTriangle },
  { path: '/notifications', label: '通知消息', icon: Bell },
  { path: '/groups', label: '设备分组', icon: Layers },
  { path: '/audit', label: '审计日志', icon: FileText },
]

export default function Sidebar({ collapsed, onToggle, currentPath }: SidebarProps) {
  return (
    <aside
      className={cn(
        'bg-dark-800 border-r border-dark-700 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <CpuIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">IoT 监控</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
            <CpuIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            currentPath === item.path ||
            (item.path !== '/dashboard' && currentPath.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={onToggle}
        className="h-12 border-t border-dark-700 flex items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  )
}
