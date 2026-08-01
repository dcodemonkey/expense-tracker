import { useEffect, useState } from 'react'
import { CloudSun, Wind, MapPin, Search, Edit3, X, Check, Navigation, AlertCircle } from 'lucide-react'
import AdminLocationRadar from './AdminLocationRadar'
import { usersApi } from '../lib/api'

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

interface LocationSearchResult {
  display_name: string
  lat: string
  lon: string
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCustomLocation, setIsCustomLocation] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const reverseGeocodeCoordinates = async (lat: number, lon: number, defaultName: string): Promise<string> => {
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
      // Fallback
    }

    return defaultName
  }

  const loadWeather = async (lat: number, lon: number, customLocName?: string) => {
    try {
      const finalLocName = customLocName || (await reverseGeocodeCoordinates(lat, lon, 'Local Weather'))

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

      // Sync location to backend
      usersApi.updateLiveLocation({ latitude: lat, longitude: lon, location_name: finalLocName }).catch(() => {})
    } catch (err) {
      console.warn('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Workaround Multi-IP provider consensus engine to bypass mobile data CGNAT IP routing
  const multiProviderIpFallback = async () => {
    // 1. Try DB-IP API
    try {
      const res = await fetch('https://api.db-ip.com/v2/free/self')
      if (res.ok) {
        const data = await res.json()
        if (data.city && data.stateProv) {
          const locName = `${data.city}, ${data.stateProv}`
          // Search coordinates for this city
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locName)}&limit=1`)
          if (geoRes.ok) {
            const geoData = await geoRes.json()
            if (geoData.length > 0) {
              loadWeather(parseFloat(geoData[0].lat), parseFloat(geoData[0].lon), locName)
              return
            }
          }
        }
      }
    } catch {
      // Continue
    }

    // 2. Try ipwho.is
    try {
      const res = await fetch('https://ipwho.is/')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.latitude && data.longitude) {
          const locName = [data.city, data.region].filter(Boolean).join(', ') || 'Local Weather'
          loadWeather(data.latitude, data.longitude, locName)
          return
        }
      }
    } catch {
      // Continue
    }

    setLoading(false)
  }

  const requestHardwareGPS = () => {
    setPermissionDenied(false)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => {
          console.warn('GPS position error:', err.message)
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionDenied(true)
          }
          multiProviderIpFallback()
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      )
    } else {
      multiProviderIpFallback()
    }
  }

  const handleSearchLocation = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch {
      // Ignored
    } finally {
      setIsSearching(false)
    }
  }

  const selectCustomLocation = (result: LocationSearchResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    const shortName = result.display_name.split(',').slice(0, 3).join(',')
    
    localStorage.setItem('user_custom_location', JSON.stringify({ lat, lon, name: shortName }))
    setIsCustomLocation(true)
    setIsSearchOpen(false)
    setSearchResults([])
    setSearchQuery('')
    loadWeather(lat, lon, shortName)
  }

  const resetToAutoGPS = () => {
    localStorage.removeItem('user_custom_location')
    setIsCustomLocation(false)
    setIsSearchOpen(false)
    requestHardwareGPS()
  }

  const fetchCurrentLocationWeather = () => {
    const savedCustom = localStorage.getItem('user_custom_location')
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom)
        if (parsed.lat && parsed.lon) {
          setIsCustomLocation(true)
          loadWeather(parsed.lat, parsed.lon, parsed.name)
          return
        }
      } catch {
        // Fallback to GPS
      }
    }

    requestHardwareGPS()
  }

  useEffect(() => {
    fetchCurrentLocationWeather()
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
      {/* Location Permission Prompt Banner */}
      {permissionDenied && !isCustomLocation && (
        <div className="flex items-center justify-between p-2 bg-amber-soft/80 border border-amber/30 rounded-xl text-amber text-[11px] animate-fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Allow GPS permission for exact street-level tracking</span>
          </div>
          <button
            onClick={requestHardwareGPS}
            className="px-2 py-0.5 bg-amber text-black font-bold rounded-lg shrink-0 text-[10px]"
          >
            Enable GPS
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-mint shrink-0" />
          <span className="text-xs font-semibold text-text-hi truncate max-w-[170px] sm:max-w-[240px]" title={weatherData.locationName}>
            {weatherData.locationName}
          </span>
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="p-1 text-text-lo hover:text-mint rounded-lg hover:bg-surface-3 transition-colors shrink-0"
            title="Search & Set Custom Location"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          {isCustomLocation && (
            <button
              onClick={resetToAutoGPS}
              className="px-1.5 py-0.5 bg-mint-soft text-mint hover:bg-mint/20 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
              title="Reset to Hardware GPS"
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>Auto GPS</span>
            </button>
          )}
        </div>
        <AdminLocationRadar />
      </div>

      {/* Search Location Drawer */}
      {isSearchOpen && (
        <div className="p-2.5 bg-surface-3/80 border border-mint/30 rounded-xl space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-mint shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchLocation(e.target.value)}
              placeholder="Search city/locality (e.g. Patna, Bihar)"
              className="w-full bg-transparent text-xs text-text-hi placeholder:text-text-lo outline-none"
              autoFocus
            />
            <button onClick={() => setIsSearchOpen(false)} className="text-text-lo hover:text-text-hi">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isSearching && <p className="text-[10px] text-text-lo animate-pulse">Searching locations...</p>}

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-36 overflow-y-auto divide-y divide-hairline/40 pt-1">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => selectCustomLocation(res)}
                  className="w-full text-left py-1.5 px-1 hover:bg-mint-soft/30 rounded text-[11px] text-text-hi truncate flex items-center justify-between"
                >
                  <span className="truncate">{res.display_name}</span>
                  <Check className="w-3 h-3 text-mint shrink-0 ml-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
        <span className="text-[10px] text-mint font-medium">
          {isCustomLocation ? '✓ Custom Location' : '✓ High-Accuracy GPS'}
        </span>
      </div>
    </div>
  )
}
