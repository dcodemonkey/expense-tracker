export type TransactionType = 'expense' | 'income' | 'transfer'
export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled'
export type TransactionSource = 'sms' | 'email' | 'manual' | 'import'
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface User {
  id: number
  email: string
  full_name: string | null
  phone_number: string | null
  role: string
  is_active: boolean
  is_verified: boolean
  last_location?: string | null
  latitude?: number | null
  longitude?: number | null
  last_location_updated_at?: string | null
  created_at: string
}

export interface Category {
  id: number
  user_id: number
  name: string
  icon: string | null
  color: string | null
  parent_id: number | null
  is_default: boolean
  is_active: boolean
  type?: 'expense' | 'income' | 'both'
  created_at: string
}

export interface Transaction {
  id: number
  user_id: number
  category_id: number | null
  amount: number
  currency: string
  type: 'expense' | 'income' | 'transfer'
  source: 'sms' | 'email' | 'manual' | 'import'
  status: 'pending' | 'confirmed' | 'cancelled'
  description: string | null
  merchant_name: string | null
  location?: string | null
  verified_location?: string | null
  verified_latitude?: number | null
  verified_longitude?: number | null
  transaction_date: string
  raw_message: string | null
  parsed_confidence: number | null
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface TransactionSummary {
  total_expenses: number
  total_income: number
  net_amount: number
  transaction_count: number
  by_category: Array<{ category: string; amount: number; count: number }>
  by_merchant: Array<{ merchant: string; amount: number; count: number }>
}

export interface Budget {
  id: number
  user_id: number
  category_id: number | null
  name: string
  amount: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface BudgetWithProgress extends Budget {
  spent_amount: number
  remaining_amount: number
  progress_percentage: number
}

export interface DashboardSummary {
  today_expenses: number
  today_income: number
  this_month_expenses: number
  this_month_income: number
  this_month_net: number
  top_categories: Array<{ name: string; icon: string | null; color: string | null; amount: number }>
  recent_transactions: Transaction[]
  budget_alerts: BudgetWithProgress[]
  daily_insight: DailyInsight | null
}

export interface DailyInsight {
  id: number
  user_id: number
  insight_date: string
  insight_type: string
  title: string
  description: string | null
  data: string | null
  priority: number
  is_read: boolean
  created_at: string
}

export interface SpendingTrend {
  daily: Array<{ date: string; amount: number }>
  weekly: Array<{ date: string; amount: number }>
  monthly: Array<{ date: string; amount: number }>
}

export interface MerchantAnalysis {
  merchant: string
  total_amount: number
  transaction_count: number
  average_amount: number
  category: string | null
}

export interface CategoryBreakdown {
  category_id: number
  category_name: string
  category_icon: string | null
  category_color: string | null
  total_amount: number
  transaction_count: number
  percentage: number
}

export interface Device {
  id: number
  user_id: number
  device_id: string
  device_type: 'android' | 'ios' | 'web'
  device_name: string | null
  fcm_token: string | null
  last_sync_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SyncRequest {
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
}

export interface SyncResponse {
  success: boolean
  processed_count: number
  created_transactions: number
  errors: string[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface CategoryCreate {
  name: string
  icon?: string | null
  color?: string | null
  parent_id?: number | null
}

export interface CategoryUpdate {
  name?: string
  icon?: string | null
  color?: string | null
  parent_id?: number | null
  is_active?: boolean
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}