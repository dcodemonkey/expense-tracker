import { useEffect, useState } from 'react'
import { usersApi, ACCESS_TOKEN_KEY } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Navigation, ExternalLink } from 'lucide-react'

export default function LiveLocationTracker() {
  const { user } = useAuth()
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    // Only track location if user is actively logged in
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!user || !token) return

    const sendLocationUpdate = async (latitude: number, longitude: number, locationName: string) => {
      const activeToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!activeToken) return
      try {
        await usersApi.updateLiveLocation({ latitude, longitude, location_name: locationName })
      } catch {
        // Silently ignore 401 or network errors for background location updates
      }
    }

    const trackLocationHighAccuracy = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords
            setCoords({ latitude, longitude })

            try {
              const revRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              )
              if (revRes.ok) {
                const revData = await revRes.json()
                const locality = revData.locality || revData.city || revData.principalSubdivision
                const locName = locality ? `${locality}, ${revData.principalSubdivision || ''}` : `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                setCurrentLocation(locName)
                sendLocationUpdate(latitude, longitude, locName)
                return
              }
            } catch {
              // Fallback
            }

            const fallbackName = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            setCurrentLocation(fallbackName)
            sendLocationUpdate(latitude, longitude, fallbackName)
          },
          () => {
            fallbackIpTracking()
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
      } else {
        fallbackIpTracking()
      }
    }

    const fallbackIpTracking = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) return
        const data = await res.json()
        const latitude = data.latitude
        const longitude = data.longitude
        if (!latitude || !longitude) return

        const parts = [data.city, data.region].filter(Boolean)
        const locName = parts.length > 0 ? parts.join(', ') : `${latitude}, ${longitude}`

        setCoords({ latitude, longitude })
        setCurrentLocation(locName)
        sendLocationUpdate(latitude, longitude, locName)
      } catch (err) {
        console.warn('Location tracking error:', err)
      }
    }

    trackLocationHighAccuracy()

    const intervalId = setInterval(trackLocationHighAccuracy, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [user])

  if (!user || !currentLocation || !coords) return null

  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-mint-soft hover:bg-mint/20 text-mint rounded-xl text-xs font-medium border border-mint/30 transition-all shadow-sm hover:shadow-md animate-fade-in cursor-pointer shrink-0 max-w-[130px] xs:max-w-[150px] sm:max-w-[190px]"
      title={`Exact GPS Location: ${currentLocation}. Click to open in Google Maps.`}
    >
      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-mint"></span>
      </span>
      <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
      <span className="truncate text-text-hi font-normal text-[11px] sm:text-xs">
        {currentLocation}
      </span>
      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-mint opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 hidden xs:inline" />
    </a>
  )
}
