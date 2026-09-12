import { Users, Gavel, ShieldCheck, ShieldAlert, Package } from 'lucide-react'
import { minNextBid, estimatedLotValue, formatUnitLabel } from '@/lib/auctionEngine'
import { formatCurrency } from '@/lib/utils'

export function AuctionPricePanel({ auction, tiers }) {
  if (!auction) return null
  const nextMin = minNextBid(auction, tiers)
  const lotValue = estimatedLotValue(auction)
  const unitLabel = formatUnitLabel(auction)

  return (
    <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-500">{auction.bidCount > 0 ? 'Current highest bid' : 'Starting bid'}</p>
          <p className="mt-0.5 font-mono-data text-2xl font-semibold text-ink-900">
            {formatCurrency(auction.currentBid, auction.currency)}
            <span className="text-sm font-normal text-ink-500"> {unitLabel}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-ink-500">Est. lot value</p>
          <p className="mt-0.5 font-mono-data text-lg font-semibold text-copper-600">{formatCurrency(lotValue, auction.currency)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-[var(--radius-sm)] bg-paper-100 px-2.5 py-2">
          <p className="text-ink-500">Starting price</p>
          <p className="mt-0.5 font-mono-data font-medium text-ink-900">{formatCurrency(auction.startingBid, auction.currency)} {unitLabel}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-paper-100 px-2.5 py-2">
          <p className="text-ink-500">Minimum next bid</p>
          <p className="mt-0.5 font-mono-data font-medium text-ink-900">{formatCurrency(nextMin, auction.currency)} {unitLabel}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
        <span className="flex items-center gap-1"><Gavel className="size-3.5" /> {auction.bidCount || 0} bid{auction.bidCount === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><Users className="size-3.5" /> {(auction.bidderIds || []).length} bidder{(auction.bidderIds || []).length === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><Package className="size-3.5" /> {auction.lotQuantity.toLocaleString()} {auction.lotUnit} lot</span>
      </div>

      {auction.reservePrice != null && (
        <div className={`mt-3 flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs font-medium ${auction.reserveMet ? 'bg-signal-up/10 text-signal-up' : 'bg-signal-warn/10 text-signal-warn'}`}>
          {auction.reserveMet ? <ShieldCheck className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
          {auction.reserveMet ? 'Reserve price met' : 'Reserve price not yet met'}
        </div>
      )}
    </div>
  )
}
