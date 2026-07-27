import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'expense' | 'income' | 'primary' | 'success' | 'warning' | 'gray'

const toneClass: Record<Tone, string> = {
  expense: 'badge-expense',
  income: 'badge-income',
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  gray: 'badge-gray',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'gray', className, ...props }: BadgeProps) {
  return <span className={cn(toneClass[tone], className)} {...props} />
}
