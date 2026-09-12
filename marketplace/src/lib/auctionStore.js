import { safeSetItem } from '@/lib/safeStorage'
// Persistence + real-time pub/sub for the Bidding & Auction module.
//
// Mirrors the pattern already used by `lib/productStore.js` and the mock
// repositories: plain localStorage-backed collections, so this is a drop-in
// swap for real Firestore collections later (see README "Connecting real
// Firebase"). Kept separate from `productStore.js` so the auction module
// never touches the existing product read/write path directly — it only
// *reads* products (via `data/products.js`) and stores its own auction/bid
// records keyed by productId.
//
// Real-time behaviour in this client-only prototype is simulated with:
//  1. A same-tab `EventTarget` (`auctionBus`) — every write dispatches a
//     `changed` event so any open auction/bid list in this tab re-renders
//     immediately without a manual refresh.
//  2. The browser's native `storage` event — localStorage writes are
//     automatically broadcast to *other tabs*, so two tabs signed in as
//     different demo accounts see each other's bids live.
//  3. A lightweight scheduler tick (see `lib/auctionEngine.js`) that both
//     runs on an interval and lazily on every read, so scheduled auctions
//     flip to live and expired auctions close even if no interval is
//     currently running (e.g. first load after time has passed).

const KEYS = {
  auctions: 'marketplace_mock_auctions_v3',
  bids: 'marketplace_mock_bids_v3',
  autoBids: 'marketplace_mock_autobids_v3',
  winners: 'marketplace_mock_auction_winners_v3',
  increments: 'marketplace_mock_bid_increment_tiers_v3',
}

export const auctionBus = new EventTarget()

function notify(kind) {
  auctionBus.dispatchEvent(new CustomEvent('changed', { detail: { kind } }))
}

function readCollection(key) {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

function writeCollection(key, value, kind) {
  safeSetItem(key, JSON.stringify(value))
  notify(kind || key)
}

// --- Auctions ---------------------------------------------------------

export function readAuctions() {
  return readCollection(KEYS.auctions) || []
}

export function writeAuctions(auctions) {
  writeCollection(KEYS.auctions, auctions, 'auctions')
}

export function seedAuctionsIfEmpty(seedFn) {
  const existing = readCollection(KEYS.auctions)
  if (existing) return existing
  const seeded = seedFn()
  safeSetItem(KEYS.auctions, JSON.stringify(seeded))
  return seeded
}

// --- Bids (immutable append-only history) ------------------------------

export function readBids() {
  return readCollection(KEYS.bids) || []
}

export function writeBids(bids) {
  writeCollection(KEYS.bids, bids, 'bids')
}

export function seedBidsIfEmpty(seedFn) {
  const existing = readCollection(KEYS.bids)
  if (existing) return existing
  const seeded = seedFn()
  safeSetItem(KEYS.bids, JSON.stringify(seeded))
  return seeded
}

// --- Auto/proxy bids -----------------------------------------------------

export function readAutoBids() {
  return readCollection(KEYS.autoBids) || []
}

export function writeAutoBids(rows) {
  writeCollection(KEYS.autoBids, rows, 'autobids')
}

// --- Winners ---------------------------------------------------------

export function readWinners() {
  return readCollection(KEYS.winners) || []
}

export function writeWinners(rows) {
  writeCollection(KEYS.winners, rows, 'winners')
}

// --- Admin-managed bid increment tiers ---------------------------------

export function readIncrementTiers(defaultTiers) {
  return readCollection(KEYS.increments) || defaultTiers
}

export function writeIncrementTiers(tiers) {
  writeCollection(KEYS.increments, tiers, 'increments')
}

export const AUCTION_STORAGE_KEYS = KEYS
