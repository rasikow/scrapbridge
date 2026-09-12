import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PackageCheck, Check, X, EyeOff, Star } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { productService } from '@/services/product.service'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { formatCurrency } from '@/lib/utils'

const FILTERS = ['Pending', 'Active', 'Inactive', 'All']
const STATUS_BADGE = { active: 'success', pending: 'warning', inactive: 'outline', hidden: 'danger' }

export default function ProductApprovalsPage() {
  const [products, setProducts] = useState(null)
  const [filter, setFilter] = useState('Pending')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')

  function reload() {
    productService.listAll().then(setProducts)
  }

  useEffect(reload, [])

  const filtered = useMemo(() => {
    if (!products) return []
    if (filter === 'All') return products
    return products.filter((p) => p.status === filter.toLowerCase())
  }, [products, filter])

  async function approve(product) {
    setBusyId(product.id)
    await productService.setStatus(product.id, 'active')
    reload()
    setBusyId(null)
    toast.success(`${product.name} approved`)
  }

  async function confirmReject() {
    setBusyId(rejectTarget.id)
    await productService.setStatus(rejectTarget.id, 'inactive')
    await productService.setModerationNote(rejectTarget.id, reason)
    reload()
    setBusyId(null)
    setRejectTarget(null)
    setReason('')
    toast.success('Listing rejected')
  }

  async function hide(product) {
    setBusyId(product.id)
    await productService.setStatus(product.id, 'hidden')
    reload()
    setBusyId(null)
    toast.success(`${product.name} hidden from marketplace`)
  }

  async function toggleFeatured(product) {
    setBusyId(product.id)
    await productService.setFeatured(product.id, !product.featured)
    reload()
    setBusyId(null)
    toast.success(product.featured ? 'Removed from featured' : 'Marked as featured')
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={PackageCheck} eyebrow="Platform-wide" title="Product approvals" subtitle="Review new listings before they go live on the marketplace." />

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>
          {FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {!products ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Nothing to review" description="Listings matching this filter will show up here." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Seller</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const material = getMaterial(p.materialId)
                  const seller = getSeller(p.sellerId)
                  return (
                    <tr key={p.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage materialId={p.materialId} className="size-11 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">{p.name}</p>
                              {p.featured && <Star className="size-3.5 shrink-0 fill-copper-400 text-copper-400" />}
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-ink-500">
                              <span className="size-1.5 rounded-full" style={{ backgroundColor: material?.swatch }} />
                              {material?.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-700">{seller?.companyName || p.sellerId}</td>
                      <td className="px-5 py-3 font-mono-data text-ink-900">{formatCurrency(p.price, p.currency)}/{p.unit}</td>
                      <td className="px-5 py-3"><Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'pending' && (
                            <Button size="sm" variant="copper" onClick={() => approve(p)} loading={busyId === p.id}>
                              <Check className="size-3.5" /> Approve
                            </Button>
                          )}
                          {p.status !== 'inactive' && (
                            <Button size="sm" variant="outline" onClick={() => setRejectTarget(p)} disabled={busyId === p.id}>
                              <X className="size-3.5" />
                            </Button>
                          )}
                          {p.status === 'active' && (
                            <Button size="sm" variant="ghost" onClick={() => hide(p)} disabled={busyId === p.id} title="Hide">
                              <EyeOff className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeatured(p)}
                            disabled={busyId === p.id}
                            title={p.featured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className={p.featured ? 'size-3.5 fill-copper-400 text-copper-400' : 'size-3.5'} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this listing?</DialogTitle>
            <DialogDescription>{rejectTarget && `"${rejectTarget.name}" will be marked inactive and hidden from the marketplace.`}</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="moderationReason">Reason (shown to the seller)</Label>
            <Textarea id="moderationReason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Listing images do not match description." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} loading={busyId === rejectTarget?.id}>Reject listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
