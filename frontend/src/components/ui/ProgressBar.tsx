import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  tone?: 'mint' | 'violet' | 'flame' | 'amber' | 'auto'
  className?: string
}

function autoTone(value: number): 'mint' | 'amber' | 'flame' {
  if (value >= 100) return 'flame'
  if (value >= 80) return 'amber'
  return 'mint'
}

const barClass: Record<string, string> = {
  mint: 'bg-mint',
  violet: 'bg-violet',
  flame: 'bg-flame',
  amber: 'bg-amber',
}

export function ProgressBar({ value, tone = 'auto', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const resolved = tone === 'auto' ? autoTone(value) : tone
  return (
    <div className={cn('h-2 w-full rounded-full bg-white/[0.06] overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', barClass[resolved])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
