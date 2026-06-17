import { Bell, Search, User } from 'lucide-react'
import { useState } from 'react'
import { cn, formatRelativeTime, getStatusColor } from '../utils'
import { Link } from 'react-router-dom'
import { useStore } from '../store'

export default function Navbar() {
  const { state } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = state.notifications.filter((n) => !n.read).length

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="搜索设备、告警..."
            className="w-80 h-9 bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
                <span className="font-semibold text-white">通知消息</span>
                <Link
                  to="/notifications"
                  className="text-sm text-primary-400 hover:text-primary-300"
                  onClick={() => setShowNotifications(false)}
                >
                  查看全部
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {state.notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 border-b border-dark-700 last:border-0 hover:bg-dark-700/50 transition-colors cursor-pointer',
                      !n.read && 'bg-primary-500/5',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          n.level === 'critical'
                            ? 'bg-red-500 animate-pulse-dot'
                            : n.level === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn('font-medium text-sm', getStatusColor(n.level))}>
                            {n.ruleName}
                          </span>
                          <span className="text-xs text-dark-400">
                            {formatRelativeTime(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-dark-300 mt-0.5 truncate">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-dark-700">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">管理员</p>
            <p className="text-xs text-dark-400">admin@company.com</p>
          </div>
        </div>
      </div>
    </header>
  )
}
