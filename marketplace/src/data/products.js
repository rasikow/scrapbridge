import { getSeller } from '@/data/sellers'
import { readProductStore } from '@/lib/productStore'

// Buyer-facing product catalog. Reads live from the same store sellers
// create/edit against and admins moderate — see `lib/productStore.js`.
// Nothing here is a static snapshot, so a product created by a seller and
// approved by an admin appears here immediately.

export function getProduct(id) {
  // Used across roles (cart, wishlist, order line items, seller/admin
  // detail views) to look up a product by id regardless of its current
  // moderation status — an order placed against a since-deactivated
  // product should still be able to render its name/details.
  return readProductStore().find((p) => p.id === id)
}

/** Buyer marketplace browse/search — only ever shows admin-approved listings. */
export function searchProducts({ query, materialId, location, minPrice, maxPrice, minRating, sort } = {}) {
  let results = readProductStore().filter((p) => p.status === 'active')

  if (query) {
    const q = query.toLowerCase()
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q)
    )
  }
  if (materialId) results = results.filter((p) => p.materialId === materialId)
  if (location) results = results.filter((p) => p.location === location)
  if (minPrice != null) results = results.filter((p) => p.price >= minPrice)
  if (maxPrice != null) results = results.filter((p) => p.price <= maxPrice)
  if (minRating != null) {
    results = results.filter((p) => (getSeller(p.sellerId)?.rating || 0) >= minRating)
  }

  switch (sort) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      results.sort((a, b) => b.price - a.price)
      break
    case 'latest':
    default:
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  return results
}

/** Active, buyer-visible products — used for "related products" style queries. */
export function getActiveProducts() {
  return readProductStore().filter((p) => p.status === 'active')
}
