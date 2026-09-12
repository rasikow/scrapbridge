import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUploadField } from '@/components/shared/FileUploadField'
import { Skeleton } from '@/components/ui/skeleton'
import { AuctionFields } from '@/features/seller/components/AuctionFields'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/product.service'
import { auctionService } from '@/services/auction.service'
import { MATERIAL_CATEGORIES, UNITS, LOCATIONS } from '@/data/materials'
import { generateFullListing } from '@/lib/generateProduct'
import { cn } from '@/lib/utils'
import { LISTING_TYPES, LISTING_TYPE_LABEL, AUCTION_TYPES, AUCTION_VISIBILITY, PRICING_UNITS } from '@/data/auctionConstants'

const CURRENCIES = ['USD', 'AED', 'EUR', 'GBP', 'INR', 'SGD']

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const schema = z.object({
  name: z.string().min(3, 'Product name is required'),
  materialId: z.string().min(1, 'Select a material category'),
  materialType: z.string().min(1, 'Material type is required'),
  grade: z.string().min(1, 'Grade is required'),
  purity: z.string().optional(),
  description: z.string().min(10, 'Add a short description (10+ characters)'),
  quantity: z.coerce.number().positive('Enter available quantity'),
  unit: z.string().min(1, 'Select a unit'),
  minOrderQty: z.coerce.number().positive('Enter a minimum order quantity'),
  price: z.coerce.number().positive('Enter a price'),
  currency: z.string().min(1, 'Select a currency'),
  location: z.string().min(1, 'Select a location'),
  stockAvailability: z.boolean().default(true),
  listingType: z.string().min(1),
  pricingUnit: z.string().optional(),
  reservePrice: z.coerce.number().optional().or(z.literal('').transform(() => undefined)),
  bidIncrement: z.coerce.number().optional().or(z.literal('').transform(() => undefined)),
  buyNowPrice: z.coerce.number().optional().or(z.literal('').transform(() => undefined)),
  auctionStart: z.string().optional(),
  auctionEnd: z.string().optional(),
  visibility: z.string().optional(),
  paymentTerms: z.string().optional(),
  inspectionRequirements: z.string().optional(),
  pickupOptions: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (!AUCTION_TYPES.has(data.listingType)) return
  if (!data.pricingUnit) ctx.addIssue({ path: ['pricingUnit'], code: z.ZodIssueCode.custom, message: 'Select a pricing unit' })
  if (!data.paymentTerms) ctx.addIssue({ path: ['paymentTerms'], code: z.ZodIssueCode.custom, message: 'Select payment terms' })
  if (data.listingType === LISTING_TYPES.AUCTION_BUYNOW && !data.buyNowPrice) {
    ctx.addIssue({ path: ['buyNowPrice'], code: z.ZodIssueCode.custom, message: 'Buy Now price is required for this listing type' })
  }
  if ([LISTING_TYPES.AUCTION, LISTING_TYPES.AUCTION_BUYNOW].includes(data.listingType)) {
    if (!data.auctionStart) ctx.addIssue({ path: ['auctionStart'], code: z.ZodIssueCode.custom, message: 'Auction start is required' })
    if (!data.auctionEnd) ctx.addIssue({ path: ['auctionEnd'], code: z.ZodIssueCode.custom, message: 'Auction end is required' })
    if (data.auctionStart && data.auctionEnd && new Date(data.auctionEnd) <= new Date(data.auctionStart)) {
      ctx.addIssue({ path: ['auctionEnd'], code: z.ZodIssueCode.custom, message: 'End time must be after the start time' })
    }
  }
  if (data.reservePrice != null && data.reservePrice < data.price) {
    ctx.addIssue({ path: ['reservePrice'], code: z.ZodIssueCode.custom, message: 'Reserve price should be at or above the starting bid' })
  }
})

