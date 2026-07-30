import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert, LogOut } from 'lucide-react'
import { clearTokens } from '../lib/api'

interface RemoteLogoutModalProps {
  isOpen: boolean
}

export default function RemoteLogoutModal({ isOpen }: RemoteLogoutModalProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!isOpen) return

    setCountdown(10)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          clearTokens()
          window.location.href = '/login?reason=multi_device'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const strokeDashoffset = 283 - (283 * countdown) / 10

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-surface-2 border border-flame/40 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-5 animate-bounce-subtle">
        {/* Animated Countdown Circle */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-surface-3 stroke-current"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-flame stroke-current transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-display text-flame">{countdown}</span>
            <span className="text-[10px] text-text-lo uppercase font-semibold tracking-wider">Sec</span>
          </div>
        </div>

        {/* Warning Title & Body */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-flame-soft text-flame rounded-full text-xs font-bold border border-flame/30">
            <ShieldAlert className="w-4 h-4" />
            <span>New Session Detected Elsewhere</span>
          </div>
          <h3 className="text-xl font-bold text-text-hi font-display">Session Terminated</h3>
          <p className="text-xs text-text-lo leading-relaxed max-w-sm mx-auto">
            You have logged in from another device or location. To protect your financial security, this session will log out automatically when the timer reaches 0.
          </p>
        </div>

        {/* Instant Action Button */}
        <button
          onClick={() => {
            clearTokens()
            window.location.href = '/login?reason=multi_device'
          }}
          className="w-full py-3 bg-flame hover:bg-flame/90 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out Immediately</span>
        </button>
      </div>
    </div>
  )
}
