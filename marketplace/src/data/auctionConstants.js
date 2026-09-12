// Shared constants/enums for the Bidding & Auction module.
// Kept separate from materials.js/orderStatus.js (existing data files) so
// the auction module is additive and never mutates existing exports.

export const LISTING_TYPES = {
  FIXED: 'fixed', // Buy Now / Fixed price — the existing, unmodified flow
  ACCEPT_BIDS: 'accept_bids', // Open offer/negotiation-style bidding, no hard countdown
  AUCTION: 'auction', // Time-boxed competitive auction
  AUCTION_BUYNOW: 'auction_buynow', // Auction with an instant Buy Now escape hatch
}

export const LISTING_TYPE_LABEL = {
  [LISTING_TYPES.FIXED]: 'Buy Now / Fixed Price',
  [LISTING_TYPES.ACCEPT_BIDS]: 'Accept Bids',
  [LISTING_TYPES.AUCTION]: 'Auction',
  [LISTING_TYPES.AUCTION_BUYNOW]: 'Buy Now + Auction',
}

export const AUCTION_TYPES = new Set([
  LISTING_TYPES.ACCEPT_BIDS,
  LISTING_TYPES.AUCTION,
  LISTING_TYPES.AUCTION_BUYNOW,
])

export const PRICING_UNITS = {
  PER_KG: 'per_kg',
  PER_TON: 'per_ton',
  PER_UNIT: 'per_unit',
  PER_LOT: 'per_lot',
}

export const PRICING_UNIT_LABEL = {
  [PRICING_UNITS.PER_KG]: 'per kg',
  [PRICING_UNITS.PER_TON]: 'per ton',
  [PRICING_UNITS.PER_UNIT]: 'per unit',
  [PRICING_UNITS.PER_LOT]: 'per lot (total)',
}

// Auction lifecycle. `draft` and `pending_approval` gate on the existing
// product-moderation flow; everything after that is driven by the
// scheduler (see lib/auctionEngine.js) comparing startAt/endAt to "now".
export const AUCTION_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  RESERVE_NOT_MET: 'reserve_not_met',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
}

export const AUCTION_STATUS_LABEL = {
  [AUCTION_STATUS.DRAFT]: 'Draft',
  [AUCTION_STATUS.PENDING_APPROVAL]: 'Pending approval',
  [AUCTION_STATUS.SCHEDULED]: 'Scheduled',
  [AUCTION_STATUS.LIVE]: 'Live',
  [AUCTION_STATUS.COMPLETED]: 'Completed',
  [AUCTION_STATUS.RESERVE_NOT_MET]: 'Reserve price not met',
  [AUCTION_STATUS.CANCELLED]: 'Cancelled',
  [AUCTION_STATUS.PAUSED]: 'Paused',
}

export const AUCTION_STATUS_TONE = {
  [AUCTION_STATUS.DRAFT]: 'default',
  [AUCTION_STATUS.PENDING_APPROVAL]: 'warning',
  [AUCTION_STATUS.SCHEDULED]: 'verdigris',
  [AUCTION_STATUS.LIVE]: 'success',
  [AUCTION_STATUS.COMPLETED]: 'copper',
  [AUCTION_STATUS.RESERVE_NOT_MET]: 'warning',
  [AUCTION_STATUS.CANCELLED]: 'danger',
  [AUCTION_STATUS.PAUSED]: 'outline',
}

export const AUCTION_VISIBILITY = {
  PUBLIC: 'public',
  INVITE_ONLY: 'invite_only',
  VERIFIED_BUYERS_ONLY: 'verified_buyers_only',
}

export const AUCTION_VISIBILITY_LABEL = {
  [AUCTION_VISIBILITY.PUBLIC]: 'Public — all buyers',
  [AUCTION_VISIBILITY.INVITE_ONLY]: 'Invite-only',
  [AUCTION_VISIBILITY.VERIFIED_BUYERS_ONLY]: 'Verified buyers only',
}

export const PICKUP_OPTIONS = ['Seller pickup', 'Buyer arranged freight', 'Seller delivery (extra cost)', 'Ex-works']

export const PAYMENT_TERMS = ['100% advance', '50% advance / 50% on delivery', 'Letter of credit (LC)', 'Net 15', 'Net 30']

export const BID_STATUS = {
  ACTIVE: 'active', // currently the visible bid record for that buyer
  WINNING: 'winning',
  OUTBID: 'outbid',
  WON: 'won',
  LOST: 'lost',
  RETRACTED: 'retracted',
}

// Default bid-increment tiers admins can manage (Section 12 — "manage bid
// increments"), applied when a seller doesn't set a custom increment.
export const DEFAULT_INCREMENT_TIERS = [
  { upTo: 100, increment: 1 },
  { upTo: 1000, increment: 5 },
  { upTo: 10000, increment: 25 },
  { upTo: 100000, increment: 100 },
  { upTo: Infinity, increment: 500 },
]
