import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Power, PackageSearch, Search, Tag, HandCoins, Gavel } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { ListingTypeFlag } from '@/components/shared/ListingTypeFlag'
import { SegmentedTabs } from '@/components/shared/SegmentedTabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/product.service'
import { getMaterial } from '@/data/materials'
import { LISTING_TYPES } from '@/data/auctionConstants'
import { formatCurrency } from '@/lib/utils'

const FILTERS = ['All', 'Active', 'Pending', 'Inactive']
const STATUS_BADGE = { active: 'success', pending: 'warning', inactive: 'outline' }
const SALE_TYPE_TABS = [
  { value: 'all', label: 'All', icon: null },
  { value: LISTING_TYPES.FIXED, label: 'Fixed', icon: Tag },
  { value: LISTING_TYPES.ACCEPT_BIDS, label: 'Bid', icon: HandCoins },
  { value: 'auction_group', label: 'Auction', icon: Gavel },
]

export default function ProductsListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState(null)
  const [filter, setFilter] = useState('All')
  const [saleType, setSaleType] = useState('all')
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function reload() {
    productService.listBySeller(user.sellerId).then(setProducts)
  }

  useEffect(reload, [user.sellerId])

  const saleTypeCounts = useMemo(() => {
    const items = products || []
    return {
      all: items.length,
      [LISTING_TYPES.FIXED]: items.filter((p) => p.listingType === LISTING_TYPES.FIXED).length,
      [LISTING_TYPES.ACCEPT_BIDS]: items.filter((p) => p.listingType === LISTING_TYPES.ACCEPT_BIDS).length,
      auction_group: items.filter((p) => p.listingType === LISTING_TYPES.AUCTION || p.listingType === LISTING_TYPES.AUCTION_BUYNOW).length,
    }
  }, [products])

  const filtered = useMemo(() => {
    let items = products || []
    if (filter !== 'All') items = items.filter((p) => p.status === filter.toLowerCase())
    if (saleType === 'auction_group') items = items.filter((p) => p.listingType === LISTING_TYPES.AUCTION || p.listingType === LISTING_TYPES.AUCTION_BUYNOW)
    else if (saleType !== 'all') items = items.filter((p) => p.listingType === saleType)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q))
    }
    return items
  }, [products, filter, saleType, query])

  async function toggleActive(product) {
    const next = product.status === 'active' ? 'inactive' : 'active'
    const updated = await productService.setStatus(product.id, next)
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)))
    toast.success(next === 'active' ? 'Product activated' : 'Product deactivated')
  }

  async function confirmDelete() {
    setDeleting(true)
    await productService.deleteProduct(deleteTarget.id)
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
    toast.success('Product deleted')
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={PackageSearch}
        eyebrow="Product management"
        title="Your listings"
        subtitle="Manage stock, pricing, and visibility for everything you sell."
        actions={
          <Button variant="copper" onClick={() => navigate('/seller/products/new')}>
            <Plus className="size-4" /> Add product
          </Button>
        }
      />

      <div className="mb-4">
        <SegmentedTabs
          value={saleType}
          onChange={setSaleType}
          options={SALE_TYPE_TABS.map((t) => ({ ...t, count: saleTypeCounts[t.value] }))}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input placeholder="Search your listings…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {!products ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products here"
          description="Add your first listing to start receiving orders."
          actionLabel="Add product"
          onAction={() => navigate('/seller/products/new')}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const material = getMaterial(p.materialId)
                  const lowStock = p.stockAvailability && p.quantity <= (p.lowStockThreshold || 0)
                  return (
                    <tr key={p.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage materialId={p.materialId} className="size-11 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <Link to={`/seller/products/${p.id}/edit`} className="block max-w-[220px] truncate text-sm font-medium text-ink-900 hover:text-copper-600">
                              {p.name}
                            </Link>
                            <p className="text-xs text-ink-500">{p.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><ListingTypeFlag listingType={p.listingType} className="px-2 py-0.5" /></td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-ink-700">
                          <span className="size-2 rounded-full" style={{ backgroundColor: material?.swatch }} />
                          {material?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={lowStock ? 'font-medium text-copper-600' : 'text-ink-700'}>
                          {p.quantity.toLocaleString()} {p.unit}
                        </span>
                        {!p.stockAvailability && <span className="ml-1.5 text-xs text-signal-down">out of stock</span>}
                        {lowStock && p.stockAvailability && <span className="ml-1.5 text-xs text-copper-600">low</span>}
                      </td>
                      <td className="px-5 py-3 font-mono-data text-ink-900">{formatCurrency(p.price, p.currency)}/{p.unit}</td>
                      <td className="px-5 py-3"><Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/seller/products/${p.id}/edit`)} title="Edit">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleActive(p)} title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                            <Power className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)} title="Delete" className="hover:text-signal-down">
                            <Trash2 className="size-3.5" />
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              {deleteTarget && `"${deleteTarget.name}" will be permanently removed from the marketplace. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
