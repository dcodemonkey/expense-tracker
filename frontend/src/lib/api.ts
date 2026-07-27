import axios from 'axios'

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || 'https://expense-tracker-production-6f54.up.railway.app/api/v1'
export const ACCESS_TOKEN_KEY = 'expense_tracker_access_token'
export const REFRESH_TOKEN_KEY = 'expense_tracker_refresh_token'

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function storeTokens(tokens: { access_token: string; refresh_token?: string }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Access Token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// --- Access-token refresh on 401 (retry once, single-flight) ---
let refreshInFlight: Promise<string | null> | null = null

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    storeTokens(res.data)
    return res.data.access_token as string
  } catch {
    return null
  }
}

function redirectToLogin() {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (!refreshInFlight) {
        refreshInFlight = requestNewAccessToken().finally(() => {
          refreshInFlight = null
        })
      }

      const newToken = await refreshInFlight
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } else {
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; phone_number?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  refresh: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),
  verifyEmail: (token: string) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
  me: () => api.get('/auth/me'),
  updateMe: (data: { full_name?: string; phone_number?: string }) =>
    api.put('/auth/me', data),
  seed: () => api.post('/auth/seed'),
}

export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: { name: string; icon?: string; color?: string; parent_id?: number }) =>
    api.post('/categories', data),
  get: (id: number) => api.get(`/categories/${id}`),
  update: (id: number, data: Partial<{ name: string; icon: string; color: string; parent_id: number; is_active: boolean }>) =>
    api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

export const transactionsApi = {
  list: (params?: {
    start_date?: string
    end_date?: string
    category_id?: number
    type?: string
    merchant?: string
    skip?: number
    limit?: number
  }) => api.get('/transactions', { params }),
  create: (data: {
    amount: number
    currency?: string
    type: 'expense' | 'income' | 'transfer'
    category_id?: number
    description?: string
    merchant_name?: string
    location?: string
    verified_location?: string
    verified_latitude?: number
    verified_longitude?: number
    transaction_date: string
    source?: string
    raw_message?: string
  }) => api.post('/transactions', data),
  get: (id: number) => api.get(`/transactions/${id}`),
  update: (id: number, data: Partial<{
    amount: number
    currency: string
    type: 'expense' | 'income' | 'transfer'
    category_id: number
    description: string
    merchant_name: string
    location: string
    transaction_date: string
    status: string
  }>) => api.put(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
  summary: (start_date?: string, end_date?: string) =>
    api.get('/transactions/summary', { params: { start_date, end_date } }),
}

export const budgetsApi = {
  list: () => api.get('/budgets'),
  create: (data: {
    name: string
    amount: number
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
    category_id?: number
    start_date: string
    end_date?: string
  }) => api.post('/budgets', data),
  get: (id: number) => api.get(`/budgets/${id}`),
  update: (id: number, data: Partial<{
    name: string
    amount: number
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
    category_id: number
    start_date: string
    end_date: string
    is_active: boolean
  }>) => api.put(`/budgets/${id}`, data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
}

export const insightsApi = {
  dashboard: () => api.get('/insights/dashboard'),
  spendingTrend: (days?: number) => api.get('/insights/spending-trend', { params: { days } }),
  merchantAnalysis: (start_date?: string, end_date?: string, limit?: number) =>
    api.get('/insights/merchant-analysis', { params: { start_date, end_date, limit } }),
  categoryBreakdown: (start_date?: string, end_date?: string) =>
    api.get('/insights/category-breakdown', { params: { start_date, end_date } }),
  dailyInsights: (start_date?: string, end_date?: string) =>
    api.get('/insights/daily-insights', { params: { start_date, end_date } }),
}

export const syncApi = {
  sync: (data: {
    device_id: string
    device_type: 'android' | 'ios' | 'web'
    device_name?: string
    fcm_token?: string
    messages: Array<{
      source: 'sms' | 'email' | 'manual' | 'import'
      raw_content: string
      sender?: string
      received_at: string
    }>
  }) => api.post('/sync/sync', data),
  devices: () => api.get('/sync/devices'),
  deleteDevice: (device_id: string) => api.delete(`/sync/devices/${device_id}`),
}

export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data: { full_name?: string; phone_number?: string }) =>
    api.put('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
  updateLiveLocation: (data: { latitude: number; longitude: number; location_name?: string }) =>
    api.post('/users/live-location', data),
  getAllLocations: () => api.get('/users/all-locations'),
}