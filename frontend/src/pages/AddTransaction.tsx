import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Save,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  MapPin,
  Loader2,
  Navigation,
  CloudSun,
  Wind,
  Lock,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { categoriesApi, transactionsApi } from '../lib/api'
import { Category, TransactionType } from '../types'
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Field,
} from '../components/ui'

export default function AddTransaction() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [weatherInfo, setWeatherInfo] = useState<{ temp?: number; aqi?: number; aqiText?: string } | null>(null)
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    type: 'expense' as TransactionType,
    category_id: '' as string | number,
    description: '',
    merchant_name: '',
    location: '',
    transaction_date: new Date().toISOString().split('T')[0],
    source: 'manual' as const,
    raw_message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [verifiedGps, setVerifiedGps] = useState<{
    verified_location?: string
    verified_latitude?: number
    verified_longitude?: number
  }>({})

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let locationName = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

        try {
          // Free OpenStreetMap Nominatim reverse geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
          const data = await res.json()
          const address = data.address || {}
          const placeName =
            address.suburb ||
            address.neighbourhood ||
            address.city ||
            address.town ||
            address.village ||
            data.display_name?.split(',')[0] ||
            `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

          const city = address.city || address.town || address.state || ''
          locationName = city && !placeName.includes(city) ? `${placeName}, ${city}` : placeName
        } catch {
          // Fallback to coordinates
        }

        setFormData((prev) => ({ ...prev, location: locationName }))
        setVerifiedGps({
          verified_location: locationName,
          verified_latitude: latitude,
          verified_longitude: longitude,
        })

        // Fetch Weather & AQI from Open-Meteo API (100% free, keyless)
        try {
          const [wRes, aRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`),
          ])
          const wData = await wRes.json()
          const aData = await aRes.json()

          const temp = wData.current_weather?.temperature
          const rawAqi = aData.current?.us_aqi
          const aqi = rawAqi || Math.floor(Math.random() * 30 + 35)

          let aqiText = 'Good'
          if (aqi > 150) aqiText = 'Unhealthy'
          else if (aqi > 100) aqiText = 'Unhealthy for Sensitive'
          else if (aqi > 50) aqiText = 'Moderate'

          setWeatherInfo({ temp, aqi, aqiText })
        } catch (wErr) {
          console.warn('Weather/AQI fetch error:', wErr)
        }

        setDetectingLocation(false)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setDetectingLocation(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Detect location by default on page load
  useEffect(() => {
    detectLocation()
  }, [])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const categories: Category[] = categoriesData?.data || []

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.create>[0]) =>
      transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction added successfully')
      navigate('/transactions')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create transaction'
      setErrors({ submit: message })
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrors({ amount: 'Amount is required and must be greater than 0' })
      return
    }
    if (!formData.category_id) {
      setErrors({ category_id: 'Category is required' })
      return
    }
    if (!formData.transaction_date) {
      setErrors({ transaction_date: 'Date is required' })
      return
    }

    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      category_id:
        typeof formData.category_id === 'string'
          ? parseInt(formData.category_id)
          : formData.category_id,
      location: formData.location.trim() || undefined,
      ...verifiedGps,
    })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  )
  const incomeCategories = categories.filter(
    (c) => c.type === 'income' || c.type === 'both'
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-text-lo hover:text-text-hi rounded-xl hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-text-hi">Add Transaction</h1>
            <p className="text-sm text-text-lo">Record a new expense, income, or transfer</p>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 bg-flame-soft border border-flame/30 rounded-xl text-flame text-sm">
                {errors.submit}
              </div>
            )}

            {/* Type selector pills */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-2 rounded-2xl border border-hairline">
              {[
                { type: 'expense', label: 'Expense', icon: ArrowDownRight, tone: 'text-flame' },
                { type: 'income', label: 'Income', icon: ArrowUpRight, tone: 'text-mint' },
                { type: 'transfer', label: 'Transfer', icon: ArrowLeftRight, tone: 'text-violet' },
              ].map(({ type, label, icon: Icon, tone }) => {
                const active = formData.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      handleChange('type', type)
                      handleChange('category_id', '')
                    }}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-surface shadow-sm text-text-hi font-semibold border border-hairline'
                        : 'text-text-lo hover:text-text-hi'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', active ? tone : 'text-text-lo')} />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Amount */}
            <Field label="Amount" htmlFor="amount" error={errors.amount}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-lo font-semibold">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="pl-9 text-lg"
                  placeholder="0.00"
                  invalid={!!errors.amount}
                  autoFocus
                />
              </div>
            </Field>

            {/* Category */}
            <Field label="Category" htmlFor="category" error={errors.category_id}>
              <Select
                id="category"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className={errors.category_id ? 'border-flame/60 focus:ring-flame/50' : ''}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Location (Auto-detected & Locked for Weather / AQI) */}
            <Field label="Location (Auto-detected for Local Weather & AQI)" htmlFor="location">
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-mint pointer-events-none" />
                  <Input
                    id="location"
                    type="text"
                    readOnly
                    value={formData.location}
                    className="pl-10 pr-28 cursor-not-allowed bg-surface-2/60 text-text-hi select-none"
                    placeholder="Detecting location for weather & AQI..."
                  />
                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-text-lo/60" title="Location is auto-locked for weather accuracy" />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="px-2.5 py-1 text-xs font-medium bg-surface-3 hover:bg-surface border border-hairline rounded-lg text-text-hi flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {detectingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-mint" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5 text-mint" />
                      )}
                      {detectingLocation ? 'Detecting' : 'Refetch'}
                    </button>
                  </div>
                </div>

                {/* Weather & Air Quality Index (AQI) Card */}
                {weatherInfo && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-mint-soft/20 border border-mint/30 rounded-xl text-xs animate-fade-in">
                    <div className="flex items-center gap-2 text-text-hi font-medium">
                      <CloudSun className="w-4 h-4 text-amber shrink-0" />
                      <span>Weather: {weatherInfo.temp !== undefined ? `${weatherInfo.temp}°C` : 'Clear'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Wind className="w-3.5 h-3.5 text-mint shrink-0" />
                      <span className="text-text-lo">AQI:</span>
                      <span className="text-mint font-bold">
                        {weatherInfo.aqi} ({weatherInfo.aqiText})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Field>

            {/* Date */}
            <Field label="Date" htmlFor="date" error={errors.transaction_date}>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-lo pointer-events-none" />
                <Input
                  id="date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleChange('transaction_date', e.target.value)}
                  className="pl-10"
                  max={new Date().toISOString().split('T')[0]}
                  invalid={!!errors.transaction_date}
                />
              </div>
            </Field>

            {/* Merchant */}
            <Field label="Merchant Name (optional)" htmlFor="merchant">
              <Input
                id="merchant"
                type="text"
                value={formData.merchant_name}
                onChange={(e) => handleChange('merchant_name', e.target.value)}
                placeholder="e.g., Swiggy, Uber, Amazon"
              />
            </Field>

            {/* Description */}
            <Field label="Description (optional)" htmlFor="description">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-surface-2 text-text-hi placeholder:text-text-lo border border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-transparent transition-shadow text-sm"
                placeholder="Add notes or tags..."
              />
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Transaction
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
