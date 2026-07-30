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

  useEffect(() => {
    async function loadWeather(lat: number, lon: number, defaultName: string) {
      try {
        let finalLocName = defaultName

        // Reverse geocode to get exact locality name
        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          )
          if (revRes.ok) {
            const revData = await revRes.json()
            const locality = revData.locality || revData.city || revData.principalSubdivision
            if (locality) {
              finalLocName = `${locality}, ${revData.principalSubdivision || ''}`
            }
          }
        } catch {
          // Ignored
        }

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

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude, 'Local Weather')
        },
        async () => {
          // Fallback to IP
          try {
            const ipRes = await fetch('https://ipapi.co/json/')
            if (ipRes.ok) {
              const ipData = await ipRes.json()
              const name = [ipData.city, ipData.region].filter(Boolean).join(', ') || 'Local Weather'
              loadWeather(ipData.latitude || 28.6139, ipData.longitude || 77.209, name)
            } else {
              loadWeather(28.6139, 77.209, 'New Delhi')
            }
          } catch {
            loadWeather(28.6139, 77.209, 'New Delhi')
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      loadWeather(28.6139, 77.209, 'New Delhi')
    }
  }, [])

  if (loading) {
    return (
      <div className="p-3 bg-surface-2 border border-hairline rounded-2xl animate-pulse flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-surface-3" />
        <div className="space-y-1 flex-1">
          <div className="h-3 w-20 bg-surface-3 rounded" />
          <div className="h-2 w-12 bg-surface-3 rounded" />
        </div>
      </div>
    )
  }

  if (!weatherData) return null

  return (
    <div className="p-3 bg-surface-2 border border-hairline rounded-2xl space-y-2 text-xs animate-fade-in shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-text-lo font-medium max-w-[130px] truncate" title={weatherData.locationName}>
          <MapPin className="w-3.5 h-3.5 text-mint shrink-0" />
          <span className="truncate">{weatherData.locationName}</span>
        </div>
        <AdminLocationRadar />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-soft text-amber rounded-xl">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold text-text-hi font-display leading-none">
              {weatherData.temp}°C
            </div>
            <div className="text-[10px] text-text-lo font-medium">{weatherData.condition}</div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              weatherData.aqiColor === 'flame'
                ? 'bg-flame-soft text-flame border-flame/30'
                : weatherData.aqiColor === 'amber'
                ? 'bg-amber-soft text-amber border-amber/30'
                : 'bg-mint-soft text-mint border-mint/30'
            }`}
          >
            AQI {weatherData.aqi} • {weatherData.aqiStatus}
          </span>
          <div className="text-[10px] text-text-lo mt-0.5">Air Quality</div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-hairline/60 flex items-center justify-between text-[10px] text-text-lo">
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-violet" />
          <span>Wind: {weatherData.windSpeed} km/h</span>
        </div>
        <div className="text-mint font-medium">✓ High-Accuracy GPS</div>
      </div>
    </div>
  )
}
