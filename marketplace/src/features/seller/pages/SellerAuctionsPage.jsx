import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gavel, Plus, Users, TrendingUp, Radio } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuctionStatusBadge, LiveAuctionBadge } from '@/components/auction/AuctionStatusBadge'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { useAuth } from '@/hooks/useAuth'
import { auctionService } from '@/services/auction.service'
import { formatCurrency } from '@/lib/utils'
import { AUCTION_STATUS } from '@/data/auctionConstants'

const TABS = ['All', 'Draft', 'Pending approval', 'Scheduled', 'Live', 'Completed', 'Reserve not met', 'Cancelled']
const TAB_TO_STATUS = {
  Draft: AUCTION_STATUS.DRAFT,
  'Pending approval': AUCTION_STATUS.PENDING_APPROVAL,
  Scheduled: AUCTION_STATUS.SCHEDULED,
  Live: AUCTION_STATUS.LIVE,
  Completed: AUCTION_STATUS.COMPLETED,
  'Reserve not met': AUCTION_STATUS.RESERVE_NOT_MET,
  Cancelled: AUCTION_STATUS.CANCELLED,
}

export default function SellerAuctionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState(null)
  const [tab, setTab] = useState('All')

  function reload() {
    auctionService.listAuctions({ sellerId: user.sellerId }).then(setAuctions)
  }

  useEffect(reload, [user.sellerId])
  useEffect(() => {
    const handler = () => reload()
    auctionService.bus.addEventListener('changed', handler)
    return () => auctionService.bus.removeEventListener('changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!auctions) return []
    if (tab === 'All') return auctions
    return auctions.filter((a) => a.status === TAB_TO_STATUS[tab])
  }, [auctions, tab])

  const stats = useMemo(() => {
    const rows = auctions || []
    const live = rows.filter((a) => a.status === AUCTION_STATUS.LIVE).length
    const totalBidders = new Set(rows.flatMap((a) => a.bidderIds || [])).size
    const revenue = rows
      .filter((a) => a.status === AUCTION_STATUS.COMPLETED && a.winningBid)
      .reduce((sum, a) => sum + (a.pricingUnit === 'per_lot' ? a.winningBid : a.winningBid * a.lotQuantity), 0)
    return { total: rows.length, live, totalBidders, revenue }
  }, [auctions])

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={Gavel}
        eyebrow="Bidding & Auctions"
        title="Your auctions"
        subtitle="Track every live, upcoming, and completed lot in one place."
        actions={
          <Button variant="copper" onClick={() => navigate('/seller/products/new')}>
            <Plus className="size-4" /> New auction listing
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total auctions" value={stats.total} icon={Gavel} />
        <StatCard label="Live now" value={stats.live} icon={Radio} tone="copper" />
        <StatCard label="Unique bidders" value={stats.totalBidders} icon={Users} tone="verdigris" />
        <StatCard label="Auction revenue" value={formatCurrency(stats.revenue, 'USD')} icon={TrendingUp} tone="outline" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList className="flex-wrap">{TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>
      </Tabs>

      {!auctions ? (
        <div className="space-y-2.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions here" description="Create an auction listing to start receiving bids." actionLabel="New auction listing" onAction={() => navigate('/seller/products/new')} />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Lot</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Highest bid</th>
                  <th className="px-5 py-3 font-medium">Bids</th>
                  <th className="px-5 py-3 font-medium">Bidders</th>
                  <th className="px-5 py-3 font-medium">Ends</th>
                  <th className="px-5 py-3 font-medium">Winner</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="cursor-pointer border-b border-paper-200 last:border-0 hover:bg-paper-100" onClick={() => navigate(`/seller/auctions/${a.id}`)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage materialId={a.product?.materialId} imageUrl={a.product?.images?.primary?.dataUrl} className="size-11 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <Link to={`/seller/auctions/${a.id}`} onClick={(e) => e.stopPropagation()} className="block max-w-[220px] truncate text-sm font-medium text-ink-900 hover:text-copper-600">
                            {a.product?.name}
                          </Link>
                          <p className="text-xs text-ink-500">{a.lotQuantity.toLocaleString()} {a.lotUnit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {a.status === AUCTION_STATUS.LIVE ? <LiveAuctionBadge /> : <AuctionStatusBadge status={a.status} />}
                    </td>
                    <td className="px-5 py-3 font-mono-data text-ink-900">{formatCurrency(a.currentBid, a.currency)}</td>
                    <td className="px-5 py-3 text-ink-700">{a.bidCount || 0}</td>
                    <td className="px-5 py-3 text-ink-700">{(a.bidderIds || []).length}</td>
                    <td className="px-5 py-3 text-ink-700">
                      {a.status === AUCTION_STATUS.LIVE ? <CountdownTimer endAt={a.endAt} startAt={a.startAt} /> : a.endAt ? new Date(a.endAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-700">{a.winnerId ? (a.winnerId === 'usr_buyer_1' ? 'Meridian Metals Trading LLC' : a.winnerId) : '—'}</td>
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
