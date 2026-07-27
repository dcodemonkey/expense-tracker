import { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('label', className)} {...props} />
}

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode
  htmlFor?: string
  error?: string
  hint?: string
}

export function Field({ label, htmlFor, error, hint, className, children, ...props }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs text-flame">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-lo">{hint}</p>
      ) : null}
    </div>
  )
}
