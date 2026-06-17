import { cn } from '../../utils'
import { getStatusColor, getStatusLabel, getStatusBgColor } from '../../utils'

interface StatusBadgeProps {
  status: string
  className?: string
  showLabel?: boolean
}

export default function StatusBadge({ status, className, showLabel = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        getStatusBgColor(status),
        className,
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'online' || status === 'running' || status === 'success'
            ? 'bg-emerald-500 animate-pulse-dot'
            : status === 'warning'
            ? 'bg-amber-500'
            : status === 'error' || status === 'fault' || status === 'failed' || status === 'critical'
            ? 'bg-red-500 animate-pulse-dot'
            : status === 'offline' || status === 'idle'
            ? 'bg-slate-500'
            : 'bg-blue-500',
        )}
      />
      {showLabel && <span className={getStatusColor(status)}>{getStatusLabel(status)}</span>}
    </span>
  )
}
