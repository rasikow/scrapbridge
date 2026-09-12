import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Download, RotateCcw, ClipboardList, Tag, HandCoins, Gavel } from 'lucide-react'
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
import { useCart } from '@/hooks/useCart'
import { orderService } from '@/services/order.service'
import { STATUS_TONE } from '@/data/orderStatus'
import { LISTING_TYPES } from '@/data/auctionConstants'
import { formatCurrency } from '@/lib/utils'
import { downloadInvoice } from '@/lib/documents'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const SALE_TYPE_TABS = [
  { value: 'all', label: 'All', icon: null },
  { value: LISTING_TYPES.FIXED, label: 'Fixed', icon: Tag },
  { value: LISTING_TYPES.ACCEPT_BIDS, label: 'Bid', icon: HandCoins },
  { value: 'auction_group', label: 'Auction', icon: Gavel },
]

// "Processing" groups Approved + Processing + Packed for a simpler filter bar.
function matchesFilter(status, filter) {
  if (filter === 'All') return true
  if (filter === 'Processing') return ['Approved', 'Processing', 'Packed'].includes(status)
  return status === filter
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('All')
  const [saleType, setSaleType] = useState('all')

  useEffect(() => {
    orderService.listOrders(user.id).then(setOrders)
  }, [user.id])

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

  function repeatOrder(order) {
    addItem(order.productId, order.quantity)
    toast.success('Added to cart', { description: `${order.productName} · ${order.quantity.toLocaleString()} ${order.unit}` })
    navigate('/buyer/cart')
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={ClipboardList}
        eyebrow="Order management"
        title="Your orders"
        subtitle="Track every purchase from confirmation through delivery, in one place."
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
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f}>{f}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!orders ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders here"
          description="Orders you place from the marketplace will show up in this list."
          actionLabel="Browse marketplace"
          onAction={() => navigate('/buyer/marketplace')}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
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
                      <Link to={`/buyer/orders/${o.id}`} className="font-mono-data text-copper-600 hover:underline">
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3"><ListingTypeFlag listingType={o.listingType || 'fixed'} className="px-2 py-0.5" /></td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-ink-700">{o.productName}</td>
                    <td className="px-5 py-3 font-mono-data text-ink-700">{o.quantity.toLocaleString()} {o.unit}</td>
                    <td className="px-5 py-3 font-mono-data font-medium text-ink-900">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3 text-ink-500">{new Date(o.placedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_TONE[o.status]}>{o.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => downloadInvoice(o)} title="Download invoice">
                          <Download className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => repeatOrder(o)} title="Repeat order">
                          <RotateCcw className="size-3.5" />
                        </Button>
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
