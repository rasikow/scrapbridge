import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Recycle, Menu, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_BY_ROLE } from './navConfig'

const ROLE_HOME = { buyer: '/buyer/dashboard', seller: '/seller/dashboard', admin: '/admin/dashboard' }

export function TopNav({ role, showSearch = true, onSearch }) {
  const items = NAV_BY_ROLE[role] || []
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function submitSearch(e) {
    e.preventDefault()
    if (onSearch) onSearch(query)
    setMobileOpen(false)
  }

  return (
    <div className="sticky top-0 z-40 bg-graphite-900">
      {/* Brand row */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-sm p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <button
          onClick={() => navigate(ROLE_HOME[role] || '/')}
          className="flex items-center gap-2.5"
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-copper-500">
            <Recycle className="size-4.5 text-white" />
          </div>
          <span className="hidden font-display text-base font-semibold tracking-tight text-white sm:block">
            ScrapBridge
          </span>
        </button>

        {/* Desktop nav links */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.endsWith('/dashboard')}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-copper-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {showSearch && (
          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 xl:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search materials, grades, sellers…"
                className="h-9 w-full rounded-full border border-white/10 bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-400"
              />
            </div>
          </form>
        )}
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-2 lg:hidden">
          {showSearch && (
            <form onSubmit={submitSearch} className="px-1 pb-2 xl:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search materials, grades, sellers…"
                  className="h-9 w-full rounded-full border border-white/10 bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-400"
                />
              </div>
            </form>
          )}
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.endsWith('/dashboard')}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius-sm)] border-l-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-copper-500 bg-white/10 text-white'
                    : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <Icon className="size-4.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
