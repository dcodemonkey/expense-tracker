import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionsApi, usersApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Navigation, ExternalLink } from 'lucide-react'

function extractMultipleLandmarks(address: any): string {
  const landmarks: string[] = []

  // 1. Transit & Mobility (Railway/Metro/Bus)
  const transit = address.railway || address.station || address.subway || address.bus_station || address.aeroway
  if (transit && typeof transit === 'string' && transit !== 'yes') {
    landmarks.push(transit.includes('Station') ? transit : `${transit} Station`)
  }

  // 2. Educational, Public Safety & Healthcare
  const eduGov = address.school || address.college || address.university || address.police || address.hospital || address.amenity
  if (eduGov && typeof eduGov === 'string' && eduGov !== 'yes' && !landmarks.includes(eduGov)) {
    landmarks.push(eduGov)
  }

  // 3. Famous Commercial, Malls, Historical & Parks
  const famous = address.building || address.tourism || address.shop || address.leisure || address.historic || address.mall
  if (famous && typeof famous === 'string' && famous !== 'yes' && !landmarks.includes(famous)) {
    landmarks.push(famous)
  }

  // 4. Main Highway / Expressway / Bypass
  const road = address.highway || address.road
  if (road && typeof road === 'string' && (road.includes('NH') || road.includes('Expressway') || road.includes('Bypass') || road.includes('Road'))) {
    if (!landmarks.some((l) => l.includes(road))) {
      landmarks.push(road)
    }
  }

  const uniqueLandmarks = Array.from(new Set(landmarks)).slice(0, 3)
  return uniqueLandmarks.join(' • ')
}

export default function LiveLocationTracker() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [trackingActive, setTrackingActive] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)

  // Check if user has at least 1 transaction in DB
  const { data: txCount = 0 } = useQuery({
    queryKey: ['transactions-count-check'],
    queryFn: async () => {
      try {
        const res = await transactionsApi.list({ limit: 1 })
        const items = Array.isArray(res.data) ? res.data : res.data?.items || []
        return items.length
      } catch {
        return 0
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  })

  const hasTransactions = txCount > 0

  useEffect(() => {
    if (!hasTransactions) return
    if (!('geolocation' in navigator)) return

    const performLocationPing = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const roundedAccuracy = Math.round(accuracy)
          setCoords({ latitude, longitude, accuracy: roundedAccuracy })

          let locationName = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

          try {
            // Reverse geocode with zoom 18 for max precision
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )
            const data = await res.json()
            const address = data.address || {}
            
            const landmarkStr = extractMultipleLandmarks(address)

            const street = address.road || address.pedestrian || address.highway || ''
            const area = address.suburb || address.neighbourhood || address.residential || address.city_district || ''
            const city = address.city || address.town || address.village || ''

            const parts = [street, area, city].filter(Boolean)
            let baseLoc = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ')

            if (landmarkStr && baseLoc) {
              baseLoc = `${baseLoc} (Near: ${landmarkStr})`
            }

            if (baseLoc) {
              locationName = baseLoc
            }
          } catch {
            // Fallback to coordinates
          }

          setCurrentLocation(locationName)
          setTrackingActive(true)

          try {
            await usersApi.updateLiveLocation({
              latitude,
              longitude,
              location_name: locationName,
            })
          } catch (err) {
            console.warn('Silent 90s Live location sync error:', err)
          }
        },
        (err) => {
          console.warn('Silent 90s High precision location ping error:', err)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      )
    }

    performLocationPing()

    // Silent background location auto-update every 90 seconds
    const intervalId = setInterval(performLocationPing, 90 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [hasTransactions])

  // --- For Regular End Users (Non-Admin): Completely SILENT & INVISIBLE ---
  if (!isAdmin) return null

  // --- For ADMIN Users ONLY: Full Live GPS Tracking Badge + Google Maps Redirection ---
  if (!trackingActive || !currentLocation || !coords) return null

  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 px-3 py-1.5 bg-mint-soft hover:bg-mint/20 text-mint rounded-xl text-xs font-medium border border-mint/30 transition-all shadow-sm hover:shadow-md animate-fade-in cursor-pointer"
      title={`[ADMIN ONLY] Precise Live Location: ${currentLocation} (Accuracy: ±${coords.accuracy}m, Auto-synced every 90s). Click to open in Google Maps.`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint"></span>
      </span>
      <Navigation className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline font-semibold">Live GPS:</span>
      <span className="truncate max-w-[130px] sm:max-w-[160px] text-text-hi font-normal">
        {currentLocation}
      </span>
      <span className="text-[10px] opacity-75 text-mint font-mono hidden md:inline">
        (±{coords.accuracy}m)
      </span>
      <ExternalLink className="w-3 h-3 text-mint opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  )
}
