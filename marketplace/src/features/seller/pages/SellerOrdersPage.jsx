import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, X, Receipt, Tag, HandCoins, Gavel } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ListingTypeFlag } from '@/components/shared/ListingTypeFlag'
import { SegmentedTabs } from '@/components/shared/SegmentedTabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/order.service'
import { STATUS_TONE } from '@/data/orderStatus'
import { LISTING_TYPES } from '@/data/auctionConstants'
import { formatCurrency } from '@/lib/utils'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const SALE_TYPE_TABS = [
  { value: 'all', label: 'All', icon: null },
  { value: LISTING_TYPES.FIXED, label: 'Fixed', icon: Tag },
  { value: LISTING_TYPES.ACCEPT_BIDS, label: 'Bid', icon: HandCoins },
  { value: 'auction_group', label: 'Auction', icon: Gavel },
]

function matchesFilter(status, filter) {
  if (filter === 'All') return true
  if (filter === 'Processing') return ['Approved', 'Processing', 'Packed'].includes(status)
  return status === filter
}

export default function SellerOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('All')
  const [saleType, setSaleType] = useState('all')
  const [busyId, setBusyId] = useState(null)

  function reload() {
    orderService.listOrdersForSeller(user.sellerId).then(setOrders)
  }

  useEffect(reload, [user.sellerId])

  const saleTypeCounts = useMemo(() => {
    const items = orders || []
    return {
      all: items.length,
      [LISTING_TYPES.FIXED]: items.filter((o) => (o.listingType || 'fixed') === LISTING_TYPES.FIXED).length,
      [LISTING_TYPES.ACCEPT_BIDS]: items.filter((o) => o.listingType === LISTING_TYPES.ACCEPT_BIDS).length,
      auction_group: items.filter((o) => o.listingType === LISTING_TYPES.AUCTION || o.listingType === LISTING_TYPES.AUCTION_BUYNOW).length,
    }
  }, [orders])

  const filtered = useMemo(() => {
    let items = (orders || []).filter((o) => matchesFilter(o.status, filter))
    if (saleType === 'auction_group') items = items.filter((o) => o.listingType === LISTING_TYPES.AUCTION || o.listingType === LISTING_TYPES.AUCTION_BUYNOW)
    else if (saleType !== 'all') items = items.filter((o) => (o.listingType || 'fixed') === saleType)
    return items
  }, [orders, filter, saleType])

  async function accept(order) {
    setBusyId(order.id)
    const updated = await orderService.acceptOrder(order.id)
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
    setBusyId(null)
    toast.success(`${order.id} accepted`)
  }

  async function reject(order) {
    setBusyId(order.id)
    const updated = await orderService.rejectOrder(order.id, 'Rejected by seller.')
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
    setBusyId(null)
    toast.success(`${order.id} rejected`)
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={Receipt}
        eyebrow="Order fulfillment"
        title="Orders received"
        subtitle="Approve, ship, and track every order buyers place with you."
      />

      <div className="mb-4">
        <SegmentedTabs
          value={saleType}
          onChange={setSaleType}
          options={SALE_TYPE_TABS.map((t) => ({ ...t, count: saleTypeCounts[t.value] }))}
        />
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>
          {FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {!orders ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders here" description="Orders placed against your listings will show up in this list." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Placed</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                    <td className="px-5 py-3">
                      <Link to={`/seller/orders/${o.id}`} className="font-mono-data text-copper-600 hover:underline">{o.id}</Link>
                    </td>
                    <td className="px-5 py-3"><ListingTypeFlag listingType={o.listingType || 'fixed'} className="px-2 py-0.5" /></td>
                    <td className="px-5 py-3 text-ink-700">{o.buyerCompany}</td>
                    <td className="max-w-[180px] truncate px-5 py-3 text-ink-700">{o.productName}</td>
                    <td className="px-5 py-3 font-mono-data font-medium text-ink-900">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3 text-ink-500">{new Date(o.placedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><Badge variant={STATUS_TONE[o.status]}>{o.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === 'Pending' ? (
                          <>
                            <Button size="sm" variant="copper" onClick={() => accept(o)} loading={busyId === o.id}>
                              <Check className="size-3.5" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => reject(o)} disabled={busyId === o.id}>
                              <X className="size-3.5" /> Reject
                            </Button>
                          </>
                        ) : (
                          <Link to={`/seller/orders/${o.id}`}>
                            <Button size="sm" variant="outline">Manage</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
