import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled) return null

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-mint-soft hover:bg-mint/20 text-mint border border-mint/30 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer animate-fade-in"
        title="Install Web App on your phone or desktop"
      >
        <Download className="w-4 h-4 text-mint animate-pulse" />
        <span>Install Web App</span>
      </button>
    )
  }

  return (
    <a
      href="/expense-tracker.apk"
      download="expense-tracker.apk"
      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-mint-soft hover:bg-mint/20 text-mint border border-mint/30 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer animate-fade-in"
      title="Download & install Android App (.apk)"
    >
      <Smartphone className="w-4 h-4 text-mint" />
      <span>Download Android APK</span>
    </a>
  )
}
