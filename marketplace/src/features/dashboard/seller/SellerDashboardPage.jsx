import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Package, CheckCircle2, Clock, Receipt, DollarSign, Wallet, TrendingUp, TrendingDown, AlertTriangle,
  Bell, Sparkles, Star, ShieldCheck, Flame, Trophy, Medal, Award, Plus, Gavel,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { StatCard } from '@/components/shared/StatCard'
import { CountUpNumber } from '@/components/shared/CountUpNumber'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/product.service'
import { orderService } from '@/services/order.service'
import { auctionService } from '@/services/auction.service'
import { notificationService } from '@/services/notification.service'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { STATUS_TONE } from '@/data/orderStatus'
import { AUCTION_STATUS } from '@/data/auctionConstants'
import { formatCurrency, cn } from '@/lib/utils'

const UNPAID_STATUSES = ['Pending', 'Approved', 'Processing', 'Packed', 'Shipped']
const RANK_ICON = [Trophy, Medal, Award]
const RANK_COLOR = ['#C1793F', '#9AA3A6', '#B8964A']

function buildMonthlyBuckets(orders) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), orders: 0, revenue: 0 })
  }
  orders.forEach((o) => {
    const d = new Date(o.placedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) {
      bucket.orders += 1
      if (o.status === 'Delivered') bucket.revenue += o.total
    }
  })
  return months
}

function daysAgo(n) {
  return Date.now() - n * 86400000
}

