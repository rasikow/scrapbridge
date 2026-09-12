import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Check, X, Truck, FileUp, Receipt, Building2, Mail, Download,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { OrderStatusTimeline } from '@/components/shared/OrderStatusTimeline'
import { ProductImage } from '@/components/shared/ProductImage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { FileUploadField } from '@/components/shared/FileUploadField'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { orderService } from '@/services/order.service'
import { getProduct } from '@/data/products'
import { STATUS_TONE, STATUS_SEQUENCE } from '@/data/orderStatus'
import { formatCurrency } from '@/lib/utils'
import { downloadInvoice, downloadReceipt, printInvoice } from '@/lib/documents'

const UPDATABLE_STATUSES = STATUS_SEQUENCE.filter((s) => s !== 'Shipped' && s !== 'Delivered')

export default function SellerOrderDetailsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [trackingRef, setTrackingRef] = useState('')

  function reload() {
    orderService.getOrder(orderId).then((o) => {
      setOrder(o)
      setLoading(false)
    })
  }

  useEffect(reload, [orderId])

  async function accept() {
    setBusy(true)
    const updated = await orderService.acceptOrder(order.id)
    setOrder(updated)
    setBusy(false)
    toast.success('Order accepted')
  }

  async function reject() {
    setBusy(true)
    const updated = await orderService.rejectOrder(order.id, rejectReason || 'Rejected by seller.')
    setOrder(updated)
    setBusy(false)
    setRejectOpen(false)
    toast.success('Order rejected')
  }

  async function updateStatus(status) {
    setBusy(true)
    const updated = await orderService.updateOrderStatus(order.id, status)
    setOrder(updated)
    setBusy(false)
    toast.success(`Status updated to ${status}`)
  }

  async function dispatch() {
    setBusy(true)
    const updated = await orderService.dispatchOrder(order.id, trackingRef || undefined)
    setOrder(updated)
    setBusy(false)
    toast.success('Order dispatched', { description: `Tracking ${updated.trackingRef}` })
  }

  async function markDelivered() {
    setBusy(true)
    const updated = await orderService.updateOrderStatus(order.id, 'Delivered')
    setOrder(updated)
    setBusy(false)
    toast.success('Order marked as delivered')
  }

  async function uploadInvoice(file) {
    const updated = await orderService.attachInvoice(order.id, file)
    setOrder(updated)
    if (file) toast.success('Invoice attached')
  }

  async function uploadDeliveryNote(file) {
    const updated = await orderService.attachDeliveryNote(order.id, file)
    setOrder(updated)
    if (file) toast.success('Delivery note attached')
  }

  if (loading) {
    return (
      <DashboardShell showSearch={false}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </DashboardShell>
    )
  }

  if (!order) {
    return (
      <DashboardShell showSearch={false}>
        <div className="py-20 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Order not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/seller/orders')}>
            Back to orders
          </Button>
        </div>
      </DashboardShell>
    )
  }

  const product = getProduct(order.productId)
  const isPending = order.status === 'Pending'
  const isTerminal = order.status === 'Cancelled' || order.status === 'Delivered'

  return (
    <DashboardShell showSearch={false}>
      <button onClick={() => navigate('/seller/orders')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
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

        {isPending && (
          <div className="flex gap-2">
            <Button variant="copper" onClick={accept} loading={busy}>
              <Check className="size-4" /> Accept order
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={busy}>
              <X className="size-4" /> Reject
            </Button>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Fulfillment</CardTitle></CardHeader>
        <CardContent>
          <OrderStatusTimeline status={order.status} />

          {!isPending && !isTerminal && (
            <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-paper-200 pt-5">
              {order.status !== 'Shipped' && (
                <div className="w-48">
                  <Label>Update status</Label>
                  <Select value={order.status} onValueChange={updateStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UPDATABLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {order.status === 'Packed' && (
                <div className="flex items-end gap-2">
                  <div className="w-44">
                    <Label>Tracking reference</Label>
                    <input
                      value={trackingRef}
                      onChange={(e) => setTrackingRef(e.target.value)}
                      placeholder="Auto-generated if blank"
                      className="h-10 w-full rounded-[var(--radius-sm)] border border-ink-300/40 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-400"
                    />
                  </div>
                  <Button variant="copper" onClick={dispatch} loading={busy}>
                    <Truck className="size-4" /> Dispatch order
                  </Button>
                </div>
              )}

              {order.status === 'Shipped' && (
                <Button variant="copper" onClick={markDelivered} loading={busy}>
                  <Check className="size-4" /> Mark as delivered
                </Button>
              )}
            </div>
          )}

          {order.trackingRef && (
            <div className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 px-3.5 py-2.5 text-sm">
              <Truck className="size-4 text-ink-500" />
              <span className="text-ink-500">Tracking reference</span>
              <span className="font-mono-data font-medium text-ink-900">{order.trackingRef}</span>
            </div>
          )}

          {order.sellerNote && (
            <div className="mt-3 rounded-[var(--radius-sm)] border border-signal-down/30 bg-signal-down/5 px-3.5 py-2.5 text-sm text-signal-down">
              {order.sellerNote}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order items</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ProductImage materialId={product?.materialId} className="size-16 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{order.productName}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {order.quantity.toLocaleString()} {order.unit} × {formatCurrency(order.unitPrice, order.currency)}
                  </p>
                </div>
                <p className="font-mono-data text-base font-semibold text-ink-900">{formatCurrency(order.total, order.currency)}</p>
              </div>
              {order.poFile && (
                <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-paper-300 px-3.5 py-2.5 text-sm">
                  <FileUp className="size-4 text-ink-500" />
                  <span className="text-ink-700">{order.poFile.name}</span>
                  <span className="text-xs text-ink-300">buyer's purchase order</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FileUploadField
                name="invoiceFile"
                label="Invoice"
                hint="Upload a signed invoice for this order"
                value={order.invoiceFile}
                onChange={uploadInvoice}
              />
              <FileUploadField
                name="deliveryNoteFile"
                label="Delivery note"
                hint="Upload proof of delivery"
                value={order.deliveryNoteFile}
                onChange={uploadDeliveryNote}
              />
              <div className="flex flex-wrap gap-2 border-t border-paper-200 pt-4">
                <Button variant="outline" size="sm" onClick={() => downloadInvoice(order)}>
                  <Download className="size-3.5" /> System invoice
                </Button>
                {order.status === 'Delivered' && (
                  <Button variant="outline" size="sm" onClick={() => downloadReceipt(order)}>
                    <Receipt className="size-3.5" /> Generate receipt
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => printInvoice(order)}>
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-4" /> Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-ink-900">{order.buyerCompany}</p>
              <p className="mt-0.5 text-xs text-ink-500">{order.buyerContact}</p>
            </div>
            {order.buyerEmail && (
              <div className="flex items-center gap-1.5 text-xs text-ink-500">
                <Mail className="size-3.5" /> {order.buyerEmail}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this order?</DialogTitle>
            <DialogDescription>Let the buyer know why — this note is shown on their order.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea
              id="rejectReason"
              rows={3}
              placeholder="e.g. Insufficient stock at requested grade."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} loading={busy}>Reject order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
