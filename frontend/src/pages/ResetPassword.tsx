import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import AuthShell from '../components/AuthShell'
import { Button, Field, Input } from '../components/ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError("Passwords don't match")
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      toast.success('Password updated — sign in with your new password')
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'This reset link is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Reset password"
        footer={
          <Link to="/forgot-password" className="text-mint hover:text-mint-600 font-medium">
            Request a new link
          </Link>
        }
      >
        <div className="text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-flame-soft text-flame">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-text-hi font-medium">Missing reset token</p>
          <p className="text-sm text-text-lo">Open the link from your email to reset your password.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something strong you’ll remember"
      footer={
        <Link to="/login" className="text-mint hover:text-mint-600 font-medium">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-flame-soft border border-flame/30 rounded-xl text-flame text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="New password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
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

        <Field label="Confirm new password" htmlFor="confirm">
          <div className="relative">
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              className="pr-10"
            />
            {confirm && confirm === password && password.length >= 8 && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mint" />
            )}
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
