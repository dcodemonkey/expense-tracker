import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '../lib/api'
import AuthShell from '../components/AuthShell'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }
    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.data?.message || 'Your email has been verified.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'This verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <AuthShell
      title="Email verification"
      footer={
        <Link to="/login" className="text-mint hover:text-mint-600 font-medium">
          Continue to sign in
        </Link>
      }
    >
      <div className="text-center space-y-3">
        {status === 'verifying' && (
          <>
            <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-white/[0.04]">
              <Loader2 className="w-6 h-6 text-mint animate-spin" />
            </div>
            <p className="text-text-hi font-medium">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-mint-soft text-mint">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-text-hi font-medium">You’re verified</p>
            <p className="text-sm text-text-lo">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-flame-soft text-flame">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-text-hi font-medium">Verification failed</p>
            <p className="text-sm text-text-lo">{message}</p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
