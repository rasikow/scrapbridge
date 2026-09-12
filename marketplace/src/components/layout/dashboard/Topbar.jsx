import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShoppingCart, LogOut, ChevronDown, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { notificationService } from '@/services/notification.service'
import { cn } from '@/lib/utils'

const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', admin: 'Administrator' }

/**
 * Utility row that sits directly under TopNav: current-role context on the
 * left, notifications / cart / account menu on the right. Search and
 * primary navigation now live in TopNav — this bar no longer duplicates
 * them, since the left sidebar was retired in favor of top navigation.
 */
export function Topbar({ cartCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return
    function reload() {
      setNotifications(notificationService.list(user.id, { limit: 8 }))
    }
    reload()
    notificationService.bus.addEventListener('changed', reload)
    const interval = setInterval(reload, 4000)
    return () => {
      notificationService.bus.removeEventListener('changed', reload)
      clearInterval(interval)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => n.unread).length

  function openNotification(n) {
    notificationService.markRead(n.id)
    if (n.meta?.auctionId && user) {
      if (user.role === 'seller') navigate(`/seller/auctions/${n.meta.auctionId}`)
      else if (user.role === 'admin') navigate('/admin/auctions')
      else if (n.meta.productId) navigate(`/buyer/marketplace/${n.meta.productId}`)
    }
  }

  return (
    <header className="sticky top-[57px] z-30 flex items-center gap-3 border-b border-paper-300 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
      <Badge variant="verdigris" className="hidden sm:inline-flex">{ROLE_LABEL[user?.role]} workspace</Badge>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        {user?.role === 'buyer' && (
          <button
            onClick={() => navigate('/buyer/cart')}
            className="relative rounded-full p-2 text-ink-500 hover:bg-paper-200"
            aria-label="Cart"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-copper-500 text-[10px] font-medium text-white">
                {cartCount}
              </span>
            )}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative rounded-full p-2 text-ink-500 hover:bg-paper-200" aria-label="Notifications">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-signal-down text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-2.5 py-4 text-center text-xs text-ink-500">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn('flex w-full gap-2.5 rounded-sm px-2.5 py-2.5 text-left hover:bg-paper-100', n.unread && 'bg-copper-100/30')}
                >
                  <span
                    className={cn(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      n.unread ? 'bg-copper-500' : 'bg-transparent'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[11px] text-ink-300">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-paper-200">
              <div className="flex size-7 items-center justify-center rounded-full bg-graphite-900 text-xs font-medium text-white">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden text-sm font-medium text-ink-700 sm:block">{user?.name}</span>
              <ChevronDown className="hidden size-3.5 text-ink-300 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium text-ink-900">{user?.name}</p>
              <p className="text-xs text-ink-500">{user?.email}</p>
              <Badge variant="verdigris" className="mt-1.5">{ROLE_LABEL[user?.role]}</Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/${user.role}/profile`)}>
              <Building2 className="size-4" /> Company Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-signal-down data-[highlighted]:bg-signal-down/10">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
