import { ReactNode } from 'react'
import { Wallet } from 'lucide-react'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen grid place-items-center bg-ink px-4 py-12 overflow-hidden">
      {/* Ambient hero glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[720px] rounded-full blur-3xl opacity-70"
        style={{
          background:
            'radial-gradient(closest-side, rgba(61,225,176,0.25), rgba(139,124,255,0.14) 55%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-mint-violet text-ink shadow-[0_10px_40px_-8px_rgba(61,225,176,0.6)] mb-5">
            <Wallet className="w-7 h-7" strokeWidth={2.4} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-hi">{title}</h1>
          {subtitle && <p className="mt-2 text-text-lo">{subtitle}</p>}
        </div>

        <div className="card p-6 sm:p-8 animate-fade-in">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-text-lo">{footer}</div>}
      </div>
    </div>
  )
}
