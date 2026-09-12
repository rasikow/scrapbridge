import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Download, Printer, RotateCcw, Truck, XCircle, FileText, Package, CreditCard,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { ProductImage } from '@/components/shared/ProductImage'
import { OrderStatusTimeline } from '@/components/shared/OrderStatusTimeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PaymentGateway } from '@/components/payment/PaymentGateway'
import { orderService } from '@/services/order.service'
import { getSeller } from '@/data/sellers'
import { getProduct } from '@/data/products'
import { STATUS_TONE } from '@/data/orderStatus'
import { formatCurrency } from '@/lib/utils'
import { downloadInvoice, downloadReceipt, printInvoice } from '@/lib/documents'
import { useCart } from '@/hooks/useCart'

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    orderService.getOrder(orderId).then((o) => {
      setOrder(o)
      setLoading(false)
    })
  }, [orderId])

  async function handleCancel() {
    setCancelling(true)
    const updated = await orderService.cancelOrder(orderId)
    setOrder(updated)
    setCancelling(false)
    setCancelOpen(false)
    toast.success('Order cancelled')
  }

  function repeatOrder() {
    addItem(order.productId, order.quantity)
    toast.success('Added to cart')
    navigate('/buyer/cart')
  }

  async function handlePaymentSuccess(payment) {
    const updated = await orderService.payOrder(order.id, payment)
    setOrder(updated)
    setPayOpen(false)
    toast.success(payment.status === 'pending_verification' ? 'Awaiting wire transfer confirmation' : 'Payment received')
  }

  if (loading) {
    return (
      <DashboardShell showSearch={false}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardShell>
    )
  }

  if (!order) {
    return (
      <DashboardShell showSearch={false}>
        <div className="py-20 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Order not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/buyer/orders')}>
            Back to orders
          </Button>
        </div>
      </DashboardShell>
    )
  }

  const seller = getSeller(order.sellerId)
  const product = getProduct(order.productId)
  const canCancel = !['Shipped', 'Delivered', 'Cancelled'].includes(order.status)

  return (
    <DashboardShell showSearch={false}>
      <button onClick={() => navigate('/buyer/orders')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to orders
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-mono-data text-2xl font-semibold text-ink-900">{order.id}</h1>
            <Badge variant={STATUS_TONE[order.status]}>{order.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">Placed {new Date(order.placedAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadInvoice(order)}>
            <Download className="size-3.5" /> Invoice
          </Button>
          {order.status === 'Delivered' && (
            <Button variant="outline" size="sm" onClick={() => downloadReceipt(order)}>
              <Download className="size-3.5" /> Receipt
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => printInvoice(order)}>
            <Printer className="size-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={repeatOrder}>
            <RotateCcw className="size-3.5" /> Repeat order
          </Button>
          {canCancel && (
            <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="size-3.5" /> Cancel order
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Shipment status</CardTitle></CardHeader>
        <CardContent>
          <OrderStatusTimeline status={order.status} />
          {order.trackingRef && (
            <div className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 px-3.5 py-2.5 text-sm">
              <Truck className="size-4 text-ink-500" />
              <span className="text-ink-500">Tracking reference</span>
              <span className="font-mono-data font-medium text-ink-900">{order.trackingRef}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Order items</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ProductImage materialId={product?.materialId} className="size-16 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                {product ? (
                  <Link to={`/buyer/marketplace/${product.id}`} className="text-sm font-medium text-ink-900 hover:text-copper-600">
                    {order.productName}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-ink-900">{order.productName}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-500">
                  {order.quantity.toLocaleString()} {order.unit} × {formatCurrency(order.unitPrice, order.currency)}
                </p>
              </div>
              <p className="font-mono-data text-base font-semibold text-ink-900">{formatCurrency(order.total, order.currency)}</p>
            </div>

            {order.poFile && (
              <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-paper-300 px-3.5 py-2.5 text-sm">
                <FileText className="size-4 text-ink-500" />
                <span className="text-ink-700">{order.poFile.name}</span>
                <span className="text-xs text-ink-300">purchase order attached</span>
              </div>
            )}

            <div className="mt-4 h-px bg-paper-300" />
            <div className="mt-4 flex justify-between text-sm font-semibold">
              <span className="text-ink-900">Total</span>
              <span className="font-mono-data text-ink-900">{formatCurrency(order.total, order.currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="size-4" /> Seller</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-ink-900">{seller?.companyName}</p>
            <p className="mt-0.5 text-xs text-ink-500">{seller?.location}</p>
            <p className="mt-3 text-xs text-ink-500">Avg. response {seller?.responseTime}</p>
          </CardContent>
        </Card>

        {order.paymentPending ? (
          <Card className="border-copper-400/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-ink-700">
                {order.source === 'auction' ? 'You won this lot — payment is due to confirm the order.' : 'Payment is due for this order.'}
              </p>
              <Button variant="copper" className="mt-3 w-full" onClick={() => setPayOpen(true)}>
                <CreditCard className="size-4" /> Pay {formatCurrency(order.total, order.currency)}
              </Button>
            </CardContent>
          </Card>
        ) : order.paymentMethod && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-ink-700">{order.paymentDetail}</p>
              <Badge variant={order.paymentStatus === 'pending_verification' ? 'warning' : 'success'} className="mt-2">
                {order.paymentStatus === 'pending_verification' ? 'Awaiting transfer confirmation' : 'Paid'}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              This will cancel {order.id} with {seller?.companyName}. This action can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button variant="destructive" onClick={handleCancel} loading={cancelling}>
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Pay for {order.id}</DialogTitle>
            <DialogDescription>Prototype checkout — no real money moves.</DialogDescription>
          </DialogHeader>
          <PaymentGateway
            amount={order.total}
            currency={order.currency}
            reference={order.id}
            submitLabel="Pay"
            onCancel={() => setPayOpen(false)}
            onSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
