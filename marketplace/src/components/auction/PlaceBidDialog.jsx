import { useState } from 'react'
import { toast } from 'sonner'
import { Gavel, Zap, ShieldCheck } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { minNextBid } from '@/lib/auctionEngine'
import { AuctionValidationError } from '@/lib/auctionEngine'
import { useAuth } from '@/hooks/useAuth'
import { auctionService } from '@/services/auction.service'
import { formatCurrency } from '@/lib/utils'

export function PlaceBidDialog({ open, onOpenChange, auction, autoBid, onPlaced }) {
  const { user } = useAuth()
  const [mode, setMode] = useState('quick')
  const [amount, setAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!auction) return null
  const nextMin = minNextBid(auction)

  function reset() {
    setMode('quick')
    setAmount('')
    setMaxAmount('')
    setConfirming(false)
  }

  function handleOpenChange(next) {
    if (!next) reset()
    onOpenChange(next)
  }

  function bidAmountForMode() {
    if (mode === 'quick') return nextMin
    if (mode === 'custom') return Number(amount)
    return Number(amount) || nextMin // auto mode: the visible ask is at least the minimum
  }

  async function submit() {
    setSubmitting(true)
    try {
      const submittedAmount = mode === 'auto' ? nextMin : bidAmountForMode()
      const payload = { amount: submittedAmount }
      if (mode === 'auto') payload.maxAmount = Number(maxAmount)
      const updated = await auctionService.placeBid(auction.id, user, payload)
      toast.success('Bid placed', { description: `Leading bid is now ${formatCurrency(updated.currentBid, updated.currency)}.` })
      onPlaced?.(updated)
      handleOpenChange(false)
    } catch (err) {
      const message = err instanceof AuctionValidationError ? err.message : err.message || 'Could not place bid.'
      toast.error(message)
    } finally {
      setSubmitting(false)
      setConfirming(false)
    }
  }

  const previewAmount = mode === 'auto' ? Number(maxAmount) || 0 : bidAmountForMode()
  const validForConfirm = mode === 'auto' ? Number(maxAmount) >= nextMin : Number(previewAmount) >= nextMin

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a bid</DialogTitle>
          <DialogDescription>
            Minimum next bid is <strong>{formatCurrency(nextMin, auction.currency)}</strong> — {auction.bidCount || 0} bid{auction.bidCount === 1 ? '' : 's'} so far.
          </DialogDescription>
        </DialogHeader>

        {!confirming ? (
          <>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList>
                <TabsTrigger value="quick">Quick bid</TabsTrigger>
                <TabsTrigger value="custom">Custom amount</TabsTrigger>
                <TabsTrigger value="auto">Auto-bid</TabsTrigger>
              </TabsList>

              <TabsContent value="quick">
                <p className="text-sm text-ink-700">
                  Place the minimum next bid of <strong className="font-mono-data">{formatCurrency(nextMin, auction.currency)}</strong>.
                </p>
              </TabsContent>

              <TabsContent value="custom">
                <Label htmlFor="bidAmount">Your bid amount</Label>
                <Input
                  id="bidAmount" type="number" step="any" placeholder={String(nextMin)}
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-ink-500">Must be at least {formatCurrency(nextMin, auction.currency)}.</p>
              </TabsContent>

              <TabsContent value="auto">
                <div className="rounded-[var(--radius-sm)] bg-verdigris-100/60 px-3 py-2.5 text-xs text-verdigris-600">
                  <Zap className="mb-1 size-3.5" /> Set the maximum you're willing to pay — we'll automatically bid the
                  minimum needed to keep you in the lead, up to your maximum, as increment tiers require.
                </div>
                <Label htmlFor="maxAmount" className="mt-3">Your maximum bid</Label>
                <Input
                  id="maxAmount" type="number" step="any" placeholder={String(nextMin)}
                  value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)}
                />
                {autoBid && (
                  <p className="mt-1.5 text-xs text-ink-500">
                    Current auto-bid on file: {formatCurrency(autoBid.maxAmount, auction.currency)}
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                variant="copper"
                disabled={!validForConfirm}
                onClick={() => setConfirming(true)}
              >
                <Gavel className="size-4" /> Review bid
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 p-4">
              <div className="flex items-center gap-2 text-verdigris-600">
                <ShieldCheck className="size-4" />
                <p className="text-sm font-medium">Confirm your bid</p>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">{mode === 'auto' ? 'Your maximum bid' : 'Your bid'}</span><span className="font-mono-data font-semibold text-ink-900">{formatCurrency(mode === 'auto' ? Number(maxAmount) : previewAmount, auction.currency)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Current leading bid</span><span className="font-mono-data text-ink-700">{formatCurrency(auction.currentBid, auction.currency)}</span></div>
                {mode === 'auto' && <p className="pt-1 text-xs text-ink-500">We'll only raise your visible bid as far as needed to stay ahead — never straight to your maximum.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirming(false)}>Back</Button>
              <Button variant="copper" onClick={submit} loading={submitting}>Confirm &amp; place bid</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
