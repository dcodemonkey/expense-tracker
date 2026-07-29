import { useEffect, useState } from 'react'
import { usersApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Navigation, ExternalLink } from 'lucide-react'

export default function LiveLocationTracker() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    const trackLocationSmart = async () => {
      // 1. Check if browser has ALREADY granted GPS permission silently
      let permissionState: PermissionState | null = null
      try {
        if ('permissions' in navigator && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' })
          permissionState = status.state
        }
      } catch {
        // Ignored if permissions API is unsupported
      }

      // 2. If GPS permission was already granted by user in past, use exact Hardware GPS!
      if (permissionState === 'granted' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords
            setCoords({ latitude, longitude })
            const locName = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            setCurrentLocation(locName)
            await usersApi.updateLiveLocation({ latitude, longitude, location_name: locName })
          },
          () => {
            // Fallback to IP silently if GPS fails
            fallbackIpTracking()
          },
          { timeout: 5000, maximumAge: 60000 }
        )
        return
      }

      // 3. Otherwise, use Silent IP Geolocation — ZERO POPUP GUARANTEED!
      fallbackIpTracking()
    }

    const fallbackIpTracking = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) return
        const data = await res.json()
        const latitude = data.latitude
        const longitude = data.longitude
        if (!latitude || !longitude) return

        const parts = [data.city, data.region, data.country_name].filter(Boolean)
        const locName = parts.length > 0 ? parts.join(', ') : `${latitude}, ${longitude}`

        setCoords({ latitude, longitude })
        setCurrentLocation(locName)
        await usersApi.updateLiveLocation({ latitude, longitude, location_name: locName })
      } catch (err) {
        console.warn('Silent location tracking error:', err)
      }
    }

    trackLocationSmart()

    // Auto-update every 90 seconds
    const intervalId = setInterval(trackLocationSmart, 90 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  if (!isAdmin || !currentLocation || !coords) return null

  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 px-3 py-1.5 bg-mint-soft hover:bg-mint/20 text-mint rounded-xl text-xs font-medium border border-mint/30 transition-all shadow-sm hover:shadow-md animate-fade-in cursor-pointer"
      title={`[ADMIN ONLY] Location: ${currentLocation}. Click to open in Google Maps.`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint"></span>
      </span>
      <Navigation className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline font-semibold">Live Location:</span>
      <span className="truncate max-w-[130px] sm:max-w-[160px] text-text-hi font-normal">
        {currentLocation}
      </span>
      <ExternalLink className="w-3 h-3 text-mint opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  )
}
