import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Star, Gavel, Users } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import { ListingTypeFlag } from '@/components/shared/ListingTypeFlag'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { cn, formatPrice, formatCurrency } from '@/lib/utils'
import { AUCTION_TYPES, LISTING_TYPES, AUCTION_STATUS } from '@/data/auctionConstants'
import { auctionService } from '@/services/auction.service'

/**
 * A single product tile used across the Marketplace grid, Wishlist, and
 * "related products" strips. Every listing carries a clear ListingTypeFlag
 * (Fixed Price / Accepting Offers / Live Auction / Auction + Buy Now), and
 * auction-type listings get the same live richness as the dedicated
 * auction grid — live current bid, bid count, and a countdown — rather
 * than a static "starting bid" number.
 */
export function ProductCard({ product, auction: auctionProp, wishlisted, onToggleWishlist, onAddToCart }) {
  const material = getMaterial(product.materialId)
  const seller = getSeller(product.sellerId)
  const isAuctionType = AUCTION_TYPES.has(product.listingType)

  const [auction, setAuction] = useState(auctionProp || null)

  useEffect(() => {
    if (auctionProp) { setAuction(auctionProp); return }
    if (!isAuctionType) return
    let cancelled = false
    function reload() {
      auctionService.getAuctionByProduct(product.id).then((a) => { if (!cancelled) setAuction(a) })
    }
    reload()
    auctionService.bus.addEventListener('changed', reload)
    return () => { cancelled = true; auctionService.bus.removeEventListener('changed', reload) }
  }, [auctionProp, isAuctionType, product.id])

  const isLive = auction?.status === AUCTION_STATUS.LIVE
  const isOpenOffers = product.listingType === LISTING_TYPES.ACCEPT_BIDS

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-copper-300/60 hover:shadow-lg">
      <Link to={`/buyer/marketplace/${product.id}`} className="relative block overflow-hidden">
        <ProductImage materialId={product.materialId} imageUrl={product.images?.primary?.dataUrl} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onToggleWishlist?.(product.id)
          }}
          className={cn(
            'absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white',
            wishlisted ? 'text-signal-down' : 'text-ink-500'
          )}
          aria-label="Toggle wishlist"
        >
          <Heart className={cn('size-4', wishlisted && 'fill-current')} />
        </button>
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          <ListingTypeFlag listingType={product.listingType} auctionLive={isAuctionType ? isLive : undefined} />
          {product.featured && <Badge variant="copper">Featured</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: material?.swatch }} />
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{material?.label}</span>
        </div>
        <Link to={`/buyer/marketplace/${product.id}`}>
          <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-ink-900 hover:text-copper-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="size-3" />
          {product.location}
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-ink-500">
          <Star className="size-3 fill-copper-400 text-copper-400" />
          {seller?.rating} · {seller?.companyName}
        </div>

        {isAuctionType ? (
          <>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-ink-500">
                  {isOpenOffers ? (auction?.bidCount > 0 ? 'Highest offer' : 'Open for offers') : (auction?.bidCount > 0 ? 'Current bid' : 'Starting bid')}
                </p>
                <p className="font-mono-data text-lg font-semibold text-ink-900">
                  {formatCurrency(auction?.currentBid ?? product.price, product.currency)}
                  <span className="text-xs font-normal text-ink-500">/{product.unit}</span>
                </p>
                {auction ? (
                  <p className="flex items-center gap-1 text-[11px] text-ink-300">
                    <Users className="size-3" /> {auction.bidCount || 0} {isOpenOffers ? 'offer' : 'bid'}{auction.bidCount === 1 ? '' : 's'}
                    {product.listingType === LISTING_TYPES.AUCTION_BUYNOW && auction.buyNowPrice && (
                      <span className="ml-1 text-copper-600">· Buy now {formatCurrency(auction.buyNowPrice, product.currency)}</span>
                    )}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-[11px] text-ink-300"><Gavel className="size-3" /> Loading…</p>
                )}
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/buyer/marketplace/${product.id}`}>{isOpenOffers ? 'Make offer' : 'View auction'}</Link>
              </Button>
            </div>
            <div className="mt-2.5 border-t border-paper-200 pt-2">
              {isOpenOffers ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-verdigris-600">
                  <span className="size-1.5 rounded-full bg-verdigris-500" /> No deadline — seller accepts anytime
                </span>
              ) : auction ? (
                <CountdownTimer endAt={auction.endAt} startAt={auction.startAt} className="text-xs" />
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-mono-data text-lg font-semibold text-ink-900">
                ${formatPrice(product.price)}
                <span className="text-xs font-normal text-ink-500">/{product.unit}</span>
              </p>
              <p className="text-[11px] text-ink-300">MOQ {product.minOrderQty.toLocaleString()} {product.unit}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAddToCart?.(product.id)}>
              Add to cart
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
