import { Controller } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/ui/field-error'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  LISTING_TYPES, PRICING_UNITS, PRICING_UNIT_LABEL, AUCTION_VISIBILITY, AUCTION_VISIBILITY_LABEL,
  PICKUP_OPTIONS, PAYMENT_TERMS,
} from '@/data/auctionConstants'

const TIMED = new Set([LISTING_TYPES.AUCTION, LISTING_TYPES.AUCTION_BUYNOW])

export function AuctionFields({ listingType, register, control, errors, watch, setValue }) {
  const isTimed = TIMED.has(listingType)
  const supportsBuyNow = listingType === LISTING_TYPES.AUCTION_BUYNOW
  const pickupOptions = watch('pickupOptions') || []

  function togglePickup(option) {
    const next = pickupOptions.includes(option) ? pickupOptions.filter((o) => o !== option) : [...pickupOptions, option]
    setValue('pickupOptions', next, { shouldValidate: true })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bidding configuration</CardTitle>
          <CardDescription>
            {listingType === LISTING_TYPES.ACCEPT_BIDS
              ? 'Open-ended offers — buyers submit bids, you accept whichever one you like whenever you like.'
              : 'Time-boxed competitive bidding with an automatic close and winner selection.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Pricing unit</Label>
              <Controller
                name="pricingUnit"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={!!errors.pricingUnit}><SelectValue placeholder="Per kg / ton / unit / lot" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PRICING_UNITS).map((u) => <SelectItem key={u} value={u}>{PRICING_UNIT_LABEL[u]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.pricingUnit?.message}</FieldError>
            </div>
            <div>
              <Label required>Auction visibility</Label>
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={!!errors.visibility}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(AUCTION_VISIBILITY).map((v) => <SelectItem key={v} value={v}>{AUCTION_VISIBILITY_LABEL[v]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reservePrice">Reserve price (optional)</Label>
              <Input id="reservePrice" type="number" step="any" placeholder="Minimum acceptable price" {...register('reservePrice')} />
            </div>
            <div>
              <Label htmlFor="bidIncrement">Bid increment</Label>
              <Input id="bidIncrement" type="number" step="any" placeholder="Leave blank for tiered default" {...register('bidIncrement')} />
            </div>
            {supportsBuyNow && (
              <div>
                <Label htmlFor="buyNowPrice" required>Buy Now price</Label>
                <Input id="buyNowPrice" type="number" step="any" error={!!errors.buyNowPrice} {...register('buyNowPrice')} />
                <FieldError>{errors.buyNowPrice?.message}</FieldError>
              </div>
            )}
          </div>

          {isTimed && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auctionStart" required>Auction start date &amp; time</Label>
                <Input id="auctionStart" type="datetime-local" error={!!errors.auctionStart} {...register('auctionStart')} />
                <FieldError>{errors.auctionStart?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="auctionEnd" required>Auction end date &amp; time</Label>
                <Input id="auctionEnd" type="datetime-local" error={!!errors.auctionEnd} {...register('auctionEnd')} />
                <FieldError>{errors.auctionEnd?.message}</FieldError>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fulfillment &amp; terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pickup / delivery options</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {PICKUP_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-ink-700">
                  <Checkbox checked={pickupOptions.includes(opt)} onCheckedChange={() => togglePickup(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label required>Payment terms</Label>
            <Controller
              name="paymentTerms"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger error={!!errors.paymentTerms}><SelectValue placeholder="Select payment terms" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.paymentTerms?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="inspectionRequirements">Inspection requirements</Label>
            <Textarea id="inspectionRequirements" rows={2} placeholder="e.g. Third-party inspection available on request…" {...register('inspectionRequirements')} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
