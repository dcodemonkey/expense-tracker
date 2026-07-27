import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import {
  Home,
  CreditCard,
  Tag,
  Target,
  BarChart3,
  Settings,
  LogOut,
  User,
  Plus,
  Wallet,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '../lib/utils'
import LiveLocationTracker from './LiveLocationTracker'
import AdminLocationRadar from './AdminLocationRadar'
import WeatherWidget from './WeatherWidget'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Budgets', href: '/budgets', icon: Target },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Compact set for the mobile bottom tab bar (+ a center Add action).
const mobileNav = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Activity', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: Target },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
]

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-mint-violet text-ink shadow-[0_6px_20px_-8px_rgba(61,225,176,0.6)]">
        <Wallet className="w-5 h-5" strokeWidth={2.4} />
      </div>
      <span className="font-display text-lg font-semibold tracking-tight text-text-hi">
        Ledger
      </span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-ink">
      {/* Desktop left rail */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 border-r border-hairline bg-surface/40 backdrop-blur-xl">
        <div className="h-16 flex items-center justify-between px-5 border-b border-hairline/60">
          <BrandMark />
          <button
            onClick={toggleTheme}
            className="text-text-lo hover:text-text-hi p-2 rounded-xl hover:bg-surface-2 transition-colors border border-hairline shrink-0"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber" /> : <Moon className="h-4 w-4 text-violet" />}
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-hairline/60">
          <WeatherWidget />
          <LiveLocationTracker />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'sidebar-link-active')
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3">
          <NavLink to="/transactions/new" className="btn-primary w-full">
            <Plus className="h-4 w-4" />
            Add transaction
          </NavLink>
        </div>

        <div className="p-3 border-t border-hairline">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="grid place-items-center w-9 h-9 rounded-full bg-violet-soft text-violet">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-hi truncate">
                {user?.full_name || 'Account'}
              </p>
              <p className="text-xs text-text-lo truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-text-lo hover:text-flame p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-hairline bg-ink/80 backdrop-blur-xl">
        <BrandMark />
        <div className="flex items-center gap-1.5">
          <LiveLocationTracker />
          <button
            onClick={toggleTheme}
            className="text-text-lo hover:text-text-hi p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber" /> : <Moon className="h-5 w-5 text-violet" />}
          </button>
          <button
            onClick={logout}
            className="text-text-lo hover:text-flame p-2 rounded-lg hover:bg-surface-2 transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-ink/90 backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center h-16 px-2">
          {mobileNav.slice(0, 2).map((item) => (
            <MobileTab key={item.href} item={item} active={isTabActive(location.pathname, item.href)} />
          ))}

          <div className="grid place-items-center">
            <NavLink
              to="/transactions/new"
              className="grid place-items-center w-12 h-12 -mt-6 rounded-2xl bg-mint-violet text-ink shadow-[0_10px_30px_-8px_rgba(61,225,176,0.7)]"
              aria-label="Add transaction"
            >
              <Plus className="w-6 h-6" strokeWidth={2.6} />
            </NavLink>
          </div>

          {mobileNav.slice(2).map((item) => (
            <MobileTab key={item.href} item={item} active={isTabActive(location.pathname, item.href)} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function isTabActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

function MobileTab({
  item,
  active,
}: {
  item: { name: string; href: string; icon: typeof Home }
  active: boolean
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
        active ? 'text-mint' : 'text-text-lo'
      )}
    >
      <Icon className="w-5 h-5" />
      {item.name}
    </NavLink>
  )
}
