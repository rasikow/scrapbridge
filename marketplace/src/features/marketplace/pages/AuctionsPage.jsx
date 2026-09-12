import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gavel, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { AuctionCard } from '@/components/auction/AuctionCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { auctionService } from '@/services/auction.service'
import { MATERIAL_CATEGORIES } from '@/data/materials'
import { AUCTION_STATUS } from '@/data/auctionConstants'

const FILTERS = [
  { label: 'All live & upcoming', statuses: [AUCTION_STATUS.LIVE, AUCTION_STATUS.SCHEDULED] },
  { label: 'Live now', statuses: [AUCTION_STATUS.LIVE] },
  { label: 'Starting soon', statuses: [AUCTION_STATUS.SCHEDULED] },
  { label: 'Recently ended', statuses: [AUCTION_STATUS.COMPLETED] },
]

export default function AuctionsPage() {
  const [searchParams] = useSearchParams()
  const [auctions, setAuctions] = useState(null)
  const [filterIdx, setFilterIdx] = useState(0)
  const [materialId, setMaterialId] = useState(searchParams.get('material') || 'all')
  const [query, setQuery] = useState('')

  function reload() {
    auctionService
      .listAuctions({ statuses: FILTERS[filterIdx].statuses, materialId: materialId === 'all' ? undefined : materialId, query: query || undefined })
      .then(setAuctions)
  }

  useEffect(reload, [filterIdx, materialId, query])
  useEffect(() => {
    const handler = () => reload()
    auctionService.bus.addEventListener('changed', handler)
    return () => auctionService.bus.removeEventListener('changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, materialId, query])

  return (
    <DashboardShell>
      <PageHeader
        icon={Gavel}
        eyebrow="Bidding & Auctions"
        title="Auction marketplace"
        subtitle="Bid on scrap lots priced per kg, per ton, per unit or per lot — live, transparent, and closing on schedule."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={String(filterIdx)} onValueChange={(v) => setFilterIdx(Number(v))}>
          <TabsList>
            {FILTERS.map((f, i) => <TabsTrigger key={f.label} value={String(i)}>{f.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2.5">
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All materials" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All materials</SelectItem>
              {MATERIAL_CATEGORIES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
            <Input placeholder="Search auctions…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {!auctions ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState icon={Gavel} title="No auctions here" description="Try a different filter or check back soon — new lots are added regularly." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {auctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      )}
    </DashboardShell>
  )
}
