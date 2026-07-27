import { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { IconTile } from './IconTile'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'mint' | 'violet' | 'flame' | 'neutral'
  change?: { value: string; positive: boolean }
  className?: string
}

export function StatCard({ label, value, icon, tone = 'neutral', change, className }: StatCardProps) {
  return (
    <div className={cn('stat-card flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value mt-1 truncate">{value}</p>
        {change && (
          <p
            className={cn(
              'stat-card-change',
              change.positive ? 'stat-card-change-positive' : 'stat-card-change-negative'
            )}
          >
            {change.value}
          </p>
        )}
      </div>
      {icon && <IconTile tone={tone === 'neutral' ? 'mint' : tone}>{icon}</IconTile>}
    </div>
  )
}
