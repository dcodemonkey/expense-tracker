import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'mint' | 'violet' | 'flame' | 'amber'

const toneClass: Record<Tone, string> = {
  mint: 'bg-mint-soft text-mint',
  violet: 'bg-violet-soft text-violet',
  flame: 'bg-flame-soft text-flame',
  amber: 'bg-amber-soft text-amber',
}

interface IconTileProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export function IconTile({ children, tone = 'mint', className }: IconTileProps) {
  return (
    <div
      className={cn(
        'shrink-0 grid place-items-center w-11 h-11 rounded-xl',
        toneClass[tone],
        className
      )}
    >
      {children}
    </div>
  )
}
