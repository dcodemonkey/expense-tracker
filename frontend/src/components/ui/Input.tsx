import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, invalid, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-lo pointer-events-none">
            {icon}
          </span>
          <input
            ref={ref}
            className={cn('input pl-10', invalid && 'border-flame/60 focus:ring-flame/50', className)}
            {...props}
          />
        </div>
      )
    }
    return (
      <input
        ref={ref}
        className={cn('input', invalid && 'border-flame/60 focus:ring-flame/50', className)}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
