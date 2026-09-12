import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Gavel, Check, X, Pause, Play, Search, ShieldAlert, Settings2 } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AuctionStatusBadge, LiveAuctionBadge } from '@/components/auction/AuctionStatusBadge'
import { BidHistoryList } from '@/components/auction/BidHistoryList'
import { auctionService } from '@/services/auction.service'
import { formatCurrency } from '@/lib/utils'
import { AUCTION_STATUS, AUCTION_STATUS_LABEL, DEFAULT_INCREMENT_TIERS } from '@/data/auctionConstants'

const FILTERS = ['All', ...Object.values(AUCTION_STATUS).map((s) => AUCTION_STATUS_LABEL[s])]
const LABEL_TO_STATUS = Object.fromEntries(Object.values(AUCTION_STATUS).map((s) => [AUCTION_STATUS_LABEL[s], s]))

export default function AuctionManagementPage() {
  const [auctions, setAuctions] = useState(null)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [detailTarget, setDetailTarget] = useState(null)
  const [detailBids, setDetailBids] = useState([])
  const [suspicious, setSuspicious] = useState([])
  const [tiersOpen, setTiersOpen] = useState(false)
  const [tiers, setTiers] = useState(DEFAULT_INCREMENT_TIERS)

  function reload() {
    auctionService.listAllForAdmin({ status: filter === 'All' ? undefined : LABEL_TO_STATUS[filter], query: query || undefined }).then(setAuctions)
  }

  useEffect(reload, [filter, query])
  useEffect(() => { auctionService.listSuspiciousActivity().then(setSuspicious) }, [auctions])
  useEffect(() => { auctionService.getIncrementTiers().then(setTiers) }, [])

  useEffect(() => {
    if (!detailTarget) return
    auctionService.listBidsForAuction(detailTarget.id).then(setDetailBids)
  }, [detailTarget])

  async function approve(auction) {
    setBusyId(auction.id)
    try {
      await auctionService.adminApproveAuction(auction.id)
      toast.success('Auction approved')
      reload()
    } catch (err) { toast.error(err.message) } finally { setBusyId(null) }
  }

  async function confirmReject() {
    setBusyId(rejectTarget.id)
    try {
      await auctionService.adminRejectAuction(rejectTarget.id, reason)
      toast.success('Auction rejected')
      reload()
    } catch (err) { toast.error(err.message) } finally {
      setBusyId(null)
      setRejectTarget(null)
      setReason('')
    }
  }

  async function togglePause(auction) {
    setBusyId(auction.id)
    try {
      await auctionService.pauseAuction(auction.id, auction.status !== AUCTION_STATUS.PAUSED)
      toast.success(auction.status === AUCTION_STATUS.PAUSED ? 'Auction resumed' : 'Auction paused')
      reload()
    } catch (err) { toast.error(err.message) } finally { setBusyId(null) }
  }

  async function cancel(auction) {
    setBusyId(auction.id)
    try {
      await auctionService.cancelAuction(auction.id, 'Cancelled by admin.', 'admin')
      toast.success('Auction cancelled')
      reload()
    } catch (err) { toast.error(err.message) } finally { setBusyId(null) }
  }

  async function saveTiers() {
    await auctionService.setIncrementTiers(tiers)
    toast.success('Default bid increment tiers updated')
    setTiersOpen(false)
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={Gavel}
        eyebrow="Marketplace oversight"
        title="Auction management"
        subtitle="Approve, moderate, and monitor every live and pending auction."
        actions={
          <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setTiersOpen(true)}>
            <Settings2 className="size-4" /> Bid increment tiers
          </Button>
        }
      />

      {suspicious.length > 0 && (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-signal-down/30 bg-signal-down/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-signal-down"><ShieldAlert className="size-4" /> {suspicious.length} auction{suspicious.length === 1 ? '' : 's'} flagged for review</p>
          <ul className="mt-2 space-y-1 text-xs text-signal-down">
            {suspicious.map((s, i) => (
              <li key={i}>{s.product || s.auctionId} — {s.buyerName} — {s.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap">{FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}</TabsList>
        </Tabs>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input placeholder="Search by lot or auction ID…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {!auctions ? (
        <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : auctions.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions found" description="Try a different filter." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Lot</th>
                  <th className="px-5 py-3 font-medium">Seller</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Highest bid</th>
                  <th className="px-5 py-3 font-medium">Bids</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                    <td className="px-5 py-3">
                      <button onClick={() => setDetailTarget(a)} className="flex items-center gap-3 text-left">
                        <ProductImage materialId={a.product?.materialId} imageUrl={a.product?.images?.primary?.dataUrl} className="size-11 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate text-sm font-medium text-ink-900 hover:text-copper-600">{a.product?.name}</p>
                          <p className="text-xs text-ink-500">{a.id}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{a.seller?.companyName}</td>
                    <td className="px-5 py-3">{a.status === AUCTION_STATUS.LIVE ? <LiveAuctionBadge /> : <AuctionStatusBadge status={a.status} />}</td>
                    <td className="px-5 py-3 font-mono-data text-ink-900">{formatCurrency(a.currentBid, a.currency)}</td>
                    <td className="px-5 py-3 text-ink-700">{a.bidCount || 0}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === AUCTION_STATUS.PENDING_APPROVAL && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => approve(a)} disabled={busyId === a.id} title="Approve" className="hover:text-signal-up">
                              <Check className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setRejectTarget(a)} title="Reject" className="hover:text-signal-down">
                              <X className="size-3.5" />
                            </Button>
                          </>
                        )}
                        {[AUCTION_STATUS.LIVE, AUCTION_STATUS.PAUSED].includes(a.status) && (
                          <Button variant="ghost" size="sm" onClick={() => togglePause(a)} disabled={busyId === a.id} title={a.status === AUCTION_STATUS.PAUSED ? 'Resume' : 'Pause'}>
                            {a.status === AUCTION_STATUS.PAUSED ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                          </Button>
                        )}
                        {![AUCTION_STATUS.COMPLETED, AUCTION_STATUS.CANCELLED].includes(a.status) && (
                          <Button variant="ghost" size="sm" onClick={() => cancel(a)} disabled={busyId === a.id} title="Cancel" className="hover:text-signal-down">
                            <X className="size-3.5" />
                          </Button>
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

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this auction?</DialogTitle>
            <DialogDescription>The seller will be notified with your reason.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} loading={busyId === rejectTarget?.id}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{detailTarget?.product?.name}</DialogTitle>
            <DialogDescription>{detailTarget?.id} · Seller: {detailTarget?.seller?.companyName}</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <BidHistoryList auction={detailTarget} bids={detailBids} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tiersOpen} onOpenChange={setTiersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Default bid increment tiers</DialogTitle>
            <DialogDescription>Applied whenever a seller doesn't set a custom increment for their auction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-32 text-ink-500">Up to {t.upTo === Infinity ? '∞' : t.upTo.toLocaleString()}</span>
                <Input
                  type="number" value={t.increment}
                  onChange={(e) => setTiers((prev) => prev.map((x, xi) => xi === i ? { ...x, increment: Number(e.target.value) } : x))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTiersOpen(false)}>Cancel</Button>
            <Button variant="copper" onClick={saveTiers}>Save tiers</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