export default function ProductFormPage() {
  const { productId } = useParams()
  const isEdit = !!productId
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(isEdit)
  const [images, setImages] = useState({ primary: null, secondary: null, tertiary: null })
  const [documents, setDocuments] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [linkedAuction, setLinkedAuction] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { stockAvailability: true, currency: 'USD', listingType: LISTING_TYPES.FIXED, pickupOptions: [], visibility: AUCTION_VISIBILITY.PUBLIC },
  })

  const selectedMaterialId = watch('materialId')
  const listingType = watch('listingType')
  const isAuctionType = AUCTION_TYPES.has(listingType)

  async function handleGenerate() {
    setGenerating(true)
    // Small artificial delay so the action reads as "generating" rather than
    // an instant, jarring form swap — this is a client-side procedural
    // generator (see lib/generateProduct.js), not a live model call.
    await new Promise((r) => setTimeout(r, 900))
    const { formValues, images: generatedImages } = generateFullListing(selectedMaterialId)
    reset({ ...formValues, listingType, pickupOptions: [], visibility: AUCTION_VISIBILITY.PUBLIC })
    setImages(generatedImages)
    setGenerating(false)
    toast.success('Draft listing generated', { description: 'Review the details below, then edit anything before submitting.' })
  }

  useEffect(() => {
    if (!isEdit) return
    Promise.all([productService.getProduct(productId), auctionService.getAuctionByProduct(productId)]).then(([p, auction]) => {
      if (p) {
        reset({
          name: p.name,
          materialId: p.materialId,
          materialType: p.materialType || p.grade,
          grade: p.grade,
          purity: p.purity || '',
          description: p.description,
          quantity: p.quantity,
          unit: p.unit,
          minOrderQty: p.minOrderQty,
          price: p.price,
          currency: p.currency,
          location: p.location,
          stockAvailability: p.stockAvailability,
          listingType: p.listingType || LISTING_TYPES.FIXED,
          pricingUnit: auction?.pricingUnit || PRICING_UNITS.PER_KG,
          reservePrice: auction?.reservePrice ?? undefined,
          bidIncrement: auction?.bidIncrement ?? undefined,
          buyNowPrice: auction?.buyNowPrice ?? undefined,
          auctionStart: auction?.startAt ? toLocalInput(auction.startAt) : '',
          auctionEnd: auction?.endAt ? toLocalInput(auction.endAt) : '',
          visibility: auction?.visibility || AUCTION_VISIBILITY.PUBLIC,
          paymentTerms: auction?.paymentTerms || '',
          inspectionRequirements: auction?.inspectionRequirements || '',
          pickupOptions: auction?.pickupOptions || [],
        })
        setLinkedAuction(auction)
        if (p.images) setImages(p.images)
      }
      setLoading(false)
    })
  }, [isEdit, productId, reset])

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await productService.updateProduct(productId, { ...values, images })
        if (linkedAuction) {
          try {
            await auctionService.updateAuctionListing(linkedAuction.id, {
              reservePrice: values.reservePrice ?? null,
              bidIncrement: values.bidIncrement ?? null,
              buyNowPrice: values.buyNowPrice ?? null,
              pricingUnit: values.pricingUnit,
              visibility: values.visibility,
              paymentTerms: values.paymentTerms,
              inspectionRequirements: values.inspectionRequirements,
              pickupOptions: values.pickupOptions,
              startingBid: values.price,
              startAt: values.auctionStart ? new Date(values.auctionStart).toISOString() : linkedAuction.startAt,
              endAt: values.auctionEnd ? new Date(values.auctionEnd).toISOString() : linkedAuction.endAt,
              lotQuantity: values.quantity,
              lotUnit: values.unit,
              minQtyForBidding: values.minOrderQty,
            })
          } catch (auctionErr) {
            toast.warning('Product updated, but auction terms were not changed', { description: auctionErr.message })
          }
        }
        toast.success('Product updated')
      } else if (isAuctionType) {
        await auctionService.createAuctionListing(user.sellerId, {
          product: {
            name: values.name, materialId: values.materialId, materialType: values.materialType, grade: values.grade,
            purity: values.purity, description: values.description, quantity: values.quantity, unit: values.unit,
            minOrderQty: values.minOrderQty, price: values.price, currency: values.currency, location: values.location,
            stockAvailability: values.stockAvailability, images, documents,
          },
          auction: {
            listingType: values.listingType,
            pricingUnit: values.pricingUnit,
            lotQuantity: values.quantity,
            lotUnit: values.unit,
            startingBid: values.price,
            reservePrice: values.reservePrice || null,
            bidIncrement: values.bidIncrement || null,
            buyNowPrice: values.buyNowPrice || null,
            minQtyForBidding: values.minOrderQty,
            currency: values.currency,
            location: values.location,
            pickupOptions: values.pickupOptions || [],
            paymentTerms: values.paymentTerms,
            inspectionRequirements: values.inspectionRequirements || '',
            visibility: values.visibility,
            startAt: values.auctionStart ? new Date(values.auctionStart).toISOString() : new Date().toISOString(),
            endAt: values.auctionEnd ? new Date(values.auctionEnd).toISOString() : null,
          },
        })
        toast.success('Auction listing submitted', { description: 'It will go live once the product and auction are both approved.' })
      } else {
        await productService.createProduct(user.sellerId, { ...values, images, documents })
        toast.success('Product submitted for approval', { description: 'New listings are reviewed before they go live.' })
      }
      navigate(isAuctionType ? '/seller/auctions' : '/seller/products')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <DashboardShell showSearch={false}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-96 w-full max-w-3xl" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell showSearch={false}>
      <Link to="/seller/products" className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">{isEdit ? 'Edit listing' : 'New listing'}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{isEdit ? 'Edit product' : 'Add a product'}</h1>
        </div>
        {!isEdit && (
          <Button type="button" variant="outline" onClick={handleGenerate} loading={generating}>
            <Sparkles className="size-4" /> Generate product
          </Button>
        )}
      </div>

      {!isEdit && (
        <p className="mb-4 -mt-4 max-w-2xl text-xs text-ink-500">
          Generates a realistic draft — name, description, grade, quantity, price and a placeholder
          photo — for the currently selected material (or a random one if none is picked yet).
          Everything stays editable before you submit.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Listing type</CardTitle>
            <CardDescription>How buyers can purchase this listing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name="listingType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {Object.values(LISTING_TYPES).map((lt) => (
                    <button
                      key={lt}
                      type="button"
                      disabled={isEdit && !!linkedAuction && lt !== field.value}
                      onClick={() => field.onChange(lt)}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        field.value === lt ? 'border-copper-500 bg-copper-100/50 text-copper-600' : 'border-ink-300/40 text-ink-700 hover:bg-paper-100'
                      )}
                    >
                      {LISTING_TYPE_LABEL[lt]}
                    </button>
                  ))}
                </div>
              )}
            />
            {isEdit && linkedAuction && (
              <p className="mt-2 text-xs text-ink-500">Listing type can't be changed once an auction exists — cancel and relist to switch.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" required>Product name</Label>
              <Input id="name" placeholder="e.g. Copper Scrap — Grade A (Bright & Shiny)" error={!!errors.name} {...register('name')} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Material category</Label>
                <Controller
                  name="materialId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger error={!!errors.materialId}><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>
                        {MATERIAL_CATEGORIES.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              <span className="size-2 rounded-full" style={{ backgroundColor: m.swatch }} />
                              {m.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.materialId?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="materialType" required>Material type</Label>
                <Input id="materialType" placeholder="e.g. Post-industrial" error={!!errors.materialType} {...register('materialType')} />
                <FieldError>{errors.materialType?.message}</FieldError>
              </div>
            </div>

            <div>
              <Label htmlFor="description" required>Description</Label>
              <Textarea id="description" rows={4} placeholder="Sourcing, sorting standard, packaging, recurring availability…" error={!!errors.description} {...register('description')} />
              <FieldError>{errors.description?.message}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade" required>Grade</Label>
                <Input id="grade" placeholder="e.g. Grade A" error={!!errors.grade} {...register('grade')} />
                <FieldError>{errors.grade?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="purity">Purity (optional)</Label>
                <Input id="purity" placeholder="e.g. 99.2% Cu" {...register('purity')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAuctionType ? 'Quantity & lot pricing' : 'Quantity & pricing'}</CardTitle>
            {isAuctionType && <CardDescription>Full lot quantity and starting bid — increments, reserve and Buy Now are set below.</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity" required>{isAuctionType ? 'Quantity available (lot size)' : 'Available quantity'}</Label>
                <Input id="quantity" type="number" step="any" error={!!errors.quantity} {...register('quantity')} />
                <FieldError>{errors.quantity?.message}</FieldError>
              </div>
              <div>
                <Label required>Unit</Label>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger error={!!errors.unit}><SelectValue placeholder="Unit" /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.unit?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="minOrderQty" required>{isAuctionType ? 'Minimum qty required for bidding' : 'Minimum order qty'}</Label>
                <Input id="minOrderQty" type="number" step="any" error={!!errors.minOrderQty} {...register('minOrderQty')} />
                <FieldError>{errors.minOrderQty?.message}</FieldError>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price" required>{isAuctionType ? 'Starting bid price' : 'Price per unit'}</Label>
                <Input id="price" type="number" step="any" error={!!errors.price} {...register('price')} />
                <FieldError>{errors.price?.message}</FieldError>
              </div>
              <div>
                <Label required>Currency</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger error={!!errors.currency}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.currency?.message}</FieldError>
              </div>
              <div>
                <Label required>Location</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger error={!!errors.location}><SelectValue placeholder="Warehouse location" /></SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.location?.message}</FieldError>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <Controller
                name="stockAvailability"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <span className="text-sm text-ink-700">In stock and available to order</span>
            </label>
          </CardContent>
        </Card>

        {isAuctionType && (
          <AuctionFields listingType={listingType} register={register} control={control} errors={errors} watch={watch} setValue={setValue} />
        )}

        <Card>
          <CardHeader><CardTitle>Images &amp; documents</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FileUploadField name="image1" label="Primary image" hint="JPG or PNG" value={images.primary} onChange={(f) => setImages((i) => ({ ...i, primary: f }))} />
              <FileUploadField name="image2" label="Image 2" hint="Optional" value={images.secondary} onChange={(f) => setImages((i) => ({ ...i, secondary: f }))} />
              <FileUploadField name="image3" label="Image 3" hint="Optional" value={images.tertiary} onChange={(f) => setImages((i) => ({ ...i, tertiary: f }))} />
            </div>
            <FileUploadField name="specSheet" label="Spec sheet / quality certificate" hint="Optional — PDF" accept=".pdf" value={documents} onChange={setDocuments} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="copper" size="lg" loading={isSubmitting}>
            <Save className="size-4" /> {isEdit ? 'Save changes' : 'Submit for approval'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/seller/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}
