import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import {
  User,
  Bell,
  Shield,
  Palette,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Database,
  Moon,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { api, authApi, usersApi, transactionsApi } from '../lib/api'
import {
  Card,
  CardBody,
  Button,
  Input,
  Field,
  Select,
  Badge,
} from '../components/ui'

type TabId = 'profile' | 'security' | 'notifications' | 'appearance' | 'data'

export default function Settings() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [exportingData, setExportingData] = useState(false)
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })

  const handleExportData = async () => {
    try {
      setExportingData(true)
      const res = await transactionsApi.list({ limit: 1000 })
      const rawData = res.data
      const txs = Array.isArray(rawData) ? rawData : (rawData?.items || [])
      const jsonString = JSON.stringify(txs, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = url
      downloadAnchor.setAttribute('download', `expense_tracker_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (err) {
      toast.error('Failed to export data')
    } finally {
      setExportingData(false)
    }
  }

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    email: user?.email || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name?: string; phone_number?: string }) => authApi.updateMe(data),
    onSuccess: (response) => {
      queryClient.setQueryData(['user'], response.data)
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to update profile'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to change password'),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteMe(),
    onSuccess: () => {
      logout()
      toast.success('Account deleted successfully')
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to delete account'),
  })

  const seedDataMutation = useMutation({
    mutationFn: () => authApi.seed(),
    onSuccess: () => {
      toast.success('Demo data seeded successfully')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to seed data'),
  })

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    })
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Trash2 },
  ]

  const notificationItems = [
    { id: 'budget_alerts', label: 'Budget Alerts', description: 'Get notified when you approach or exceed your budget' },
    { id: 'daily_summary', label: 'Daily Summary', description: 'Receive a daily summary of your spending' },
    { id: 'weekly_report', label: 'Weekly Report', description: 'Get a weekly spending report every Monday' },
    { id: 'monthly_report', label: 'Monthly Report', description: 'Get a detailed monthly spending analysis' },
    { id: 'sms_parsed', label: 'SMS Parsed Transactions', description: 'Notify when a new transaction is detected from SMS' },
    { id: 'budget_exceeded', label: 'Budget Exceeded', description: 'Immediate alert when budget is exceeded' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-text-hi">Settings</h1>
        <p className="text-sm text-text-lo">Manage your account and preferences</p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row">
          <nav className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-hairline p-4">
            <ul className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={cn('sidebar-link w-full', activeTab === tab.id && 'sidebar-link-active')}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex-1 p-6 space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-text-hi">Profile Information</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    updateProfileMutation.mutate({
                      full_name: profileForm.full_name,
                      phone_number: profileForm.phone_number,
                    })
                  }}
                  className="space-y-4 max-w-md"
                >
                  <Field label="Full Name" htmlFor="full_name">
                    <Input
                      id="full_name"
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" hint="Email cannot be changed">
                    <Input id="email" type="email" value={profileForm.email} disabled className="opacity-60" />
                  </Field>
                  <Field label="Phone Number" htmlFor="phone_number">
                    <Input
                      id="phone_number"
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                  <Button type="submit" loading={updateProfileMutation.isPending}>
                    Save Changes
                  </Button>
                </form>

                {user?.last_location && (
                  <div className="pt-6 border-t border-hairline max-w-md">
                    <p className="text-sm font-medium text-text-hi mb-2">Live GPS Tracking</p>
                    <div className="p-3.5 bg-surface-2 border border-mint/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid place-items-center w-8 h-8 rounded-lg bg-mint-soft text-mint">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-hi">{user.last_location}</p>
                          {user.latitude && user.longitude && (
                            <p className="text-xs text-text-lo font-mono">
                              {Number(user.latitude).toFixed(5)}, {Number(user.longitude).toFixed(5)}
                            </p>
                          )}
                        </div>
                      </div>
                      {user.latitude && user.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${user.latitude},${user.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-mint" />
                          Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-text-hi">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <Field label="Current Password" htmlFor="current_password">
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
                        aria-label={showPassword.current ? 'Hide password' : 'Show password'}
                      >
                        {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password" htmlFor="new_password">
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
                        aria-label={showPassword.new ? 'Hide password' : 'Show password'}
                      >
                        {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password" htmlFor="confirm_password">
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
                        aria-label={showPassword.confirm ? 'Hide password' : 'Show password'}
                      >
                        {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                  <Button type="submit" loading={changePasswordMutation.isPending}>
                    Change Password
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-text-hi">Notification Preferences</h2>
                <div className="space-y-3">
                  {notificationItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-hairline rounded-xl bg-surface-2"
                    >
                      <div>
                        <p className="font-medium text-text-hi">{item.label}</p>
                        <p className="text-sm text-text-lo">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-mint/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-text-hi">Appearance</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-hairline rounded-xl bg-surface-2">
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center w-10 h-10 rounded-xl bg-violet-soft text-violet">
                        <Moon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-text-hi">Theme</p>
                        <p className="text-sm text-text-lo">Choose between Dark and Light mode</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>
                        Dark
                      </Button>
                      <Button size="sm" variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>
                        Light
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-hairline rounded-xl bg-surface-2">
                    <div>
                      <p className="font-medium text-text-hi">Currency Format</p>
                      <p className="text-sm text-text-lo">How amounts are displayed</p>
                    </div>
                    <Badge tone="gray">₹ INR (Indian)</Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold text-text-hi">Data &amp; Privacy</h2>

                <div className="p-4 border border-hairline rounded-xl bg-surface-2">
                  <h3 className="font-medium text-text-hi mb-1">Demo Data</h3>
                  <p className="text-sm text-text-lo mb-4">
                    Generate sample transactions, categories, budgets, and insights to explore the app features.
                  </p>
                  <Button onClick={() => seedDataMutation.mutate()} loading={seedDataMutation.isPending}>
                    <Database className="h-4 w-4" />
                    Seed Demo Data
                  </Button>
                  {seedDataMutation.isSuccess && (
                    <p className="mt-2 text-sm text-mint">Demo data created successfully! Refresh the page to see it.</p>
                  )}
                  {seedDataMutation.isError && (
                    <p className="mt-2 text-sm text-flame">
                      Failed to seed data: {(seedDataMutation.error as any)?.response?.data?.detail || 'Unknown error'}
                    </p>
                  )}
                </div>

                <div className="p-4 border border-hairline rounded-xl bg-surface-2">
                  <h3 className="font-medium text-text-hi mb-1">Export Your Data</h3>
                  <p className="text-sm text-text-lo mb-4">
                    Download all your transactions, categories, budgets, and insights in JSON format.
                  </p>
                  <Button variant="secondary" onClick={handleExportData} loading={exportingData}>
                    <Download className="h-4 w-4" />
                    {exportingData ? 'Exporting...' : 'Export Data'}
                  </Button>
                </div>

                <div className="p-4 border border-hairline rounded-xl bg-surface-2">
                  <h3 className="font-medium text-text-hi mb-1">Import Data</h3>
                  <p className="text-sm text-text-lo mb-4">Import transactions from a CSV or JSON file.</p>
                  <label className="btn-secondary cursor-pointer inline-flex">
                    <Upload className="h-4 w-4" />
                    Choose File
                    <input type="file" accept=".csv,.json" className="sr-only" />
                  </label>
                </div>

                <div className="p-4 border border-flame/25 rounded-xl bg-flame-soft">
                  <h3 className="font-medium text-flame mb-1">Delete Account</h3>
                  <p className="text-sm text-flame/80 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This cannot be undone.'))
                        deleteAccountMutation.mutate()
                    }}
                    loading={deleteAccountMutation.isPending}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
