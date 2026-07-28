import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Wifi } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { Button, Field, Input } from '../components/ui'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

// Derive base URL from VITE_API_URL env variable
const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://expense-tracker-59tl.onrender.com/api/v1')
  .replace('/api/v1', '')

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'ready' | 'slow'>('checking')

  // Wake up the Render backend as soon as the login page loads.
  // Image() requests bypass CORS entirely — they always reach the server.
  useEffect(() => {
    let cancelled = false

    // Immediately show the starting-up banner so users know to wait
    setServerStatus('slow')

    // Fire a wake-up ping via Image() — always reaches server, never blocked by CORS
    const img = new Image()
    img.src = `${API_BASE}/health?_wake=${Date.now()}`

    // Poll every 5 s with a regular CORS fetch — succeeds once the server is awake
    const poll = setInterval(async () => {
      if (cancelled) { clearInterval(poll); return }
      try {
        const res = await fetch(`${API_BASE}/health`)
        if (res.ok) {
          if (!cancelled) setServerStatus('ready')
          clearInterval(poll)
        }
      } catch { /* server still starting */ }
    }, 5000)

    // Give up after 2 minutes — enable the button regardless
    const timeout = setTimeout(() => {
      if (!cancelled) setServerStatus('ready')
      clearInterval(poll)
    }, 120000)

    return () => {
      cancelled = true
      clearInterval(poll)
      clearTimeout(timeout)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response.data?.detail || 'Invalid email or password')
      } else if (!err.response) {
        // Network/CORS failure — likely cold start; retry once after 8 s
        setError('Server is starting up… retrying in 8 seconds')
        await new Promise(r => setTimeout(r, 8000))
        try {
          await login(data.email, data.password)
          navigate('/dashboard')
          return
        } catch (retryErr: any) {
          setError(retryErr.response?.data?.detail || 'Connection failed. Please try again.')
        }
      } else {
        setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ledger"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-mint hover:text-mint-600 font-medium">
            Create an account
          </Link>
        </>
      }
    >
      {serverStatus === 'slow' && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm mb-2">
          <Wifi className="h-4 w-4 shrink-0 animate-pulse" />
          <span>Server is starting up — this may take 30–60 seconds on first visit.</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-flame-soft border border-flame/30 rounded-xl text-flame text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<Mail className="h-5 w-5" />}
            invalid={!!errors.email}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              invalid={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-text-lo hover:text-mint">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading || serverStatus === 'checking'}
        >
          {loading
            ? 'Signing in…'
            : serverStatus === 'checking'
            ? 'Connecting…'
            : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
