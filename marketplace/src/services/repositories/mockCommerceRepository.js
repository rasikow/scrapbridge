import { safeSetItem } from '@/lib/safeStorage'
// Mirrors the `carts` and `wishlists` Firestore collections — one document
// per user, keyed by userId, holding an array of productIds (wishlist) or
// { productId, quantity } line items (cart). Recently-viewed is a small
// capped MRU list, not in the original collection list but stored the same
// way for the dashboard "Recently Viewed" widget.

const CART_KEY = 'marketplace_mock_carts_v1'
const WISHLIST_KEY = 'marketplace_mock_wishlists_v1'
const RECENT_KEY = 'marketplace_mock_recent_v1'

function readMap(key) {
  return JSON.parse(localStorage.getItem(key) || '{}')
}
function writeMap(key, map) {
  safeSetItem(key, JSON.stringify(map))
}

export const cartStore = {
  get(userId) {
    return readMap(CART_KEY)[userId] || []
  },
  set(userId, items) {
    const map = readMap(CART_KEY)
    map[userId] = items
    writeMap(CART_KEY, map)
    return items
  },
  clear(userId) {
    const map = readMap(CART_KEY)
    delete map[userId]
    writeMap(CART_KEY, map)
  },
}

export const wishlistStore = {
  get(userId) {
    return readMap(WISHLIST_KEY)[userId] || []
  },
  set(userId, productIds) {
    const map = readMap(WISHLIST_KEY)
    map[userId] = productIds
    writeMap(WISHLIST_KEY, map)
    return productIds
  },
}

export const recentlyViewedStore = {
  get(userId) {
    return readMap(RECENT_KEY)[userId] || []
  },
  push(userId, productId) {
    const map = readMap(RECENT_KEY)
    const existing = (map[userId] || []).filter((id) => id !== productId)
    map[userId] = [productId, ...existing].slice(0, 8)
    writeMap(RECENT_KEY, map)
    return map[userId]
  },
}
