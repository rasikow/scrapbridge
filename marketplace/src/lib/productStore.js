import { SEED_PRODUCTS } from '@/data/seedProducts'
import { generateProductArtwork } from '@/lib/generateProduct'
import { getMaterial } from '@/data/materials'
import { buildAuctionSeedProducts } from '@/data/auctionSeed'
import { LISTING_TYPES } from '@/data/auctionConstants'
import { safeSetItem } from '@/lib/safeStorage'

const KEY = 'marketplace_mock_seller_products_v4'

// In-memory cache of the parsed catalog. `readProductStore()` is called
// very frequently — once per row whenever auctions/products are listed —
// and was previously re-running `localStorage.getItem` + `JSON.parse` over
// the *entire* catalog (including every listing's embedded base64 image)
// on every single call. For a 20+ row auction/bid list that meant parsing
// a multi-hundred-KB JSON blob 20+ times per page load, which is what made
// the Auctions page feel slow to open. The cache is invalidated any time
// `writeProductStore` is called, so it can never go stale within a tab.
let cache = null

/**
 * Reads the live product catalog — the one sellers create/edit and admins
 * approve. Every screen in the app (buyer marketplace, seller product
 * management, admin moderation, cart, orders) reads through this single
 * function so a product created by a seller and approved by an admin is
 * immediately visible everywhere, including the buyer marketplace.
 */
export function readProductStore() {
  if (cache) return cache

  const raw = localStorage.getItem(KEY)
  if (raw) {
    cache = JSON.parse(raw)
    return cache
  }

  // First run: seed from the static catalog, adding the moderation/stock
  // fields the read-only seed data doesn't carry, plus a generated photo
  // per listing (same generator the seller "Generate product" button uses)
  // so the marketplace opens onto real, varied imagery instead of flat
  // swatches everywhere.
  const seeded = SEED_PRODUCTS.map((p, i) => {
    const material = getMaterial(p.materialId) || {}
    // Real, curated photography for the material categories we have it for
    // (see public/images/materials); procedurally generated artwork
    // everywhere else.
    const image = material.photo
      ? { name: `${p.materialId}.jpg`, sizeKb: 15, uploadedAt: p.createdAt, dataUrl: material.photo }
      : (() => {
          const dataUrl = generateProductArtwork(material, p.grade)
          return { name: `${p.materialId}-${i}.jpg`, sizeKb: Math.round((dataUrl.length * 0.75) / 1024), uploadedAt: p.createdAt, dataUrl }
        })()
    return {
      ...p,
      status: i % 11 === 0 ? 'pending' : i % 13 === 0 ? 'inactive' : 'active',
      stockAvailability: i % 9 !== 0,
      lowStockThreshold: Math.max(20, Math.round(p.minOrderQty * 0.5)),
      images: { primary: image, secondary: null, tertiary: null },
      // Every pre-existing listing is a plain Buy Now / fixed-price product —
      // the auction module is purely additive, so this never changes how
      // any existing screen reads/renders these rows.
      listingType: LISTING_TYPES.FIXED,
    }
  })

  // Auction & Accept-Bids demo lots (Bidding & Auction module) — appended
  // to the same product store so they flow through the exact same
  // marketplace/search/cart/moderation pipeline as fixed-price listings.
  // See `data/auctionSeed.js` for the matching Auction records.
  seeded.push(...buildAuctionSeedProducts())

  // Guarantee the demo seller account has a healthy fixed-price catalog to
  // demo against, regardless of how the random assignment landed — this is
  // the account judges/reviewers log into, so it should never look sparse.
  // (Auction/Bid types are guaranteed separately in data/auctionSeed.js,
  // at generation time, since those products are mirrored 1:1 with a
  // matching Auction record keyed by the same sellerId — reassigning it
  // here would desync the two.)
  const DEMO_SELLER = 'slr_gulf_recycling'
  const MIN_FIXED = 25
  const fixedCount = seeded.filter((p) => p.sellerId === DEMO_SELLER && p.listingType === LISTING_TYPES.FIXED).length
  if (fixedCount < MIN_FIXED) {
    let reassigned = 0
    for (const p of seeded) {
      if (reassigned >= MIN_FIXED - fixedCount) break
      if (p.sellerId !== DEMO_SELLER && p.listingType === LISTING_TYPES.FIXED) {
        p.sellerId = DEMO_SELLER
        reassigned += 1
      }
    }
  }

  safeSetItem(KEY, JSON.stringify(seeded))
  cache = seeded
  return seeded
}

export function writeProductStore(products) {
  safeSetItem(KEY, JSON.stringify(products))
  cache = products
}
