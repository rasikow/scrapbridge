import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Receipt, Search, RotateCcw, XCircle } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { orderService } from '@/services/order.service'
import { STATUS_TONE, ORDER_STATUSES } from '@/data/orderStatus'
import { formatCurrency } from '@/lib/utils'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function matchesFilter(status, filter) {
  if (filter === 'All') return true
  if (filter === 'Processing') return ['Approved', 'Processing', 'Packed'].includes(status)
  return status === filter
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')
  const [refundOpen, setRefundOpen] = useState(false)

  function reload() {
    orderService.listAllOrders().then(setOrders)
  }

  useEffect(reload, [])

  const filtered = useMemo(() => {
    let items = (orders || []).filter((o) => matchesFilter(o.status, filter))
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((o) => o.id.toLowerCase().includes(q) || o.buyerCompany.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q))
    }
    return items
  }, [orders, filter, query])

  async function updateStatus(status) {
    setBusy(true)
    const updated = await orderService.updateOrderStatus(selected.id, status)
    setSelected(updated)
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setBusy(false)
    toast.success(`Status updated to ${status}`)
  }

  async function cancel() {
    setBusy(true)
    const updated = await orderService.cancelOrder(selected.id)
    setSelected(updated)
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setBusy(false)
    toast.success('Order cancelled')
  }

  async function resolveDispute() {
    setBusy(true)
    const updated = await orderService.updateOrderStatus(selected.id, selected.status)
    // Attach the resolution note without changing status
    const withNote = { ...updated, sellerNote: disputeNote }
    setSelected(withNote)
    setOrders((prev) => prev.map((o) => (o.id === withNote.id ? withNote : o)))
    setBusy(false)
    setDisputeNote('')
    toast.success('Dispute note saved')
  }

  async function refund() {
    setBusy(true)
    const updated = await orderService.refundOrder(selected.id, disputeNote)
    setSelected(updated)
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setBusy(false)
    setRefundOpen(false)
    setDisputeNote('')
    toast.success('Order refunded')
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={Receipt} eyebrow="Platform-wide" title="Order management" subtitle="Track, resolve, and refund orders across every seller on the exchange." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input placeholder="Search order, buyer, product…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {!orders ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders found" description="Try a different filter or search term." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Placed</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                    <td className="px-5 py-3 font-mono-data text-ink-900">{o.id}</td>
                    <td className="px-5 py-3 text-ink-700">{o.buyerCompany}</td>
                    <td className="max-w-[180px] truncate px-5 py-3 text-ink-700">{o.productName}</td>
                    <td className="px-5 py-3 font-mono-data font-medium text-ink-900">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3 text-ink-500">{new Date(o.placedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_TONE[o.status]}>{o.status}</Badge>
                      {o.refunded && <Badge variant="outline" className="ml-1.5">Refunded</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelected(o)}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-mono-data">{selected.id}</DialogTitle>
                <Badge variant={STATUS_TONE[selected.status]}>{selected.status}</Badge>
              </div>
              <DialogDescription>{selected.productName} · {selected.buyerCompany}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-ink-500">Total</p><p className="font-mono-data font-medium text-ink-900">{formatCurrency(selected.total, selected.currency)}</p></div>
                <div><p className="text-xs text-ink-500">Quantity</p><p className="font-medium text-ink-900">{selected.quantity.toLocaleString()} {selected.unit}</p></div>
                <div><p className="text-xs text-ink-500">Placed</p><p className="text-ink-900">{new Date(selected.placedAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-ink-500">Tracking</p><p className="font-mono-data text-ink-900">{selected.trackingRef || '—'}</p></div>
              </div>

              {selected.status !== 'Cancelled' && selected.status !== 'Delivered' && (
                <div className="w-52">
                  <Label>Update status</Label>
                  <Select value={selected.status} onValueChange={updateStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.filter((s) => s !== 'Cancelled').map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="disputeNote">Dispute / resolution note</Label>
                <Textarea
                  id="disputeNote"
                  rows={3}
                  placeholder="e.g. Buyer reports short shipment — seller to reconcile with next order."
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                />
                {selected.sellerNote && <p className="mt-1.5 text-xs text-ink-500">Current note: {selected.sellerNote}</p>}
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2 sm:justify-between">
              <div className="flex gap-2">
                {selected.status !== 'Cancelled' && (
                  <Button variant="outline" size="sm" onClick={cancel} disabled={busy}>
                    <XCircle className="size-3.5" /> Cancel order
                  </Button>
                )}
                {!selected.refunded && (
                  <Button variant="destructive" size="sm" onClick={() => setRefundOpen(true)} disabled={busy}>
                    <RotateCcw className="size-3.5" /> Refund
                  </Button>
                )}
              </div>
              <Button variant="copper" size="sm" onClick={resolveDispute} loading={busy} disabled={!disputeNote}>
                Save note
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund {selected?.id}?</DialogTitle>
            <DialogDescription>This marks the order cancelled and refunded. Mock action for the prototype — no real payment is reversed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={refund} loading={busy}>Confirm refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
