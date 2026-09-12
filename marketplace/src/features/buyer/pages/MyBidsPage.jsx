import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Clock } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { useAuth } from '@/hooks/useAuth'
import { auctionService } from '@/services/auction.service'
import { formatCurrency } from '@/lib/utils'
import { AUCTION_STATUS } from '@/data/auctionConstants'

const STATUS_META = {
  winning: { label: 'Winning', tone: 'success' },
  outbid: { label: 'Outbid', tone: 'warning' },
  won: { label: 'Won', tone: 'success' },
  lost: { label: 'Lost', tone: 'outline' },
  active: { label: 'Active', tone: 'default' },
}

const FILTERS = ['All', 'Active bids', 'Winning', 'Outbid', 'Won', 'Lost']

export default function MyBidsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('All')

  function reload() {
    auctionService.listBidsForBuyer(user.id).then(setRows)
  }

  useEffect(reload, [user.id])
  useEffect(() => {
    const handler = () => reload()
    auctionService.bus.addEventListener('changed', handler)
    const interval = setInterval(reload, 4000)
    return () => {
      auctionService.bus.removeEventListener('changed', handler)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = (rows || []).filter((r) => {
    if (filter === 'All') return true
    if (filter === 'Active bids') return r.auction?.status === AUCTION_STATUS.LIVE
    if (filter === 'Winning') return r.status === 'winning'
    if (filter === 'Outbid') return r.status === 'outbid'
    if (filter === 'Won') return r.status === 'won'
    if (filter === 'Lost') return r.status === 'lost'
    return true
  })

  const endingSoon = (rows || []).filter((r) => {
    if (!r.auction || r.auction.status !== AUCTION_STATUS.LIVE || !r.auction.endAt) return false
    const ms = new Date(r.auction.endAt).getTime() - Date.now()
    return ms > 0 && ms < 3 * 3600000
  })

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={Gavel}
        eyebrow="Bidding & Auctions"
        title="My Bids"
        subtitle="Every auction you've bid on, live status included — no refresh needed."
      />

      {endingSoon.length > 0 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-signal-down/30 bg-signal-down/5 p-4 text-sm text-signal-down">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{endingSoon.length} auction{endingSoon.length === 1 ? '' : 's'} ending soon</strong> — {endingSoon.map((r) => r.auction.product?.name).filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>{FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}</TabsList>
      </Tabs>

      {!rows ? (
        <div className="space-y-2.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Gavel} title="No bids here" description="Bids you place on auction listings will show up here." actionLabel="Browse auctions" onAction={() => (window.location.href = '/buyer/auctions')} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((row) => {
            const product = row.auction?.product
            if (!product || !row.auction) return null
            const meta = STATUS_META[row.status] || { label: row.status, tone: 'default' }
            return (
              <Link
                key={row.auctionId}
                to={`/buyer/marketplace/${product.id}`}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-paper-300 bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductImage materialId={product.materialId} imageUrl={product.images?.primary?.dataUrl} className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{product.name}</p>
                    <p className="text-xs text-ink-500">Your bid: <span className="font-mono-data font-medium text-ink-700">{formatCurrency(row.maxAmount ?? row.amount, row.auction.currency)}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-ink-500">Current bid</p>
                    <p className="font-mono-data text-sm font-semibold text-ink-900">{formatCurrency(row.auction.currentBid, row.auction.currency)}</p>
                  </div>
                  <CountdownTimer endAt={row.auction.endAt} startAt={row.auction.startAt} className="hidden md:inline-flex" />
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
