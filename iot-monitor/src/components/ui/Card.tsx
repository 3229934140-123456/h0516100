import { cn } from '../../utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export default function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div className={cn('bg-dark-800 border border-dark-700 rounded-xl overflow-hidden', className)}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
