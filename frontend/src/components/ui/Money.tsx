import { cn, formatCurrency } from '../../lib/utils'

interface MoneyProps {
  amount: number
  currency?: string
  /** 'expense' shows red with -, 'income' shows mint with +, 'auto' colors by sign, 'plain' no color */
  tone?: 'expense' | 'income' | 'auto' | 'plain'
  /** Force a leading + / - sign regardless of tone. */
  signed?: boolean
  className?: string
}

export function Money({ amount, currency = 'INR', tone = 'plain', signed, className }: MoneyProps) {
  let colorClass = 'text-text-hi'
  let sign = ''

  if (tone === 'expense') {
    colorClass = 'text-flame'
    sign = (signed ?? true) ? '-' : ''
  } else if (tone === 'income') {
    colorClass = 'text-mint'
    sign = (signed ?? true) ? '+' : ''
  } else if (tone === 'auto') {
    colorClass = amount < 0 ? 'text-flame' : 'text-mint'
    sign = signed ? (amount < 0 ? '-' : '+') : ''
  } else if (signed) {
    sign = amount < 0 ? '-' : '+'
  }

  return (
    <span className={cn('tnum', colorClass, className)}>
      {sign}
      {formatCurrency(Math.abs(amount), currency)}
    </span>
  )
}
