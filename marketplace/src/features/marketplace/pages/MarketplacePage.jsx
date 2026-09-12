import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, PackageSearch, Star, Tag, HandCoins, Gavel, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductCard } from '@/components/shared/ProductCard'
import { SegmentedTabs } from '@/components/shared/SegmentedTabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MATERIAL_CATEGORIES, LOCATIONS } from '@/data/materials'
import { searchProducts } from '@/data/products'
import { getSeller } from '@/data/sellers'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'
import { auctionService } from '@/services/auction.service'
import { AUCTION_TYPES, LISTING_TYPES } from '@/data/auctionConstants'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9

const SALE_TYPE_TABS = [
  { value: 'all', label: 'All', icon: null },
  { value: LISTING_TYPES.FIXED, label: 'Fixed', icon: Tag },
  { value: LISTING_TYPES.ACCEPT_BIDS, label: 'Bid', icon: HandCoins },
  { value: 'auction_group', label: 'Auction', icon: Gavel },
]

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState('latest')
  const [saleType, setSaleType] = useState('all')
  const [view, setView] = useState('grid')
  const [auctionByProduct, setAuctionByProduct] = useState(new Map())

  const query = searchParams.get('q') || ''

  const { toggle: toggleWishlist, isWishlisted } = useWishlist()
  const { addItem } = useCart()

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
  }, [query, selectedMaterials, location, minPrice, maxPrice, minRating, sort])

  // Batch-load live auction snapshots once (rather than one fetch per card)
  // so every auction/bid tile on the grid can show real current-bid,
  // bid-count and countdown data, refreshed live via the auction bus.
  useEffect(() => {
    function reload() {
      auctionService.listAuctions({ visibleOnly: true }).then((rows) => {
        setAuctionByProduct(new Map(rows.map((a) => [a.productId, a])))
      })
    }
    reload()
    auctionService.bus.addEventListener('changed', reload)
    const interval = setInterval(reload, 5000)
    return () => {
      auctionService.bus.removeEventListener('changed', reload)
      clearInterval(interval)
    }
  }, [])

  const results = useMemo(() => {
    let items = searchProducts({
      query,
      location: location || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    })
    if (selectedMaterials.length > 0) {
      items = items.filter((p) => selectedMaterials.includes(p.materialId))
    }
    if (minRating > 0) {
      items = items.filter((p) => (getSeller(p.sellerId)?.rating || 0) >= minRating)
    }
    return items
  }, [query, selectedMaterials, location, minPrice, maxPrice, minRating, sort])

  const saleTypeCounts = useMemo(() => ({
    all: results.length,
    [LISTING_TYPES.FIXED]: results.filter((p) => p.listingType === LISTING_TYPES.FIXED).length,
    [LISTING_TYPES.ACCEPT_BIDS]: results.filter((p) => p.listingType === LISTING_TYPES.ACCEPT_BIDS).length,
    auction_group: results.filter((p) => p.listingType === LISTING_TYPES.AUCTION || p.listingType === LISTING_TYPES.AUCTION_BUYNOW).length,
  }), [results])

  const tabbedResults = useMemo(() => {
    if (saleType === 'all') return results
    if (saleType === 'auction_group') return results.filter((p) => p.listingType === LISTING_TYPES.AUCTION || p.listingType === LISTING_TYPES.AUCTION_BUYNOW)
    return results.filter((p) => p.listingType === saleType)
  }, [results, saleType])

  useEffect(() => setPage(1), [tabbedResults.length, saleType])

  const totalPages = Math.max(1, Math.ceil(tabbedResults.length / PAGE_SIZE))
  const pageItems = tabbedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleMaterial(id) {
    setSelectedMaterials((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  function clearFilters() {
    setSelectedMaterials([])
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
    setSearchParams({})
  }

  function handleAddToCart(productId) {
    addItem(productId, 1)
    toast.success('Added to cart')
  }

  const activeFilterCount =
    selectedMaterials.length + (location ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minRating ? 1 : 0)

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Material</p>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {MATERIAL_CATEGORIES.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={selectedMaterials.includes(m.id)} onCheckedChange={() => toggleMaterial(m.id)} />
              <span className="size-2 rounded-full" style={{ backgroundColor: m.swatch }} />
              <span className="text-sm text-ink-700">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Location</p>
        <Select value={location || undefined} onValueChange={setLocation}>
          <SelectTrigger><SelectValue placeholder="Any location" /></SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Price range (per unit)</p>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <span className="text-ink-300">–</span>
          <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Seller rating</p>
        <div className="flex gap-2">
          {[4, 4.5, 4.8].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                minRating === r ? 'border-copper-500 bg-copper-100 text-copper-600' : 'border-ink-300/40 text-ink-500 hover:border-ink-300'
              )}
            >
              <Star className="size-3 fill-current" /> {r}+
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="size-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <DashboardShell>
      <PageHeader
        icon={PackageSearch}
        eyebrow="Marketplace"
        title={query ? `Results for "${query}"` : 'Browse materials'}
        subtitle={`${tabbedResults.length} listings found across ${MATERIAL_CATEGORIES.length} material categories`}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </>
        }
      />

      <div className="mb-6 -mt-2 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          value={saleType}
          onChange={setSaleType}
          options={SALE_TYPE_TABS.map((t) => ({ ...t, count: saleTypeCounts[t.value] }))}
        />
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-paper-300 bg-white p-0.5">
            <button
              onClick={() => setView('grid')}
              aria-label="Grid view"
              className={cn('rounded-[5px] p-1.5 transition-colors', view === 'grid' ? 'bg-copper-500 text-white' : 'text-ink-500 hover:bg-paper-200')}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setView('list')}
              aria-label="List view"
              className={cn('rounded-[5px] p-1.5 transition-colors', view === 'list' ? 'bg-copper-500 text-white' : 'text-ink-500 hover:bg-paper-200')}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 lg:block lg:h-fit lg:sticky lg:top-20">
          {FilterPanel}
        </aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-graphite-900/50" onClick={() => setFiltersOpen(false)} />
            <div className="relative ml-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display font-semibold text-ink-900">Filters</p>
                <button onClick={() => setFiltersOpen(false)}><X className="size-5 text-ink-500" /></button>
              </div>
              {FilterPanel}
              <Button variant="copper" className="mt-6" onClick={() => setFiltersOpen(false)}>
                Show {tabbedResults.length} results
              </Button>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No materials match those filters"
              description="Try widening your price range or clearing a filter to see more listings."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className={cn('grid gap-5', view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                {pageItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    auction={AUCTION_TYPES.has(product.listingType) ? auctionByProduct.get(product.id) : undefined}
                    wishlisted={isWishlisted(product.id)}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={handleAddToCart}
                    layout={view}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        'size-8 rounded-[var(--radius-sm)] text-sm font-medium',
                        page === i + 1 ? 'bg-graphite-900 text-white' : 'text-ink-500 hover:bg-paper-200'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
