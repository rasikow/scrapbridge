import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ClipboardList, Clock, CheckCircle2, XCircle, Heart, Eye, Bell, ArrowRight, Gavel } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { WelcomeBanner } from '@/components/shared/WelcomeBanner'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductImage } from '@/components/shared/ProductImage'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { orderService } from '@/services/order.service'
import { auctionService } from '@/services/auction.service'
import { notificationService } from '@/services/notification.service'
import { recentlyViewedStore } from '@/services/repositories/mockCommerceRepository'
import { getProduct } from '@/data/products'
import { formatCurrency, formatPrice } from '@/lib/utils'
import { STATUS_TONE } from '@/data/orderStatus'

function formatAxisCurrency(v) {
  if (v >= 1000) return `$${Math.round(v / 1000)}k`
  return `$${v}`
}

function buildMonthlyChart(orders) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), value: 0 })
  }
  orders.forEach((o) => {
    const d = new Date(o.placedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.value += o.total
  })
  return months
}

export default function BuyerDashboardPage() {
  const { user } = useAuth()
  const { products: wishlistProducts } = useWishlist()
  const [orders, setOrders] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [myBids, setMyBids] = useState(null)

  useEffect(() => {
    orderService.listOrders(user.id).then(setOrders)
  }, [user.id])

  useEffect(() => {
    function reload() { setNotifications(notificationService.list(user.id, { limit: 4 })) }
    reload()
    notificationService.bus.addEventListener('changed', reload)
    return () => notificationService.bus.removeEventListener('changed', reload)
  }, [user.id])

  useEffect(() => {
    function reload() { auctionService.listBidsForBuyer(user.id).then(setMyBids) }
    reload()
    auctionService.bus.addEventListener('changed', reload)
    const interval = setInterval(reload, 5000)
    return () => {
      auctionService.bus.removeEventListener('changed', reload)
      clearInterval(interval)
    }
  }, [user.id])

  const recentlyViewed = useMemo(
    () => recentlyViewedStore.get(user.id).map(getProduct).filter(Boolean),
    [user.id]
  )

  const stats = useMemo(() => {
    if (!orders) return null
    const pending = orders.filter((o) => o.status === 'Pending').length
    const completed = orders.filter((o) => o.status === 'Delivered').length
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length
    const totalValue = orders.reduce((sum, o) => sum + o.total, 0)
    return { total: orders.length, pending, completed, cancelled, totalValue }
  }, [orders])

  const chartData = useMemo(() => buildMonthlyChart(orders || []), [orders])

  const auctionStats = useMemo(() => {
    const rows = myBids || []
    const winning = rows.filter((r) => r.status === 'winning').length
    const outbid = rows.filter((r) => r.status === 'outbid').length
    const endingSoon = rows.filter((r) => {
      if (!r.auction || r.auction.status !== 'live' || !r.auction.endAt) return false
      const ms = new Date(r.auction.endAt).getTime() - Date.now()
      return ms > 0 && ms < 3 * 3600000
    })
    return { winning, outbid, endingSoon, active: rows.filter((r) => r.auction?.status === 'live') }
  }, [myBids])

  return (
    <DashboardShell>
      <WelcomeBanner
        highlights={[
          { label: 'Open orders', value: stats ? stats.pending : '—' },
          { label: 'Active bids', value: auctionStats.active.length },
          { label: 'Wishlist', value: wishlistProducts.length },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">Here&apos;s what&apos;s happening across your orders, bids, and saved listings.</p>
        <Link to="/buyer/marketplace">
          <Badge variant="copper" className="cursor-pointer px-3 py-1.5 text-sm">
            Browse marketplace <ArrowRight className="size-3.5" />
          </Badge>
        </Link>
      </div>

      {myBids && myBids.length > 0 && (
        <Card className="mb-6 border-copper-400/40 bg-copper-100/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2.5 text-sm text-ink-700">
              <Gavel className="size-4 text-copper-600" />
              <span>
                <strong>{auctionStats.active.length}</strong> active bid{auctionStats.active.length === 1 ? '' : 's'} ·{' '}
                <strong className="text-signal-up">{auctionStats.winning}</strong> winning ·{' '}
                <strong className="text-signal-warn">{auctionStats.outbid}</strong> outbid
                {auctionStats.endingSoon.length > 0 && (
                  <> · <strong className="text-signal-down">{auctionStats.endingSoon.length} ending soon</strong></>
                )}
              </span>
            </div>
            <Link to="/buyer/my-bids" className="text-xs font-medium text-copper-600 hover:underline">View My Bids</Link>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Orders" value={stats.total} icon={ClipboardList} tone="default" />
            <StatCard label="Pending Orders" value={stats.pending} icon={Clock} tone="copper" />
            <StatCard label="Completed Orders" value={stats.completed} icon={CheckCircle2} tone="verdigris" />
            <StatCard label="Cancelled Orders" value={stats.cancelled} icon={XCircle} tone="outline" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Monthly purchase chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Monthly purchase value</CardTitle>
              <p className="text-sm text-ink-500">Last 6 months</p>
            </div>
            {stats && (
              <p className="font-mono-data text-xl font-semibold text-ink-900">
                {formatCurrency(stats.totalValue)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!orders ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ left: 4, right: 10, top: 8 }}>
                  <defs>
                    <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C1793F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C1793F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#667075' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#C1793F" strokeWidth={2} fill="url(#purchaseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Bell className="size-4" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 && <p className="py-4 text-center text-xs text-ink-500">No notifications yet.</p>}
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-2.5 border-b border-paper-200 pb-3 last:border-0 last:pb-0">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.unread ? 'bg-copper-500' : 'bg-paper-300'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-ink-300">{n.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Wishlist teaser */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Heart className="size-4" /> Wishlist</CardTitle>
            <Link to="/buyer/wishlist" className="text-xs font-medium text-copper-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {wishlistProducts.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved materials yet"
                description="Save products you're tracking and they'll show up here."
              />
            ) : (
              <div className="space-y-3">
                {wishlistProducts.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/buyer/marketplace/${p.id}`} className="flex items-center gap-3 rounded-[var(--radius-sm)] p-1.5 hover:bg-paper-100">
                    <ProductImage materialId={p.materialId} className="size-12 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-500">${formatPrice(p.price)}/{p.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently viewed */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Eye className="size-4" /> Recently viewed</CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyViewed.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="Nothing viewed yet"
                description="Products you open in the marketplace appear here for quick access."
              />
            ) : (
              <div className="space-y-3">
                {recentlyViewed.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/buyer/marketplace/${p.id}`} className="flex items-center gap-3 rounded-[var(--radius-sm)] p-1.5 hover:bg-paper-100">
                    <ProductImage materialId={p.materialId} className="size-12 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-500">${formatPrice(p.price)}/{p.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {orders && orders.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent orders</CardTitle>
            <Link to="/buyer/orders" className="text-xs font-medium text-copper-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-paper-300 text-left text-xs text-ink-500">
                    <th className="px-6 py-2.5 font-medium">Order</th>
                    <th className="px-6 py-2.5 font-medium">Material</th>
                    <th className="px-6 py-2.5 font-medium">Total</th>
                    <th className="px-6 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                      <td className="px-6 py-3">
                        <Link to={`/buyer/orders/${o.id}`} className="font-mono-data text-copper-600 hover:underline">
                          {o.id}
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate px-6 py-3 text-ink-700">{o.productName}</td>
                      <td className="px-6 py-3 font-mono-data text-ink-900">{formatCurrency(o.total)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={STATUS_TONE[o.status]}>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  )
}
