import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn('input appearance-none pr-10 cursor-pointer', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-text-lo absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
)
Select.displayName = 'Select'
