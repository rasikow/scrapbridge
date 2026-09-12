import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, UserCheck, Factory, PackageCheck, Package, Receipt, DollarSign, Gavel, ShieldAlert,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { WelcomeBanner } from '@/components/shared/WelcomeBanner'
import { StatCard } from '@/components/shared/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { adminService } from '@/services/admin.service'
import { productService } from '@/services/product.service'
import { orderService } from '@/services/order.service'
import { auctionService } from '@/services/auction.service'
import { getMaterial, MATERIAL_CATEGORIES } from '@/data/materials'
import { AUCTION_STATUS } from '@/data/auctionConstants'
import { formatCurrency } from '@/lib/utils'

const PIE_COLORS = MATERIAL_CATEGORIES.slice(0, 8).map((m) => m.swatch)

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

export default function AdminDashboardPage() {
  const [users, setUsers] = useState(null)
  const [products, setProducts] = useState(null)
  const [orders, setOrders] = useState(null)
  const [auctions, setAuctions] = useState(null)
  const [suspicious, setSuspicious] = useState([])

  useEffect(() => {
    adminService.listAllUsers().then(setUsers)
    productService.listAll().then(setProducts)
    orderService.listAllOrders().then(setOrders)
  }, [])

  useEffect(() => {
    function reload() {
      auctionService.listAllForAdmin().then(setAuctions)
      auctionService.listSuspiciousActivity().then(setSuspicious)
    }
    reload()
    auctionService.bus.addEventListener('changed', reload)
    const interval = setInterval(reload, 6000)
    return () => {
      auctionService.bus.removeEventListener('changed', reload)
      clearInterval(interval)
    }
  }, [])

  const stats = useMemo(() => {
    if (!users || !products || !orders) return null
    const buyers = users.filter((u) => u.role === 'buyer')
    const sellers = users.filter((u) => u.role === 'seller')
    const today = new Date().toDateString()
    return {
      totalBuyers: buyers.length,
      pendingBuyers: buyers.filter((u) => u.status === 'pending').length,
      totalSellers: sellers.length,
      pendingSellers: sellers.filter((u) => u.status === 'pending').length,
      totalProducts: products.length,
      pendingProducts: products.filter((p) => p.status === 'pending').length,
      ordersToday: orders.filter((o) => new Date(o.placedAt).toDateString() === today).length,
      totalRevenue: orders.filter((o) => o.status === 'Delivered').reduce((s, o) => s + o.total, 0),
    }
  }, [users, products, orders])

  const monthly = useMemo(() => buildMonthlyBuckets(orders || []), [orders])

  const userGrowth = useMemo(() => {
    if (!users) return []
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), buyers: 0, sellers: 0 })
    }
    users.forEach((u) => {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = months.find((m) => m.key === key)
      if (bucket && u.role === 'buyer') bucket.buyers += 1
      if (bucket && u.role === 'seller') bucket.sellers += 1
    })
    let cumB = 0, cumS = 0
    return months.map((m) => {
      cumB += m.buyers; cumS += m.sellers
      return { label: m.label, Buyers: cumB, Sellers: cumS }
    })
  }, [users])

  const categoryDistribution = useMemo(() => {
    if (!products) return []
    const byMaterial = {}
    products.forEach((p) => { byMaterial[p.materialId] = (byMaterial[p.materialId] || 0) + 1 })
    return Object.entries(byMaterial)
      .map(([materialId, count]) => ({ name: getMaterial(materialId)?.label || materialId, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [products])

  const auctionStats = useMemo(() => {
    const rows = auctions || []
    return {
      total: rows.length,
      live: rows.filter((a) => a.status === AUCTION_STATUS.LIVE).length,
      pendingApproval: rows.filter((a) => a.status === AUCTION_STATUS.PENDING_APPROVAL).length,
      gmv: rows
        .filter((a) => a.status === AUCTION_STATUS.COMPLETED && a.winningBid)
        .reduce((s, a) => s + (a.pricingUnit === 'per_lot' ? a.winningBid : a.winningBid * a.lotQuantity), 0),
    }
  }, [auctions])

  return (
    <DashboardShell showSearch={false}>
      <WelcomeBanner
        highlights={[
          { label: 'New sellers', value: stats ? stats.pendingSellers : '—' },
          { label: 'New buyers', value: stats ? stats.pendingBuyers : '—' },
          { label: "Today's orders", value: stats ? stats.ordersToday : '—' },
        ]}
      />

      {suspicious.length > 0 && (
        <Link to="/admin/auctions" className="mb-5 flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-signal-down/30 bg-signal-down/5 p-4 text-sm text-signal-down hover:bg-signal-down/10">
          <ShieldAlert className="size-4 shrink-0" />
          <p><strong>{suspicious.length} auction{suspicious.length === 1 ? '' : 's'}</strong> flagged for suspicious bidding activity — review in Auction Management.</p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Buyers" value={stats.totalBuyers} icon={Users} tone="default" />
            <Link to="/admin/approvals/buyers">
              <StatCard label="Pending Buyer Approvals" value={stats.pendingBuyers} icon={UserCheck} tone={stats.pendingBuyers > 0 ? 'copper' : 'outline'} />
            </Link>
            <StatCard label="Total Sellers" value={stats.totalSellers} icon={Factory} tone="default" />
            <Link to="/admin/approvals/sellers">
              <StatCard label="Pending Seller Approvals" value={stats.pendingSellers} icon={Factory} tone={stats.pendingSellers > 0 ? 'copper' : 'outline'} />
            </Link>
            <StatCard label="Total Products" value={stats.totalProducts} icon={Package} tone="default" />
            <Link to="/admin/approvals/products">
              <StatCard label="Pending Product Approvals" value={stats.pendingProducts} icon={PackageCheck} tone={stats.pendingProducts > 0 ? 'copper' : 'outline'} />
            </Link>
            <StatCard label="Orders Today" value={stats.ordersToday} icon={Receipt} tone="verdigris" />
            <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} tone="verdigris" />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!auctions ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Auctions" value={auctionStats.total} icon={Gavel} tone="default" />
            <StatCard label="Live Auctions" value={auctionStats.live} icon={Gavel} tone={auctionStats.live > 0 ? 'copper' : 'outline'} />
            <Link to="/admin/auctions">
              <StatCard label="Pending Auction Approvals" value={auctionStats.pendingApproval} icon={PackageCheck} tone={auctionStats.pendingApproval > 0 ? 'copper' : 'outline'} />
            </Link>
            <StatCard label="Auction GMV" value={formatCurrency(auctionStats.gmv)} icon={DollarSign} tone="verdigris" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly orders</CardTitle></CardHeader>
          <CardContent>
            {!orders ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={monthly} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#1E2761" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle><p className="text-sm text-ink-500">Delivered &amp; settled, last 6 months</p></CardHeader>
          <CardContent>
            {!orders ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={monthly} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#C1793F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User growth</CardTitle><p className="text-sm text-ink-500">Cumulative buyers &amp; sellers</p></CardHeader>
          <CardContent>
            {!users ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={userGrowth} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ebe6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667075' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Buyers" stroke="#1E2761" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Sellers" stroke="#C1793F" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Material distribution</CardTitle><p className="text-sm text-ink-500">Active listings by material category</p></CardHeader>
          <CardContent>
            {!products ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {categoryDistribution.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d8dbd3', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
