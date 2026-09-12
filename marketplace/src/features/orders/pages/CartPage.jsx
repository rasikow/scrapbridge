import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, FileUp } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { FileUploadField } from '@/components/shared/FileUploadField'
import { PaymentGateway } from '@/components/payment/PaymentGateway'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/order.service'
import { formatCurrency, formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [poFile, setPoFile] = useState(null)
  const [placing, setPlacing] = useState(false)

  const orderReference = `SX-${Date.now().toString().slice(-8)}`

  async function handlePaymentSuccess(payment) {
    setPlacing(true)
    try {
      const created = await orderService.placeOrder({
        userId: user.id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        poFile,
        payment,
      })
      clearCart()
      setCheckoutOpen(false)
      setPlacing(false)
      if (payment.status === 'pending_verification') {
        toast.success('Order placed — awaiting wire transfer confirmation', {
          description: `We'll confirm as soon as your transfer (ref ${orderReference}) clears.`,
        })
      } else {
        toast.success(`${created.length > 1 ? `${created.length} orders` : 'Order'} placed successfully`)
      }
      navigate(`/buyer/orders/${created[0].id}`)
    } catch {
      setPlacing(false)
      toast.error('Something went wrong placing your order — please try again')
    }
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={ShoppingCart}
        eyebrow="Checkout"
        title="Your cart"
        subtitle={`${items.length} line item${items.length !== 1 ? 's' : ''} ready for checkout`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add materials from the marketplace to request an order."
          actionLabel="Browse marketplace"
          onAction={() => navigate('/buyer/marketplace')}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <Card key={product.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <ProductImage materialId={product.materialId} className="size-16 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/buyer/marketplace/${product.id}`} className="truncate text-sm font-medium text-ink-900 hover:text-copper-600">
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">{product.location} · MOQ {product.minOrderQty.toLocaleString()} {product.unit}</p>
                    <p className="mt-1 font-mono-data text-sm text-ink-700">${formatPrice(product.price)}/{product.unit}</p>
                  </div>

                  <div className="flex items-center rounded-[var(--radius-sm)] border border-ink-300/40">
                    <button
                      className="p-2 text-ink-500 hover:text-ink-900 disabled:opacity-30"
                      disabled={quantity <= product.minOrderQty}
                      onClick={() => updateQuantity(product.id, Math.max(product.minOrderQty, quantity - product.minOrderQty))}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-16 text-center font-mono-data text-xs tabular-nums">{quantity.toLocaleString()}</span>
                    <button
                      className="p-2 text-ink-500 hover:text-ink-900"
                      onClick={() => updateQuantity(product.id, quantity + product.minOrderQty)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <p className="w-28 shrink-0 text-right font-mono-data text-sm font-semibold text-ink-900">
                    {formatCurrency(quantity * product.price)}
                  </p>

                  <button
                    onClick={() => removeItem(product.id)}
                    className="shrink-0 rounded-full p-2 text-ink-300 hover:bg-signal-down/10 hover:text-signal-down"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <Card>
              <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Subtotal</span>
                  <span className="font-mono-data text-ink-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Logistics &amp; handling</span>
                  <span className="text-ink-500">Quoted by seller</span>
                </div>
                <div className="my-2 h-px bg-paper-300" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-ink-900">Estimated total</span>
                  <span className="font-mono-data text-ink-900">{formatCurrency(subtotal)}</span>
                </div>
                <Button variant="copper" size="lg" className="mt-2 w-full" onClick={() => setCheckoutOpen(true)}>
                  <CreditCard className="size-4" /> Proceed to checkout
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <FileUploadField
                  name="purchaseOrder"
                  label="Purchase order (optional)"
                  hint="Attach your internal PO to speed up approval"
                  value={poFile}
                  onChange={setPoFile}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={(open) => !placing && setCheckoutOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirm &amp; pay</DialogTitle>
            <DialogDescription>
              {items.length} item{items.length !== 1 && 's'} · Ref {orderReference} — prototype checkout, no real money moves.
            </DialogDescription>
          </DialogHeader>

          {poFile && (
            <div className="-mt-2 flex items-center gap-2 text-xs text-verdigris-600">
              <FileUp className="size-3.5" /> {poFile.name} attached
            </div>
          )}

          <PaymentGateway
            amount={subtotal}
            currency="USD"
            reference={orderReference}
            submitLabel="Pay"
            onCancel={() => setCheckoutOpen(false)}
            onSuccess={handlePaymentSuccess}
          />

          {placing && (
            <p className="text-center text-xs text-ink-500">Placing your order…</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
