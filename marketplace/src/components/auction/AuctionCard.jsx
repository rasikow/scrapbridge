import { Link } from 'react-router-dom'
import { MapPin, Users, Flame, TrendingUp, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { ProductImage } from '@/components/shared/ProductImage'
import { ListingTypeFlag } from '@/components/shared/ListingTypeFlag'
import { AuctionStatusBadge } from '@/components/auction/AuctionStatusBadge'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { CircularCountdownRing } from '@/components/auction/CircularCountdownRing'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { AUCTION_STATUS, LISTING_TYPES } from '@/data/auctionConstants'
import { timeRemainingMs } from '@/lib/auctionEngine'
import { formatCurrency, cn } from '@/lib/utils'

export function AuctionCard({ auction }) {
  const product = auction.product
  if (!product) return null
  const material = getMaterial(product.materialId)
  const seller = getSeller(auction.sellerId || product.sellerId)
  const isLive = auction.status === AUCTION_STATUS.LIVE
  const isOpenOffers = auction.listingType === LISTING_TYPES.ACCEPT_BIDS
  const ms = isLive ? timeRemainingMs(auction.endAt) : null
  const endingSoon = ms != null && ms > 0 && ms < 24 * 3600000
  const isHot = isLive && (auction.bidCount || 0) >= 4
  const priceGainPct = auction.startingBid > 0 && auction.currentBid > auction.startingBid
    ? Math.round(((auction.currentBid - auction.startingBid) / auction.startingBid) * 100)
    : 0

  return (
    <Link
      to={`/buyer/marketplace/${product.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
        isLive ? 'border-signal-down/30 hover:border-signal-down/50' : 'border-paper-300 hover:border-copper-300/60'
      )}
    >
      {isLive && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100"
          style={{ boxShadow: '0 0 0 2px rgba(220,38,38,0.25)' }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="relative overflow-hidden">
        <ProductImage materialId={product.materialId} imageUrl={product.images?.primary?.dataUrl} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          <ListingTypeFlag listingType={auction.listingType} auctionLive={isLive} />
          {!isLive && <AuctionStatusBadge status={auction.status} />}
          {isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-signal-down to-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <Flame className="size-3" /> Hot bidding
            </span>
          )}
        </div>
        {endingSoon && (
          <div className="absolute right-2.5 top-2.5">
            <CircularCountdownRing endAt={auction.endAt} startAt={auction.startAt} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: material?.swatch }} />
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{material?.label}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-ink-900 group-hover:text-copper-600">{product.name}</h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="size-3" /> {product.location}
        </div>
        {seller && <p className="mt-1 truncate text-[11px] text-ink-300">{seller.companyName}</p>}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-ink-500">
              {isOpenOffers ? (auction.bidCount > 0 ? 'Highest offer' : 'Open for offers') : (auction.bidCount > 0 ? 'Current bid' : 'Starting bid')}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="font-mono-data text-lg font-semibold text-ink-900">
                {formatCurrency(auction.currentBid, auction.currency)}
              </p>
              {priceGainPct > 0 && (
                <span className="flex items-center gap-0.5 rounded-full bg-signal-up/10 px-1.5 py-0.5 text-[10px] font-semibold text-signal-up">
                  <TrendingUp className="size-2.5" /> {priceGainPct}%
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-ink-300">
              <Users className="size-3" /> {auction.bidCount || 0} {isOpenOffers ? 'offer' : 'bid'}{auction.bidCount === 1 ? '' : 's'}
              {isLive && (
                <span className="ml-1.5 flex items-center gap-0.5">
                  <Eye className="size-3" /> {8 + ((auction.bidCount || 0) * 3) % 27} watching
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-paper-200 pt-2.5">
          {isOpenOffers ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-verdigris-600">
              <span className="size-1.5 rounded-full bg-verdigris-500" /> No deadline — seller accepts anytime
            </span>
          ) : (
            <CountdownTimer endAt={auction.endAt} startAt={auction.startAt} />
          )}
        </div>
      </div>
    </Link>
  )
}
