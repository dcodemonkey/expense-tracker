import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, storeTokens, clearTokens, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_ID_KEY } from '../lib/api'
import type { User } from '../types'
import RemoteLogoutModal from '../components/RemoteLogoutModal'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name?: string; phone_number?: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRemoteLoggedOut, setIsRemoteLoggedOut] = useState(false)

  const verifySessionIntegrity = (fetchedUser: User & { active_session_id?: string }) => {
    const localSessionId = localStorage.getItem(SESSION_ID_KEY)
    if (localSessionId && fetchedUser.active_session_id && localSessionId !== fetchedUser.active_session_id) {
      setIsRemoteLoggedOut(true)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authApi.me()
      const fetchedUser = response.data
      setUser(fetchedUser)
      verifySessionIntegrity(fetchedUser)
    } catch {
      setUser(null)
      clearTokens()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }

    // Inactivity Session Timeout Manager (15 Minutes)
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000 // 15 minutes
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null

    const handleInactivityLogout = () => {
      if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
        clearTokens()
        setUser(null)
        window.location.href = '/login?reason=inactivity'
      }
    }

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
        inactivityTimer = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT_MS)
      }
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer)
    })

    resetInactivityTimer()

    // Frequent multi-device session check (every 10 seconds)
    const sessionCheckId = setInterval(() => {
      const activeToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (activeToken) {
        authApi.me().then((res) => {
          verifySessionIntegrity(res.data)
        }).catch(() => {})
      }
    }, 10 * 1000)

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      clearInterval(sessionCheckId)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    storeTokens(response.data)
    await refreshUser()
  }

  const register = async (data: { email: string; password: string; full_name?: string; phone_number?: string }) => {
    const response = await authApi.register(data)
    storeTokens(response.data)
    await refreshUser()
  }

  const logout = () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {})
    }
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
      <RemoteLogoutModal isOpen={isRemoteLoggedOut} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