function pctChange(current, previous) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState(null)
  const [orders, setOrders] = useState(null)
  const [auctions, setAuctions] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    productService.listBySeller(user.sellerId).then(setProducts)
    orderService.listOrdersForSeller(user.sellerId).then(setOrders)
  }, [user.sellerId])

  useEffect(() => {
    function reload() { auctionService.listAuctions({ sellerId: user.sellerId }).then(setAuctions) }
    reload()
    auctionService.bus.addEventListener('changed', reload)
    const interval = setInterval(reload, 5000)
    return () => {
      auctionService.bus.removeEventListener('changed', reload)
      clearInterval(interval)
    }
  }, [user.sellerId])

  useEffect(() => {
    function reload() { setNotifications(notificationService.list(user.id, { limit: 4 })) }
    reload()
    notificationService.bus.addEventListener('changed', reload)
    return () => notificationService.bus.removeEventListener('changed', reload)
  }, [user.id])

  const seller = getSeller(user.sellerId)

  const stats = useMemo(() => {
    if (!products || !orders) return null
    const active = products.filter((p) => p.status === 'active').length
    const pending = products.filter((p) => p.status === 'pending').length
    const lowStock = products.filter((p) => p.stockAvailability && p.quantity <= (p.lowStockThreshold || 0))
    const revenue = orders.filter((o) => o.status === 'Delivered').reduce((s, o) => s + o.total, 0)
    const pendingPayments = orders.filter((o) => UNPAID_STATUSES.includes(o.status)).reduce((s, o) => s + o.total, 0)
    const now = new Date()
    const monthlySalesCount = orders.filter((o) => {
      const d = new Date(o.placedAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { totalProducts: products.length, active, pending, ordersReceived: orders.length, revenue, pendingPayments, monthlySalesCount, lowStock }
  }, [products, orders])

  const monthly = useMemo(() => buildMonthlyBuckets(orders || []), [orders])
  const peakIndex = useMemo(() => {
    if (!monthly.length) return -1
    let best = 0
    monthly.forEach((m, i) => { if (m.orders > monthly[best].orders) best = i })
    return monthly[best].orders > 0 ? best : -1
  }, [monthly])

  const momentum = useMemo(() => {
    if (!orders) return null
    const thisWeekOrders = orders.filter((o) => new Date(o.placedAt).getTime() >= daysAgo(7)).length
    const lastWeekOrders = orders.filter((o) => {
      const t = new Date(o.placedAt).getTime()
      return t >= daysAgo(14) && t < daysAgo(7)
    }).length

    // Rolling 30-day windows rather than calendar-month-to-date — far less
    // noisy for a hero stat (month-to-date looks artificially terrible for
    // the first few days of any month, which is a bad first impression).
    const thisMonthRevenue = orders
      .filter((o) => new Date(o.placedAt).getTime() >= daysAgo(30))
      .reduce((s, o) => s + o.total, 0)
    const lastMonthRevenue = orders
      .filter((o) => {
        const t = new Date(o.placedAt).getTime()
        return t >= daysAgo(60) && t < daysAgo(30)
      })
      .reduce((s, o) => s + o.total, 0)
    const revenueChange = pctChange(thisMonthRevenue, lastMonthRevenue)

    const newProductsThisWeek = (products || []).filter((p) => new Date(p.createdAt).getTime() >= daysAgo(7)).length

    return { thisWeekOrders, lastWeekOrders, ordersChange: pctChange(thisWeekOrders, lastWeekOrders), thisMonthRevenue, revenueChange, newProductsThisWeek }
  }, [orders, monthly, products])

  const heroMessage = useMemo(() => {
    if (!momentum) return ''
    if (momentum.revenueChange >= 20) return "You're on a roll — keep the momentum going!"
    if (momentum.revenueChange >= 0) return 'Steady growth this month. Nice work.'
    if (momentum.thisWeekOrders > 0) return `${momentum.thisWeekOrders} new order${momentum.thisWeekOrders === 1 ? '' : 's'} this week — stay on it.`
    return 'A fresh month is a fresh chance to top the leaderboard.'
  }, [momentum])

  const topMaterials = useMemo(() => {
    if (!orders) return []
    const byMaterial = {}
    orders.forEach((o) => {
      const product = (products || []).find((p) => p.id === o.productId)
      const materialId = product?.materialId
      if (!materialId) return
      byMaterial[materialId] = (byMaterial[materialId] || 0) + o.total
    })
    return Object.entries(byMaterial)
      .map(([materialId, revenue]) => ({ material: getMaterial(materialId), revenue }))
      .filter((r) => r.material)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [orders, products])
  const maxMaterialRevenue = topMaterials[0]?.revenue || 1

  const auctionStats = useMemo(() => {
    const rows = auctions || []
    const live = rows.filter((a) => a.status === AUCTION_STATUS.LIVE).length
    const bidders = new Set(rows.flatMap((a) => a.bidderIds || [])).size
    const revenue = rows
      .filter((a) => a.status === AUCTION_STATUS.COMPLETED && a.winningBid)
      .reduce((s, a) => s + (a.pricingUnit === 'per_lot' ? a.winningBid : a.winningBid * a.lotQuantity), 0)
    const needsAttention = rows.filter((a) => a.status === AUCTION_STATUS.RESERVE_NOT_MET).length
    return { total: rows.length, live, bidders, revenue, needsAttention }
  }, [auctions])

  const loading = !stats || !momentum

  return (
    <DashboardShell showSearch={false}>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-graphite-900 px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(63,125,116,0.35),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-copper-500/10 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-1.5 font-mono-data text-xs uppercase tracking-wider text-copper-400">
              <Sparkles className="size-3.5" /> Seller dashboard
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-semibold text-white sm:text-3xl">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1.5 text-sm text-white/60">{loading ? 'Loading your numbers…' : heroMessage}</p>

            {seller && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  <Star className="size-3.5 fill-copper-400 text-copper-400" /> {seller.rating} rating
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  <ShieldCheck className="size-3.5 text-verdigris-400" /> Verified since {seller.memberSince}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  <Trophy className="size-3.5 text-copper-400" /> {seller.completedOrders.toLocaleString()} orders fulfilled
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="text-left sm:text-right">
              <p className="text-xs text-white/50">Last 30 days</p>
              {loading ? (
                <Skeleton className="mt-1.5 h-9 w-32 bg-white/10" />
              ) : (
                <div className="mt-0.5 flex items-baseline gap-2 sm:justify-end">
                  <CountUpNumber
                    value={momentum.thisMonthRevenue}
                    format={(v) => formatCurrency(v)}
                    className="font-mono-data text-3xl font-semibold text-white tabular-nums"
                  />
                  <span
                    className={cn(
                      'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      momentum.revenueChange >= 0 ? 'bg-verdigris-500/20 text-verdigris-400' : 'bg-signal-down/20 text-red-300'
                    )}
                  >
                    {momentum.revenueChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {Math.abs(momentum.revenueChange)}%
                  </span>
                </div>
              )}
              <p className="mt-0.5 text-xs text-white/40">vs prior 30 days</p>
            </div>
            <Link to="/seller/products/new">
              <Button variant="copper" size="sm">
                <Plus className="size-3.5" /> Add product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Momentum strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-paper-300 bg-white px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-copper-100">
                <Flame className="size-4 text-copper-600" />
              </div>
              <div className="min-w-0">
                <p className="font-mono-data text-lg font-semibold text-ink-900 tabular-nums">
                  {momentum.thisWeekOrders} <span className="text-xs font-normal text-ink-500">orders this week</span>
                </p>
                <p className={cn('text-xs font-medium', momentum.ordersChange >= 0 ? 'text-signal-up' : 'text-ink-500')}>
                  {momentum.ordersChange >= 0 ? '+' : ''}{momentum.ordersChange}% vs last week
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-paper-300 bg-white px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-verdigris-100">
                <Package className="size-4 text-verdigris-600" />
              </div>
              <div className="min-w-0">
                <p className="font-mono-data text-lg font-semibold text-ink-900 tabular-nums">
                  {momentum.newProductsThisWeek} <span className="text-xs font-normal text-ink-500">new listings</span>
                </p>
                <p className="text-xs text-ink-500">added this week</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-paper-300 bg-white px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-200">
                <Wallet className="size-4 text-ink-700" />
              </div>
              <div className="min-w-0">
                <p className="font-mono-data text-lg font-semibold text-ink-900 tabular-nums">{formatCurrency(stats.pendingPayments)}</p>
                <p className="text-xs text-ink-500">in the pipeline, not yet paid out</p>
              </div>
            </div>
          </>
        )}
      </div>

      {auctions && auctions.length > 0 && (
        <Card className="mb-6 border-copper-400/40 bg-copper-100/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2.5 text-sm text-ink-700">
              <Gavel className="size-4 text-copper-600" />
              <span>
                <strong>{auctionStats.total}</strong> auction{auctionStats.total === 1 ? '' : 's'} ·{' '}
                <strong className="flex-none text-signal-up">{auctionStats.live}</strong> live ·{' '}
                <strong>{auctionStats.bidders}</strong> unique bidders · auction revenue{' '}
                <strong className="font-mono-data">{formatCurrency(auctionStats.revenue)}</strong>
                {auctionStats.needsAttention > 0 && (
                  <> · <strong className="text-signal-warn">{auctionStats.needsAttention} need{auctionStats.needsAttention === 1 ? 's' : ''} attention</strong></>
                )}
              </span>
            </div>
            <Link to="/seller/auctions" className="text-xs font-medium text-copper-600 hover:underline">View auctions</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Products" value={stats.totalProducts} icon={Package} tone="default" />
            <StatCard label="Active Products" value={stats.active} icon={CheckCircle2} tone="verdigris" />
            <StatCard label="Pending Products" value={stats.pending} icon={Clock} tone="copper" />
            <StatCard label="Orders Received" value={stats.ordersReceived} icon={Receipt} tone="outline" />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} tone="verdigris" />
            <StatCard label="Pending Payments" value={formatCurrency(stats.pendingPayments)} icon={Wallet} tone="copper" />
            <StatCard label="Monthly Sales" value={stats.monthlySalesCount} icon={TrendingUp} tone="default" />
            <StatCard
              label="Low Stock Alerts"
              value={stats.lowStock.length}
              icon={AlertTriangle}
              tone={stats.lowStock.length > 0 ? 'copper' : 'outline'}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly sales</CardTitle>
            <p className="text-sm text-ink-500">Orders received, last 6 months{peakIndex >= 0 && ` · best month: ${monthly[peakIndex].label}`}</p>
          </CardHeader>
          <CardContent>
            {!orders ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={monthly} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {monthly.map((m, i) => (
                      <Cell key={m.key} fill={i === peakIndex ? '#C1793F' : '#3F7D74'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue trend</CardTitle><p className="text-sm text-ink-500">Delivered &amp; settled, last 6 months</p></CardHeader>
          <CardContent>
            {!orders ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={monthly} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C1793F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C1793F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#C1793F" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-copper-500" /> Top selling materials</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {!orders ? (
              <Skeleton className="h-40 w-full" />
            ) : topMaterials.length === 0 ? (
              <p className="text-sm text-ink-500">No sales yet — your first order will show up here.</p>
            ) : (
              topMaterials.map(({ material, revenue }, i) => {
                const RankIcon = RANK_ICON[i]
                return (
                  <div key={material.id} className={cn('flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2.5', i === 0 && 'bg-copper-100/40')}>
                    <div className="flex size-7 shrink-0 items-center justify-center">
                      {RankIcon ? (
                        <RankIcon className="size-5" style={{ color: RANK_COLOR[i] }} />
                      ) : (
                        <span className="font-mono-data text-xs text-ink-300">#{i + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-ink-900">
                          <span className="size-2 rounded-full" style={{ backgroundColor: material.swatch }} />
                          {material.label}
                        </span>
                        <span className="font-mono-data text-ink-700">{formatCurrency(revenue)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-200">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(revenue / maxMaterialRevenue) * 100}%`, backgroundColor: material.swatch }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

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

      {stats && stats.lowStock.length > 0 && (
        <Card className="mt-6 border-copper-400/40">
          <CardHeader><CardTitle className="flex items-center gap-2 text-copper-600"><AlertTriangle className="size-4" /> Low stock alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-paper-300 px-4 py-2.5 text-sm">
                <Link to={`/seller/products/${p.id}/edit`} className="font-medium text-ink-900 hover:text-copper-600">{p.name}</Link>
                <span className="font-mono-data text-ink-500">{p.quantity.toLocaleString()} {p.unit} remaining</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {orders && orders.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent orders received</CardTitle>
            <Link to="/seller/orders" className="text-xs font-medium text-copper-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-paper-300 text-left text-xs text-ink-500">
                    <th className="px-6 py-2.5 font-medium">Order</th>
                    <th className="px-6 py-2.5 font-medium">Buyer</th>
                    <th className="px-6 py-2.5 font-medium">Material</th>
                    <th className="px-6 py-2.5 font-medium">Total</th>
                    <th className="px-6 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                      <td className="px-6 py-3">
                        <Link to={`/seller/orders/${o.id}`} className="font-mono-data text-copper-600 hover:underline">{o.id}</Link>
                      </td>
                      <td className="px-6 py-3 text-ink-700">{o.buyerCompany}</td>
                      <td className="max-w-[200px] truncate px-6 py-3 text-ink-700">{o.productName}</td>
                      <td className="px-6 py-3 font-mono-data text-ink-900">{formatCurrency(o.total)}</td>
                      <td className="px-6 py-3"><Badge variant={STATUS_TONE[o.status]}>{o.status}</Badge></td>
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
