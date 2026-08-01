import { useEffect, useState } from 'react'
import { usersApi, ACCESS_TOKEN_KEY } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Navigation, ExternalLink } from 'lucide-react'

export default function LiveLocationTracker() {
  const { user } = useAuth()
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
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

    const reverseGeocodeCoordinates = async (latitude: number, longitude: number): Promise<string> => {
      // 1. Try OpenStreetMap Nominatim for exact street, road, colony & locality
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        if (nomRes.ok) {
          const nomData = await nomRes.json()
          const addr = nomData.address || {}
          const street = addr.road || addr.street || addr.pedestrian
          const colony = addr.suburb || addr.neighbourhood || addr.residential || addr.colony || addr.quarter
          const city = addr.city || addr.town || addr.city_district || addr.state_district || addr.state

          const parts = [street, colony, city].filter(Boolean)
          if (parts.length > 0) {
            return parts.join(', ')
          }
        }
      } catch {
        // Continue to fallback
      }

      // 2. Try BigDataCloud
      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        if (revRes.ok) {
          const revData = await revRes.json()
          const locality = revData.locality || revData.city || revData.principalSubdivision
          if (locality) {
            return `${locality}, ${revData.principalSubdivision || ''}`
          }
        }
      } catch {
        // Continue to fallback
      }

      return `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }

    const fallbackIpTracking = async () => {
      try {
        // Try ipwho.is for fast, accurate IP-based latitude & longitude
        const res = await fetch('https://ipwho.is/')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.latitude && data.longitude) {
            const latitude = data.latitude
            const longitude = data.longitude
            setCoords({ latitude, longitude })

            const exactName = await reverseGeocodeCoordinates(latitude, longitude)
            const finalName = exactName.startsWith('GPS:') && data.city ? `${data.city}, ${data.region}` : exactName
            setCurrentLocation(finalName)
            sendLocationUpdate(latitude, longitude, finalName)
            return
          }
        }
      } catch {
        // Fallback to ipapi.co
      }

      try {
        const res = await fetch('https://ipapi.co/json/')
        if (res.ok) {
          const data = await res.json()
          if (data.latitude && data.longitude) {
            const latitude = data.latitude
            const longitude = data.longitude
            setCoords({ latitude, longitude })

            const parts = [data.city, data.region].filter(Boolean)
            const locName = parts.length > 0 ? parts.join(', ') : `${latitude}, ${longitude}`
            setCurrentLocation(locName)
            sendLocationUpdate(latitude, longitude, locName)
          }
        }
      } catch (err) {
        console.warn('Location tracking error:', err)
      }
    }

    const trackLocationHighAccuracy = () => {
      if ('geolocation' in navigator) {
        // maximumAge: 0 forces the browser/device to acquire a fresh 0-second real-time GPS fix from hardware sensors
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords
            setCoords({ latitude, longitude })

            const exactLocationName = await reverseGeocodeCoordinates(latitude, longitude)
            setCurrentLocation(exactLocationName)
            sendLocationUpdate(latitude, longitude, exactLocationName)
          },
          (err) => {
            console.warn('Hardware Geolocation warning, switching to IP lookup:', err.message)
            fallbackIpTracking()
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        )
      } else {
        fallbackIpTracking()
      }
    }

    // Automatically fetch location on mount/login
    trackLocationHighAccuracy()

    // Automatically background-fetch location update every 60 seconds
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
      className="group flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-mint-soft hover:bg-mint/20 text-mint rounded-xl text-xs font-medium border border-mint/30 transition-all shadow-sm hover:shadow-md animate-fade-in cursor-pointer shrink-0 max-w-[150px] xs:max-w-[180px] sm:max-w-[240px]"
      title={`Exact Street & Locality GPS: ${currentLocation}. Click to open in Google Maps.`}
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
