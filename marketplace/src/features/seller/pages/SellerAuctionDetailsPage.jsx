import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, XCircle, ShieldAlert, CheckCircle2, Gavel } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { ProductImage } from '@/components/shared/ProductImage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AuctionStatusBadge, LiveAuctionBadge } from '@/components/auction/AuctionStatusBadge'
import { CountdownTimer } from '@/components/auction/CountdownTimer'
import { AuctionPricePanel } from '@/components/auction/AuctionPricePanel'
import { useLiveAuction, useLiveBidHistory } from '@/hooks/useAuctionRealtime'
import { auctionService } from '@/services/auction.service'
import { formatCurrency } from '@/lib/utils'
import { AUCTION_STATUS, LISTING_TYPES, LISTING_TYPE_LABEL } from '@/data/auctionConstants'

export default function SellerAuctionDetailsPage() {
  const { auctionId } = useParams()
  const navigate = useNavigate()
  const { auction, loading, reload } = useLiveAuction({ auctionId })
  const { bids } = useLiveBidHistory(auctionId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <DashboardShell showSearch={false}>
        <p className="text-sm text-ink-500">Loading…</p>
      </DashboardShell>
    )
  }

  if (!auction) {
    return (
      <DashboardShell showSearch={false}>
        <p className="text-sm text-ink-500">Auction not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/seller/auctions')}>Back to auctions</Button>
      </DashboardShell>
    )
  }

  const product = auction.product

  async function handleCancel() {
    setBusy(true)
    try {
      await auctionService.cancelAuction(auction.id, cancelReason, 'seller')
      toast.success('Auction cancelled')
      setCancelOpen(false)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAcceptReserve() {
    setBusy(true)
    try {
      await auctionService.acceptReserveNotMet(auction.id)
      toast.success('Accepted highest bid — order created')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAcceptOffer(buyerId) {
    setBusy(true)
    try {
      await auctionService.acceptOfferBid(auction.id, buyerId)
      toast.success('Offer accepted — order created')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const canCancel = ![AUCTION_STATUS.COMPLETED, AUCTION_STATUS.CANCELLED].includes(auction.status)
  const canEdit = ![AUCTION_STATUS.COMPLETED, AUCTION_STATUS.CANCELLED].includes(auction.status)

  return (
    <DashboardShell showSearch={false}>
      <Link to="/seller/auctions" className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to auctions
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProductImage materialId={product?.materialId} imageUrl={product?.images?.primary?.dataUrl} className="size-16 shrink-0 rounded-lg" />
          <div>
            <div className="flex items-center gap-2">
              {auction.status === AUCTION_STATUS.LIVE ? <LiveAuctionBadge /> : <AuctionStatusBadge status={auction.status} />}
              <span className="text-xs text-ink-500">{LISTING_TYPE_LABEL[auction.listingType]}</span>
            </div>
            <h1 className="mt-1 font-display text-xl font-semibold text-ink-900">{product?.name}</h1>
            <p className="text-xs text-ink-500">{auction.id} · {auction.lotQuantity.toLocaleString()} {auction.lotUnit} lot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/seller/products/${product.id}/edit`)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" className="text-signal-down hover:bg-signal-down/10" onClick={() => setCancelOpen(true)}>
              <XCircle className="size-3.5" /> Cancel auction
            </Button>
          )}
        </div>
      </div>

      {auction.status === AUCTION_STATUS.CANCELLED && auction.cancelReason && (
        <div className="mb-5 rounded-[var(--radius-md)] border border-signal-down/30 bg-signal-down/5 p-3.5 text-sm text-signal-down">
          Cancelled: {auction.cancelReason}
        </div>
      )}

      {auction.status === AUCTION_STATUS.RESERVE_NOT_MET && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-signal-warn/30 bg-signal-warn/5 p-4">
          <div className="flex items-start gap-2.5 text-sm text-signal-warn">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>Auction ended at {formatCurrency(auction.currentBid, auction.currency)}, below your reserve of {formatCurrency(auction.reservePrice, auction.currency)}. You can accept the highest bid anyway or leave it unsold.</p>
          </div>
          <Button variant="copper" size="sm" onClick={handleAcceptReserve} loading={busy}>
            <CheckCircle2 className="size-3.5" /> Accept highest bid anyway
          </Button>
        </div>
      )}

      {auction.status === AUCTION_STATUS.COMPLETED && auction.winnerId && (
        <div className="mb-5 rounded-[var(--radius-md)] border border-signal-up/30 bg-signal-up/5 p-4 text-sm text-signal-up">
          Sold for {formatCurrency(auction.winningBid, auction.currency)} · Order {auction.orderId || 'created'} — payment pending from the buyer.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          {auction.status === AUCTION_STATUS.LIVE && (
            <Card>
              <CardContent className="p-4">
                <CountdownTimer endAt={auction.endAt} startAt={auction.startAt} size="lg" />
              </CardContent>
            </Card>
          )}
          <AuctionPricePanel auction={auction} />

          <Card>
            <CardHeader><CardTitle className="text-sm">Listing terms</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-500">
              <p><span className="font-medium text-ink-700">Payment terms:</span> {auction.paymentTerms}</p>
              <p><span className="font-medium text-ink-700">Pickup/delivery:</span> {(auction.pickupOptions || []).join(', ') || '—'}</p>
              <p><span className="font-medium text-ink-700">Inspection:</span> {auction.inspectionRequirements || '—'}</p>
              <p><span className="font-medium text-ink-700">Visibility:</span> {auction.visibility?.replace(/_/g, ' ')}</p>
              <p><span className="font-medium text-ink-700">Min. qty for bidding:</span> {auction.minQtyForBidding.toLocaleString()} {auction.lotUnit}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink-900"><Gavel className="size-4" /> Bid history</h2>
            <span className="text-xs text-ink-500">Real names visible to you as the seller</span>
          </div>
          {auction.listingType === LISTING_TYPES.ACCEPT_BIDS && auction.status === AUCTION_STATUS.LIVE && bids.length > 0 && (
            <p className="text-xs text-ink-500">This is an open Accept-Bids listing — pick any bid below to accept and create an order.</p>
          )}
          <div className="divide-y divide-paper-200 overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
            {bids.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No bids yet.</p>}
            {bids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{bid.buyerName}</p>
                  <p className="text-[11px] text-ink-300">{new Date(bid.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-data font-semibold text-ink-900">{formatCurrency(bid.amount, auction.currency)}</span>
                  {auction.listingType === LISTING_TYPES.ACCEPT_BIDS && auction.status === AUCTION_STATUS.LIVE && (
                    <Button size="sm" variant="copper" onClick={() => handleAcceptOffer(bid.buyerId)} loading={busy}>Accept</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this auction?</DialogTitle>
            <DialogDescription>Bidders will be notified. This can't be undone.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (shown to bidders)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep auction</Button>
            <Button variant="destructive" onClick={handleCancel} loading={busy}>Cancel auction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
