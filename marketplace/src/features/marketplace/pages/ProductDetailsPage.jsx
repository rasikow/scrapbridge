import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Heart, MapPin, Star, ShieldCheck, Clock, Package, Minus, Plus, MessageSquareText, ArrowLeft, Zap, Gavel,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { ProductGallery } from '@/components/shared/ProductGallery'
import { ProductCard } from '@/components/shared/ProductCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getProduct, getActiveProducts } from '@/data/products'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { recentlyViewedStore } from '@/services/repositories/mockCommerceRepository'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatPrice, formatCurrency } from '@/lib/utils'
import { AUCTION_TYPES, LISTING_TYPE_LABEL } from '@/data/auctionConstants'
import { useLiveAuction, useLiveBidHistory } from '@/hooks/useAuctionRealtime'
import { AuctionPricePanel } from '@/components/auction/AuctionPricePanel'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { AuctionStatusBadge } from '@/components/auction/AuctionStatusBadge'
import { ListingTypeFlag } from '@/components/shared/ListingTypeFlag'
import { BidHistoryList } from '@/components/auction/BidHistoryList'
import { PlaceBidDialog } from '@/components/auction/PlaceBidDialog'
import { auctionService } from '@/services/auction.service'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const product = getProduct(productId)
  const { addItem } = useCart()
  const { toggle: toggleWishlist, isWishlisted } = useWishlist()
  const [quantity, setQuantity] = useState(product?.minOrderQty || 1)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState('')
  const isAuctionListing = product && AUCTION_TYPES.has(product.listingType)
  const { auction } = useLiveAuction({ productId: isAuctionListing ? productId : null })
  const { bids } = useLiveBidHistory(auction?.id)
  const [bidDialogOpen, setBidDialogOpen] = useState(false)
  const [autoBid, setAutoBid] = useState(null)
  const [buyNowSubmitting, setBuyNowSubmitting] = useState(false)

  useEffect(() => {
    if (product) recentlyViewedStore.push(user.id, product.id)
  }, [product, user.id])

  useEffect(() => {
    if (auction) auctionService.getAutoBid(auction.id, user.id).then(setAutoBid)
  }, [auction, user.id])

  if (!product || product.status !== 'active') {
    return (
      <DashboardShell>
        <div className="py-20 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Product not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/buyer/marketplace')}>
            Back to marketplace
          </Button>
        </div>
      </DashboardShell>
    )
  }

  const material = getMaterial(product.materialId)
  const seller = getSeller(product.sellerId)
  const related = getActiveProducts().filter((p) => p.materialId === product.materialId && p.id !== product.id).slice(0, 3)
  const wishlisted = isWishlisted(product.id)

  async function handleBuyNow() {
    if (!auction) return
    setBuyNowSubmitting(true)
    try {
      await auctionService.placeBid(auction.id, user, { amount: auction.buyNowPrice, maxAmount: auction.buyNowPrice })
      toast.success('Buy Now purchase confirmed', { description: 'An order has been created — check My Bids or Orders.' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBuyNowSubmitting(false)
    }
  }

  function handleAddToCart() {
    addItem(product.id, quantity)
    toast.success(`Added ${quantity.toLocaleString()} ${product.unit} to cart`)
  }

  function submitQuote() {
    setQuoteOpen(false)
    toast.success('Quote request sent to seller', { description: `${seller.companyName} typically responds in ${seller.responseTime}.` })
    setQuoteMessage('')
  }

  return (
    <DashboardShell>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery product={product} />

        {/* Info */}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: material?.swatch }} />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{material?.label}</span>
            {product.featured && <Badge variant="copper">Featured</Badge>}
            {isAuctionListing ? (
              <>
                <ListingTypeFlag listingType={product.listingType} auctionLive={auction?.status === 'live'} />
                {auction && auction.status !== 'live' && <AuctionStatusBadge status={auction.status} />}
              </>
            ) : (
              <ListingTypeFlag listingType={product.listingType} />
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">{product.name}</h1>

          <div className="mt-2 flex items-center gap-4 text-sm text-ink-500">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {product.location}</span>
            <span className="flex items-center gap-1"><Star className="size-3.5 fill-copper-400 text-copper-400" /> {seller.rating} ({seller.reviewCount})</span>
          </div>

          {isAuctionListing ? (
            <div className="mt-4 space-y-3">
              {!auction ? (
                <p className="text-sm text-ink-500">Loading auction…</p>
              ) : (
                <>
                  <CountdownTimer endAt={auction.endAt} startAt={auction.startAt} size="lg" />
                  <AuctionPricePanel auction={auction} />

                  <div className="flex flex-wrap gap-2.5">
                    {auction.status === 'live' && (
                      <Button variant="copper" size="lg" onClick={() => setBidDialogOpen(true)}>
                        <Gavel className="size-4" /> Place bid
                      </Button>
                    )}
                    {auction.buyNowPrice != null && auction.status === 'live' && (
                      <Button variant="outline" size="lg" onClick={handleBuyNow} loading={buyNowSubmitting}>
                        <Zap className="size-4" /> Buy Now — {formatCurrency(auction.buyNowPrice, auction.currency)}
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="lg" onClick={() => toggleWishlist(product.id)}
                      className={cn(wishlisted && 'text-signal-down')}
                    >
                      <Heart className={cn('size-4', wishlisted && 'fill-current')} /> {wishlisted ? 'Saved' : 'Save'}
                    </Button>
                  </div>

                  {auction.status !== 'live' && (
                    <p className="text-sm text-ink-500">
                      {auction.status === 'scheduled' && 'This auction has not started yet — check back at the scheduled start time.'}
                      {auction.status === 'completed' && auction.winnerId === user.id && 'You won this auction! Complete payment from your Orders page.'}
                      {auction.status === 'completed' && auction.winnerId !== user.id && 'This auction has ended.'}
                      {auction.status === 'reserve_not_met' && 'This auction ended without meeting the seller\'s reserve price.'}
                      {auction.status === 'cancelled' && `This auction was cancelled. ${auction.cancelReason || ''}`}
                    </p>
                  )}

                  <p className="text-xs text-ink-500">{LISTING_TYPE_LABEL[product.listingType]} · Payment: {auction.paymentTerms} · {auction.pickupOptions?.join(', ')}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="mt-4 font-mono-data text-3xl font-semibold text-ink-900">
                ${formatPrice(product.price)}<span className="text-base font-normal text-ink-500">/{product.unit}</span>
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {product.quantity.toLocaleString()} {product.unit} available · MOQ {product.minOrderQty.toLocaleString()} {product.unit}
              </p>

              {/* Quantity + actions */}
              <div className="mt-5 flex items-center gap-3">
                <div className="flex items-center rounded-[var(--radius-sm)] border border-ink-300/40">
                  <button
                    className="p-2.5 text-ink-500 hover:text-ink-900 disabled:opacity-30"
                    disabled={quantity <= product.minOrderQty}
                    onClick={() => setQuantity((q) => Math.max(product.minOrderQty, q - product.minOrderQty))}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-20 text-center font-mono-data text-sm tabular-nums">{quantity.toLocaleString()}</span>
                  <button
                    className="p-2.5 text-ink-500 hover:text-ink-900"
                    onClick={() => setQuantity((q) => q + product.minOrderQty)}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <span className="text-xs text-ink-500">{product.unit}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button variant="copper" size="lg" onClick={handleAddToCart}>
                  Add to cart
                </Button>
                <Button variant="outline" size="lg" onClick={() => setQuoteOpen(true)}>
                  <MessageSquareText className="size-4" /> Request quote
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(wishlisted && 'text-signal-down')}
                >
                  <Heart className={cn('size-4', wishlisted && 'fill-current')} /> {wishlisted ? 'Saved' : 'Save'}
                </Button>
              </div>
            </>
          )}

          {/* Seller card */}
          <Card className="mt-6">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-graphite-900 text-sm font-semibold text-white">
                {seller.companyName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink-900">{seller.companyName}</p>
                  {seller.verified && <ShieldCheck className="size-3.5 shrink-0 text-verdigris-500" />}
                </div>
                <p className="text-xs text-ink-500">
                  {seller.location} · {seller.completedOrders.toLocaleString()} orders completed
                </p>
              </div>
              <div className="text-right text-xs text-ink-500">
                <p className="flex items-center justify-end gap-1"><Clock className="size-3" /> {seller.responseTime}</p>
                <p className="mt-1">Member since {seller.memberSince}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs: description / specs / seller / bids */}
      <Tabs defaultValue="description" className="mt-10">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="seller">Seller profile</TabsTrigger>
          {isAuctionListing && <TabsTrigger value="bids">Bid history</TabsTrigger>}
        </TabsList>

        <TabsContent value="description">
          <p className="max-w-3xl text-sm leading-relaxed text-ink-700">{product.description}</p>
        </TabsContent>

        <TabsContent value="specs">
          <div className="grid max-w-2xl grid-cols-1 divide-y divide-paper-300 rounded-[var(--radius-md)] border border-paper-300 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {[
              ['Material', material?.label],
              ['Grade', product.grade],
              ['Purity', product.purity || '—'],
              ['Available quantity', `${product.quantity.toLocaleString()} ${product.unit}`],
              ['Minimum order', `${product.minOrderQty.toLocaleString()} ${product.unit}`],
              ['Location', product.location],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-ink-500"><Package className="size-3.5" /> {k}</span>
                <span className="font-medium text-ink-900">{v}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seller">
          <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Rating', `${seller.rating} / 5`],
              ['Reviews', seller.reviewCount],
              ['Orders completed', seller.completedOrders.toLocaleString()],
              ['Avg. response', seller.responseTime],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[var(--radius-md)] border border-paper-300 p-3.5 text-center">
                <p className="font-mono-data text-lg font-semibold text-ink-900">{v}</p>
                <p className="mt-0.5 text-xs text-ink-500">{k}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {isAuctionListing && (
          <TabsContent value="bids">
            <div className="max-w-2xl">
              <BidHistoryList auction={auction} bids={bids} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {isAuctionListing && auction && (
        <PlaceBidDialog
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
          auction={auction}
          autoBid={autoBid}
          onPlaced={() => auctionService.getAutoBid(auction.id, user.id).then(setAutoBid)}
        />
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">More {material?.label}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={isWishlisted(p.id)}
                onToggleWishlist={toggleWishlist}
                onAddToCart={(id) => { addItem(id, 1); toast.success('Added to cart') }}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a quote</DialogTitle>
            <DialogDescription>
              Send {seller.companyName} your target quantity and terms for {product.name}.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="quoteMessage">Message to seller</Label>
            <Textarea
              id="quoteMessage"
              rows={4}
              placeholder={`e.g. Looking for ${product.minOrderQty.toLocaleString()} ${product.unit}/month on a recurring basis, delivered to Jebel Ali.`}
              value={quoteMessage}
              onChange={(e) => setQuoteMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>Cancel</Button>
            <Button variant="copper" onClick={submitQuote}>Send request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
