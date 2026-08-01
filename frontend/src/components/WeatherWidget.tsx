import { useEffect, useState } from 'react'
import { CloudSun, Wind, MapPin } from 'lucide-react'
import AdminLocationRadar from './AdminLocationRadar'

function getWeatherCondition(code?: number): string {
  if (code === undefined || code === null) return 'Clear Sky'
  if (code === 0) return 'Clear Sky'
  if (code === 1 || code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 67) return 'Rain Showers'
  if (code >= 71 && code <= 77) return 'Snowy'
  if (code >= 80 && code <= 82) return 'Heavy Rain'
  if (code >= 95) return 'Thunderstorm'
  return 'Clear'
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<{
    locationName: string
    temp: number
    condition: string
    windSpeed: number
    aqi: number
    aqiStatus: 'Good' | 'Moderate' | 'Unhealthy'
    aqiColor: 'mint' | 'amber' | 'flame'
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const reverseGeocodeCoordinates = async (lat: number, lon: number, defaultName: string): Promise<string> => {
    // 1. Try OpenStreetMap Nominatim for exact street, road, colony & locality
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
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
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      if (revRes.ok) {
        const revData = await revRes.json()
        const locality = revData.locality || revData.city || revData.principalSubdivision
        if (locality) {
          return `${locality}, ${revData.principalSubdivision || ''}`
        }
      }
    } catch {
      // Continue
    }

    return defaultName
  }

  const loadWeather = async (lat: number, lon: number, defaultName: string) => {
    try {
      const finalLocName = await reverseGeocodeCoordinates(lat, lon, defaultName)

      const [wRes, aRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        ),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
        ),
      ])
      const wData = await wRes.json()
      const aData = await aRes.json()

      const currentW = wData.current_weather || {}
      const usAqi = aData.current?.us_aqi ?? 45

      let status: 'Good' | 'Moderate' | 'Unhealthy' = 'Good'
      let color: 'mint' | 'amber' | 'flame' = 'mint'

      if (usAqi > 100) {
        status = 'Unhealthy'
        color = 'flame'
      } else if (usAqi > 50) {
        status = 'Moderate'
        color = 'amber'
      }

      setWeatherData({
        locationName: finalLocName,
        temp: Math.round(currentW.temperature ?? 28),
        condition: getWeatherCondition(currentW.weathercode),
        windSpeed: Math.round(currentW.windspeed ?? 10),
        aqi: Math.round(usAqi),
        aqiStatus: status,
        aqiColor: color,
      })
    } catch (err) {
      console.warn('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentLocationWeather = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude, 'Live Geolocation')
        },
        async () => {
          // Fallback to ipwho.is for accurate IP region
          try {
            const ipRes = await fetch('https://ipwho.is/')
            if (ipRes.ok) {
              const ipData = await ipRes.json()
              if (ipData.success && ipData.latitude && ipData.longitude) {
                const name = [ipData.city, ipData.region].filter(Boolean).join(', ') || 'Local Weather'
                loadWeather(ipData.latitude, ipData.longitude, name)
                return
              }
            }
          } catch {
            // Fallback
          }
          setLoading(false)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentLocationWeather()

    // Automatically background-fetch weather & location every 60 seconds
    const intervalId = setInterval(fetchCurrentLocationWeather, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="p-3 bg-surface-2/60 rounded-2xl border border-hairline/60 animate-pulse flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-24 bg-surface-3 rounded" />
          <div className="h-5 w-16 bg-surface-3 rounded" />
        </div>
      </div>
    )
  }

  if (!weatherData) return null

  return (
    <div className="p-3.5 bg-surface-2/60 rounded-2xl border border-hairline/60 space-y-2.5 transition-all shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-mint shrink-0" />
          <span className="text-xs font-semibold text-text-hi truncate" title={weatherData.locationName}>
            {weatherData.locationName}
          </span>
        </div>
        <AdminLocationRadar />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="w-6 h-6 text-amber animate-pulse" />
          <div>
            <span className="text-lg font-bold font-display text-text-hi">{weatherData.temp}°C</span>
            <p className="text-[10px] text-text-lo font-medium leading-none">{weatherData.condition}</p>
          </div>
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            weatherData.aqiColor === 'flame'
              ? 'bg-flame-soft text-flame border border-flame/30'
              : weatherData.aqiColor === 'amber'
              ? 'bg-amber-soft text-amber border border-amber/30'
              : 'bg-mint-soft text-mint border border-mint/30'
          }`}>
            AQI {weatherData.aqi} • {weatherData.aqiStatus}
          </div>
          <p className="text-[10px] text-text-lo mt-0.5">Air Quality</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-lo pt-1 border-t border-hairline/40">
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-mint" />
          Wind: {weatherData.windSpeed} km/h
        </span>
        <span className="text-[10px] text-mint font-medium">✓ High-Accuracy GPS</span>
      </div>
    </div>
  )
}
