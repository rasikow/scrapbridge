import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'

export default function WishlistPage() {
  const { products, toggle, isWishlisted } = useWishlist()
  const { addItem } = useCart()

  return (
    <DashboardShell>
      <PageHeader icon={Heart} eyebrow="Saved materials" title="Wishlist" subtitle={`${products.length} saved listings`} />

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved materials yet"
          description="Tap the heart on any listing in the marketplace to track it here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlisted={isWishlisted(product.id)}
              onToggleWishlist={toggle}
              onAddToCart={(id) => { addItem(id, 1); toast.success('Added to cart') }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
