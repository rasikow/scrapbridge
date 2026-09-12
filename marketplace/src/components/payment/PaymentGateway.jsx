import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CreditCard, Landmark, ShieldCheck, Lock, Copy, Check, Wifi, Building2, Loader2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Mock beneficiary bank the platform "settles" wire transfers into. Shown to
// the payer with copy-to-clipboard so a real accounts team could reuse this
// verbatim as a bank-transfer instructions panel.
// ---------------------------------------------------------------------------
export const SETTLEMENT_BANK = {
  bankName: 'First Continental Bank',
  accountName: 'ScrapBridge Trading Escrow Ltd.',
  accountNumber: '8842 1190 3357',
  routingNumber: '026 073 150',
  swiftCode: 'FCBKUS33XXX',
  iban: 'GB29 FCBK 6016 1331 9268 19',
  branchAddress: '1 Exchange Square, New York, NY 10004',
}

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return 'Visa'
  if (/^5[1-5]/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^6(?:011|5)/.test(digits)) return 'Discover'
  return null
}

function formatCardNumber(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy — please copy manually')
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 border-b border-paper-200 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] text-ink-500">{label}</p>
        <p className={cn('truncate text-sm text-ink-900', mono && 'font-mono-data')}>{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-1 rounded-full border border-ink-300/40 px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:border-copper-400 hover:text-copper-600"
      >
        {copied ? <Check className="size-3 text-signal-up" /> : <Copy className="size-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

/**
 * Self-contained payment UI supporting two rails:
 *  - Credit / debit card, with a live animated card preview, brand
 *    detection and formatted inputs.
 *  - Bank / wire transfer, which surfaces the settlement account's real
 *    banking details (account number, routing/SWIFT, IBAN) for the payer
 *    to transfer into directly, plus a reference code to quote.
 *
 * Fully presentational + client-side mock validation — `onSuccess` fires
 * with the chosen method once the (simulated) payment/transfer is
 * confirmed. No real card is charged and no real transfer is required.
 */
export function PaymentGateway({ amount, currency = 'USD', reference, onSuccess, onCancel, submitLabel = 'Pay' }) {
  const [method, setMethod] = useState('card')

  // Card state
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [cardErrors, setCardErrors] = useState({})
  const [cardProcessing, setCardProcessing] = useState(false)

  // Bank transfer state
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [transferSubmitting, setTransferSubmitting] = useState(false)

  const digits = cardNumber.replace(/\s/g, '')
  const brand = useMemo(() => detectCardBrand(digits), [digits])

  function validateCard() {
    const errs = {}
    if (!cardName.trim()) errs.cardName = 'Cardholder name is required'
    if (digits.length < 15) errs.cardNumber = 'Enter a valid card number'
    if (!/^\d{2}\/\d{2}$/.test(expiry)) errs.expiry = 'Use MM/YY'
    else {
      const [mm, yy] = expiry.split('/').map(Number)
      if (mm < 1 || mm > 12) errs.expiry = 'Invalid month'
    }
    if (cvv.length < 3) errs.cvv = 'Enter a valid CVV'
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function submitCard() {
    if (!validateCard()) return
    setCardProcessing(true)
    await new Promise((r) => setTimeout(r, 1100))
    setCardProcessing(false)
    onSuccess?.({
      method: 'card',
      detail: `${brand || 'Card'} ending ${digits.slice(-4)}`,
      status: 'paid',
    })
  }

  async function submitTransfer() {
    setTransferSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    setTransferSubmitting(false)
    onSuccess?.({
      method: 'bank_transfer',
      detail: `Wire transfer to ${SETTLEMENT_BANK.bankName} · ref ${reference}`,
      status: 'pending_verification',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-500">Amount due</p>
          <p className="font-mono-data text-xl font-semibold text-ink-900">{formatCurrency(amount, currency)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
          <Lock className="size-3.5 text-verdigris-500" /> Secure checkout
        </div>
      </div>

      <Tabs value={method} onValueChange={setMethod}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card" className="flex items-center justify-center gap-1.5">
            <CreditCard className="size-4" /> Credit / Debit Card
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center justify-center gap-1.5">
            <Landmark className="size-4" /> Bank Transfer
          </TabsTrigger>
        </TabsList>

        {/* --------------------------- CARD TAB --------------------------- */}
        <TabsContent value="card" className="space-y-4">
          {/* Live card preview */}
          <div className="relative mx-auto h-44 w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-graphite-800 via-graphite-900 to-graphite-950 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-copper-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-verdigris-500/20 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <Wifi className="size-5 rotate-90 text-white/70" />
              <span className="font-display text-sm font-semibold tracking-wide text-white/90">
                {brand || 'CARD'}
              </span>
            </div>
            <p className="relative mt-7 font-mono-data text-lg tracking-[0.15em] text-white">
              {cardNumber ? formatCardNumber(cardNumber).padEnd(19, '•') : '•••• •••• •••• ••••'}
            </p>
            <div className="relative mt-5 flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/40">Card holder</p>
                <p className="mt-0.5 max-w-[180px] truncate text-xs font-medium uppercase tracking-wide">
                  {cardName || 'YOUR NAME'}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/40">Expires</p>
                <p className="mt-0.5 font-mono-data text-xs">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="cardName">Cardholder name</Label>
            <Input
              id="cardName"
              placeholder="As shown on card"
              value={cardName}
              error={!!cardErrors.cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
            <FieldError>{cardErrors.cardName}</FieldError>
          </div>

          <div>
            <Label htmlFor="cardNumber">Card number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(cardNumber)}
                error={!!cardErrors.cardNumber}
                className="pr-12"
                onChange={(e) => setCardNumber(e.target.value)}
              />
              {brand && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-data text-[10px] font-semibold uppercase text-copper-600">
                  {brand}
                </span>
              )}
            </div>
            <FieldError>{cardErrors.cardNumber}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiry">Expiry (MM/YY)</Label>
              <Input
                id="expiry"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                error={!!cardErrors.expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              />
              <FieldError>{cardErrors.expiry}</FieldError>
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                inputMode="numeric"
                type="password"
                placeholder="•••"
                maxLength={4}
                value={cvv}
                error={!!cardErrors.cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <FieldError>{cardErrors.cvv}</FieldError>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <Checkbox checked={saveCard} onCheckedChange={setSaveCard} />
            <span className="text-sm text-ink-700">Save this card for future orders</span>
          </label>

          <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <ShieldCheck className="size-3.5 text-verdigris-500" />
            Card details are encrypted in transit. This is a prototype — no real card is ever charged.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {onCancel && <Button variant="outline" onClick={onCancel} disabled={cardProcessing}>Cancel</Button>}
            <Button variant="copper" onClick={submitCard} loading={cardProcessing}>
              <Lock className="size-4" /> {cardProcessing ? 'Processing…' : `${submitLabel} ${formatCurrency(amount, currency)}`}
            </Button>
          </div>
        </TabsContent>

        {/* ------------------------- BANK TRANSFER TAB ------------------------- */}
        <TabsContent value="bank" className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-verdigris-100/60 px-3.5 py-3 text-xs text-verdigris-600">
            <Building2 className="mt-0.5 size-4 shrink-0" />
            <p>
              Transfer the exact amount below to the bank account shown, quoting your reference code. Orders paid by
              wire are confirmed once the transfer clears — usually within 1–2 business days.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-4">
            <CopyField label="Bank name" value={SETTLEMENT_BANK.bankName} mono={false} />
            <CopyField label="Account name" value={SETTLEMENT_BANK.accountName} mono={false} />
            <CopyField label="Account number" value={SETTLEMENT_BANK.accountNumber} />
            <CopyField label="Routing number (ACH/domestic)" value={SETTLEMENT_BANK.routingNumber} />
            <CopyField label="SWIFT / BIC (international)" value={SETTLEMENT_BANK.swiftCode} />
            <CopyField label="IBAN" value={SETTLEMENT_BANK.iban} />
            <CopyField label="Branch address" value={SETTLEMENT_BANK.branchAddress} mono={false} />
            <CopyField label="Payment reference — include this" value={reference || 'N/A'} />
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3">
            <span className="text-sm text-ink-700">Amount to transfer</span>
            <span className="font-mono-data text-base font-semibold text-ink-900">{formatCurrency(amount, currency)}</span>
          </div>

          <label className="flex items-start gap-2.5">
            <Checkbox checked={transferConfirmed} onCheckedChange={setTransferConfirmed} className="mt-0.5" />
            <span className="text-sm text-ink-700">
              I&apos;ve initiated this wire transfer with my bank, quoting the reference above.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            {onCancel && <Button variant="outline" onClick={onCancel} disabled={transferSubmitting}>Cancel</Button>}
            <Button variant="copper" onClick={submitTransfer} disabled={!transferConfirmed} loading={transferSubmitting}>
              {transferSubmitting ? (
                <><Loader2 className="size-4 animate-spin" /> Submitting…</>
              ) : (
                <>I&apos;ve sent the transfer</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
