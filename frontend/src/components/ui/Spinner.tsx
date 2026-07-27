import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-mint', className)} />
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Spinner className="w-8 h-8" />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white/[0.04]',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent',
        className
      )}
    />
  )
}
