import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { Button, Field, Input } from '../components/ui'
import { cn } from '../lib/utils'

const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    phone_number: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLORS = ['#FF6455', '#FF6455', '#F5B85C', '#3DE1B0', '#3DE1B0']

function passwordStrength(pwd: string) {
  if (!pwd) return 0
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[a-z]/.test(pwd)) s++
  if (/[0-9]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const password = watch('password') || ''
  const confirmPassword = watch('confirmPassword') || ''
  const strength = passwordStrength(password)

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    setLoading(true)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name || undefined,
        phone_number: data.phone_number || undefined,
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking every rupee"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-mint hover:text-mint-600 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-flame-soft border border-flame/30 rounded-xl text-flame text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <Input
            {...register('full_name')}
            id="full_name"
            autoComplete="name"
            placeholder="Aditya Sharma"
            icon={<User className="h-5 w-5" />}
          />
        </Field>

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

        <Field label="Phone number" htmlFor="phone_number" hint="Optional">
          <Input
            {...register('phone_number')}
            id="phone_number"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            icon={<Phone className="h-5 w-5" />}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className="flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor:
                        strength >= level ? STRENGTH_COLORS[strength - 1] : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-text-lo">{STRENGTH_LABELS[strength - 1] || ''}</p>
            </div>
          )}
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <div className="relative">
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              invalid={!!errors.confirmPassword}
              className={cn(
                confirmPassword && confirmPassword === password && password.length >= 8 && 'pr-10'
              )}
            />
            {confirmPassword && confirmPassword === password && password.length >= 8 && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mint" />
            )}
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading} className="!mt-6">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
