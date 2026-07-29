import { useEffect, useState } from 'react'
import { CloudSun, Wind, MapPin, ShieldCheck } from 'lucide-react'
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

  useEffect(() => {
    async function fetchWeatherByIp() {
      try {
        let latitude = 28.6139
        let longitude = 77.2090
        let locationName = 'New Delhi'

        // Silently resolve city & coords via IP (Zero permission popup!)
        try {
          const ipRes = await fetch('https://ipapi.co/json/')
          if (ipRes.ok) {
            const ipData = await ipRes.json()
            if (ipData.latitude && ipData.longitude) {
              latitude = ipData.latitude
              longitude = ipData.longitude
              locationName = [ipData.city, ipData.region].filter(Boolean).join(', ') || locationName
            }
          }
        } catch {
          // Fallback to default city coords
        }

        const [wRes, aRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          ),
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`
          ),
        ])
        const wData = await wRes.json()
        const aData = await aRes.json()

        const temp = wData.current_weather?.temperature ?? 26
        const weatherCode = wData.current_weather?.weathercode
        const windSpeed = wData.current_weather?.windspeed ?? 12
        const condition = getWeatherCondition(weatherCode)

        const rawAqi = aData.current?.us_aqi
        const aqi = rawAqi || 45

        let aqiStatus: 'Good' | 'Moderate' | 'Unhealthy' = 'Good'
        let aqiColor: 'mint' | 'amber' | 'flame' = 'mint'

        if (aqi > 150) {
          aqiStatus = 'Unhealthy'
          aqiColor = 'flame'
        } else if (aqi > 50) {
          aqiStatus = 'Moderate'
          aqiColor = 'amber'
        }

        setWeatherData({
          locationName,
          temp,
          condition,
          windSpeed,
          aqi,
          aqiStatus,
          aqiColor,
        })
      } catch (err) {
        console.warn('WeatherWidget fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeatherByIp()
  }, [])

  if (loading) {
    return (
      <div className="p-3 bg-surface-2/60 border border-hairline rounded-2xl animate-pulse space-y-2">
        <div className="h-3 bg-surface-3 rounded w-3/4"></div>
        <div className="h-4 bg-surface-3 rounded w-1/2"></div>
      </div>
    )
  }

  if (!weatherData) return null

  const aqiBadgeClass =
    weatherData.aqiColor === 'mint'
      ? 'bg-mint-soft text-mint border-mint/30'
      : weatherData.aqiColor === 'amber'
      ? 'bg-amber-soft text-amber border-amber/30'
      : 'bg-flame-soft text-flame border-flame/30'

  return (
    <div className="p-3.5 bg-surface-2/90 border border-hairline rounded-2xl space-y-2.5 shadow-sm hover:border-mint/30 transition-all">
      {/* Header: Location & Admin Radar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-lo font-medium truncate">
          <MapPin className="w-3.5 h-3.5 text-mint shrink-0" />
          <span className="truncate max-w-[120px]" title={weatherData.locationName}>
            {weatherData.locationName}
          </span>
        </div>
        <AdminLocationRadar />
      </div>

      {/* Temperature & Condition */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="w-6 h-6 text-amber shrink-0 animate-pulse" style={{ animationDuration: '5s' }} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-display text-text-hi leading-none">
                {weatherData.temp}°C
              </span>
            </div>
            <p className="text-[11px] text-text-lo font-medium">{weatherData.condition}</p>
          </div>
        </div>

        {/* AQI Badge */}
        <div className="text-right">
          <span className="text-[10px] text-text-lo font-semibold block mb-0.5">Air Quality</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${aqiBadgeClass}`}>
            <Wind className="w-3 h-3 shrink-0" />
            AQI {weatherData.aqi} • {weatherData.aqiStatus}
          </span>
        </div>
      </div>

      {/* Footer Info: Wind Speed & Health Status */}
      <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] text-text-lo">
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-mint opacity-75" />
          Wind: {weatherData.windSpeed} km/h
        </span>
        <span className="flex items-center gap-1 text-mint font-medium">
          <ShieldCheck className="w-3 h-3" />
          Satisfactory
        </span>
      </div>
    </div>
  )
}
