import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { authApi } from '../lib/api'
import AuthShell from '../components/AuthShell'
import { Button, Field, Input } from '../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle={sent ? undefined : 'We’ll email you a reset link'}
      footer={
        <Link to="/login" className="text-mint hover:text-mint-600 font-medium">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-mint-soft text-mint">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-text-hi font-medium">Check your inbox</p>
          <p className="text-sm text-text-lo">
            If an account exists for <span className="text-text-hi">{email}</span>, a password reset
            link is on its way.
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit}>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-flame-soft border border-flame/30 rounded-xl text-flame text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="h-5 w-5" />}
            />
          </Field>
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
