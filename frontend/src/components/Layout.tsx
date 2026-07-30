import { useState, useEffect } from 'react'
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
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import { cn } from '../lib/utils'
import LiveLocationTracker from './LiveLocationTracker'
import WeatherWidget from './WeatherWidget'
import PWAInstallPrompt from './PWAInstallPrompt'
import QuickParseModal from './QuickParseModal'

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
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-mint-violet text-ink shadow-[0_6px_20px_-8px_rgba(61,225,176,0.6)] shrink-0">
        <Wallet className="w-5 h-5" strokeWidth={2.4} />
      </div>
      {!collapsed && (
        <span className="font-display text-lg font-semibold tracking-tight text-text-hi truncate">
          Ledger
        </span>
      )}
    </div>
  )
}

const DEFAULT_SIDEBAR_WIDTH = 260
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 440

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const [isParseModalOpen, setIsParseModalOpen] = useState(false)

  // Resizable & Collapsible Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sidebar_width')
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH
  })

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  const [isResizing, setIsResizing] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', next.toString())
      return next
    })
  }

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      let newWidth = e.clientX
      if (newWidth < MIN_SIDEBAR_WIDTH) newWidth = MIN_SIDEBAR_WIDTH
      if (newWidth > MAX_SIDEBAR_WIDTH) newWidth = MAX_SIDEBAR_WIDTH
      setSidebarWidth(newWidth)
      localStorage.setItem('sidebar_width', newWidth.toString())
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
      }
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const actualWidth = isCollapsed ? 68 : sidebarWidth

  return (
    <div className={`min-h-screen bg-ink ${isResizing ? 'select-none' : ''}`}>
      {/* Desktop left rail */}
      <aside
        style={{ width: `${actualWidth}px` }}
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-hairline bg-surface/40 backdrop-blur-xl transition-[width] duration-200 ease-out z-30 group/sidebar"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-hairline/60 shrink-0">
          <BrandMark collapsed={isCollapsed} />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="text-text-lo hover:text-text-hi p-1.5 rounded-xl hover:bg-surface-2 transition-colors border border-hairline shrink-0"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber" /> : <Moon className="h-4 w-4 text-violet" />}
            </button>
            <button
              onClick={toggleCollapse}
              className="text-text-lo hover:text-text-hi p-1.5 rounded-xl hover:bg-surface-2 transition-colors border border-hairline shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4 text-mint" /> : <ChevronLeft className="h-4 w-4 text-mint" />}
            </button>
          </div>
        </div>

        {/* Widgets section */}
        {!isCollapsed && (
          <div className="p-3 space-y-2 border-b border-hairline/60 shrink-0 animate-fade-in">
            <WeatherWidget />
            <LiveLocationTracker />
            <PWAInstallPrompt />
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'sidebar-link flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
                    isActive && 'sidebar-link-active',
                    isCollapsed && 'justify-center px-0'
                  )
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            )
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  'sidebar-link flex items-center gap-3 px-3 py-2 rounded-xl text-mint hover:bg-mint-soft/30 border border-mint/20 mt-2 transition-all',
                  isActive && 'bg-mint-soft border-mint/40 font-bold',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? 'User Admin' : undefined}
            >
              <Users className="h-5 w-5 shrink-0 text-mint" />
              {!isCollapsed && <span className="truncate">User Admin</span>}
            </NavLink>
          )}
        </nav>

        {/* Actions section */}
        <div className="p-2.5 space-y-2 shrink-0">
          <button
            onClick={() => setIsParseModalOpen(true)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-soft hover:bg-violet/20 text-violet border border-violet/30 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm',
              isCollapsed && 'px-0 justify-center'
            )}
            title="Smart Parse SMS"
          >
            <Sparkles className="w-4 h-4 text-violet animate-pulse shrink-0" />
            {!isCollapsed && <span>Smart Parse SMS</span>}
          </button>

          <NavLink
            to="/transactions/new"
            className={cn('btn-primary w-full flex items-center justify-center gap-2', isCollapsed && 'px-0 justify-center')}
            title="Add transaction"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Add transaction</span>}
          </NavLink>
        </div>

        {/* User profile section */}
        <div className="p-2.5 border-t border-hairline shrink-0">
          <div className={cn('flex items-center gap-2 px-1 py-1.5', isCollapsed && 'justify-center')}>
            <NavLink
              to="/settings"
              className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-90 transition-opacity"
              title="View & edit account settings"
            >
              <div className="grid place-items-center w-9 h-9 rounded-full bg-violet-soft text-violet group-hover:bg-violet group-hover:text-white transition-colors shrink-0">
                <User className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-hi truncate group-hover:text-mint transition-colors">
                    {user?.full_name || 'Account'}
                  </p>
                  <p className="text-xs text-text-lo truncate">{user?.email}</p>
                </div>
              )}
            </NavLink>

            {!isCollapsed && (
              <>
                <NavLink
                  to="/settings"
                  className="text-text-lo hover:text-text-hi p-1.5 rounded-lg hover:bg-surface-2 transition-colors shrink-0"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </NavLink>
                <button
                  onClick={logout}
                  className="text-text-lo hover:text-flame p-1.5 rounded-lg hover:bg-surface-2 transition-colors shrink-0"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Drag-to-Resize Handle on Right Edge */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className={cn(
              'absolute top-0 right-0 bottom-0 w-1.5 hover:w-2 bg-transparent hover:bg-mint/40 cursor-col-resize transition-all z-40 group/handle flex items-center justify-center',
              isResizing && 'bg-mint/60 w-2'
            )}
            title="Drag to resize sidebar width"
          >
            <div className="opacity-0 group-hover/handle:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-mint" />
            </div>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-2.5 sm:px-4 border-b border-hairline bg-ink/90 backdrop-blur-xl gap-1">
        <BrandMark />
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <LiveLocationTracker />
          <NavLink
            to="/settings"
            className="text-text-lo hover:text-text-hi p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Account Settings"
          >
            <Settings className="h-4.5 w-4.5 text-mint" />
          </NavLink>
          <button
            onClick={toggleTheme}
            className="text-text-lo hover:text-text-hi p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber" /> : <Moon className="h-4.5 w-4.5 text-violet" />}
          </button>
          <button
            onClick={logout}
            className="text-text-lo hover:text-flame p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main
        style={{ paddingLeft: window.innerWidth >= 1024 ? `${actualWidth}px` : undefined }}
        className="transition-[padding] duration-200 ease-out"
      >
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

      <QuickParseModal isOpen={isParseModalOpen} onClose={() => setIsParseModalOpen(false)} />
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
