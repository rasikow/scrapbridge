// Pure(ish) business logic for the auction module — increment/minimum-bid
// math, proxy/auto-bid resolution, validation, and the scheduler tick that
// moves auctions through their lifecycle (scheduled → live → completed /
// reserve_not_met). Kept free of localStorage reads/writes so it's easy to
// unit test and to eventually port server-side (e.g. into a Cloud Function
// cron) without change — only `mockAuctionRepository.js` touches storage.

import { AUCTION_STATUS, LISTING_TYPES, DEFAULT_INCREMENT_TIERS, PRICING_UNIT_LABEL } from '@/data/auctionConstants'

export function tierIncrement(amount, tiers = DEFAULT_INCREMENT_TIERS) {
  const tier = tiers.find((t) => amount <= t.upTo)
  return tier ? tier.increment : tiers[tiers.length - 1].increment
}

export function effectiveIncrement(auction, tiers) {
  return auction.bidIncrement || tierIncrement(auction.currentBid ?? auction.startingBid, tiers)
}

/** The lowest amount a new bid/max must meet to be accepted right now. */
export function minNextBid(auction, tiers) {
  if (!auction.bidCount) return auction.startingBid
  return round2(auction.currentBid + effectiveIncrement(auction, tiers))
}

export function isAuctionOpenForBidding(auction) {
  if (![AUCTION_STATUS.LIVE].includes(auction.status)) return false
  const now = Date.now()
  if (auction.startAt && new Date(auction.startAt).getTime() > now) return false
  if (auction.endAt && new Date(auction.endAt).getTime() <= now) return false
  return true
}

export function isSellerOfAuction(auction, user) {
  if (!user) return false
  if (user.role === 'seller' && user.sellerId === auction.sellerId) return true
  return false
}

export class AuctionValidationError extends Error {}

/**
 * Validates a bid/auto-bid submission against the current auction state.
 * Throws `AuctionValidationError` with a user-facing message on failure.
 */
export function validateBidSubmission({ auction, user, amount, maxAmount, tiers }) {
  if (!auction) throw new AuctionValidationError('Auction not found.')
  if (isSellerOfAuction(auction, user)) {
    throw new AuctionValidationError('Sellers cannot bid on their own auction.')
  }
  if (!isAuctionOpenForBidding(auction)) {
    if (auction.status === AUCTION_STATUS.SCHEDULED) throw new AuctionValidationError('This auction has not started yet.')
    throw new AuctionValidationError('This auction is no longer accepting bids.')
  }
  const proposedMax = maxAmount != null ? Number(maxAmount) : Number(amount)
  const proposedAmount = Number(amount)
  if (!Number.isFinite(proposedAmount) || proposedAmount <= 0) {
    throw new AuctionValidationError('Enter a valid bid amount.')
  }
  if (maxAmount != null && (!Number.isFinite(proposedMax) || proposedMax < proposedAmount)) {
    throw new AuctionValidationError('Your maximum bid must be greater than or equal to your bid amount.')
  }
  const floor = minNextBid(auction, tiers)
  if (proposedAmount < floor) {
    throw new AuctionValidationError(`Your bid must be at least ${floor.toLocaleString()} (the current minimum next bid).`)
  }
  const existingMax = auction.bidderMaxes?.[user.id]
  if (existingMax != null && proposedMax <= existingMax) {
    throw new AuctionValidationError('You already have a standing bid at or above this amount.')
  }
  return { proposedAmount, proposedMax, floor }
}

/**
 * Applies a validated bid/auto-bid: updates the per-buyer standing-maximum
 * map, resolves the new leader via standard proxy-bidding rules (the
 * visible current bid only rises as far as needed to beat the
 * second-highest standing maximum), and returns the new auction fields
 * plus enough detail for the caller to write bid history + notifications.
 */
export function applyBid({ auction, user, proposedMax, tiers }) {
  const increment = effectiveIncrement(auction, tiers)
  const previousLeaderId = auction.currentBidderId
  const bidderMaxes = { ...(auction.bidderMaxes || {}), [user.id]: proposedMax }

  const entries = Object.entries(bidderMaxes).sort((a, b) => b[1] - a[1])
  const [leaderId, leaderMax] = entries[0]
  const secondMax = entries[1] ? entries[1][1] : auction.startingBid - increment
  let currentBid = Math.min(leaderMax, round2(secondMax + increment))
  if (currentBid < auction.startingBid) currentBid = auction.startingBid
  currentBid = round2(currentBid)

  const bidderIds = Array.from(new Set([...(auction.bidderIds || []), user.id]))
  const reserveMet = !auction.reservePrice || currentBid >= auction.reservePrice

  const buyNowTriggered =
    auction.buyNowPrice != null &&
    [LISTING_TYPES.AUCTION_BUYNOW].includes(auction.listingType) &&
    proposedMax >= auction.buyNowPrice

  return {
    auctionPatch: {
      bidderMaxes,
      currentBid: buyNowTriggered ? auction.buyNowPrice : currentBid,
      currentBidderId: leaderId,
      bidCount: (auction.bidCount || 0) + 1,
      bidderIds,
      reserveMet,
    },
    leaderId,
    previousLeaderId,
    leaderChanged: leaderId !== previousLeaderId,
    outbidBuyerId: previousLeaderId && previousLeaderId !== leaderId ? previousLeaderId : null,
    buyNowTriggered,
  }
}

/**
 * Determines the outcome of an auction that has reached its end time (or is
 * being force-closed by a seller/admin). Does not mutate — returns the
 * patch to apply.
 */
export function resolveClose(auction, { forcedWinnerId, acceptBelowReserve } = {}) {
  if (!auction.bidCount) {
    return { status: AUCTION_STATUS.COMPLETED, outcome: 'no_bids', winnerId: null, winningBid: null }
  }
  const winnerId = forcedWinnerId || auction.currentBidderId
  const winningBid = auction.bidderMaxes?.[winnerId] != null
    ? Math.min(auction.currentBid, auction.bidderMaxes[winnerId])
    : auction.currentBid
  const reserveMet = !auction.reservePrice || winningBid >= auction.reservePrice

  if (!reserveMet && !acceptBelowReserve) {
    return { status: AUCTION_STATUS.RESERVE_NOT_MET, outcome: 'reserve_not_met', winnerId: null, winningBid: null }
  }
  return {
    status: AUCTION_STATUS.COMPLETED,
    outcome: acceptBelowReserve && !reserveMet ? 'sold_below_reserve' : 'sold',
    winnerId,
    winningBid: acceptBelowReserve && !reserveMet ? auction.currentBid : winningBid,
  }
}

export function estimatedLotValue(auction, priceOverride) {
  const unitPrice = priceOverride ?? auction.currentBid ?? auction.startingBid
  if (auction.pricingUnit === 'per_lot') return unitPrice
  return round2(unitPrice * auction.lotQuantity)
}

export function formatUnitLabel(auction) {
  return PRICING_UNIT_LABEL[auction.pricingUnit] || auction.pricingUnit
}

export function timeRemainingMs(endAt) {
  if (!endAt) return null
  return new Date(endAt).getTime() - Date.now()
}

export function formatDuration(ms) {
  if (ms == null) return 'Open-ended'
  if (ms <= 0) return 'Ended'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Buyer-facing anonymization (brief section 3): other bidders are shown as
 * a stable "Bidder N" label derived from the order they first appear in
 * `bidderIds`, never their company name. Sellers and admins always see the
 * real name (needed for fulfillment, moderation and dispute handling).
 */
export function anonymizedLabel({ auction, bidderId, bidderName, viewer }) {
  if (!viewer) return 'Bidder'
  if (viewer.id === bidderId) return 'You'
  const canSeeRealNames = viewer.role === 'admin' || (viewer.role === 'seller' && viewer.sellerId === auction.sellerId)
  if (canSeeRealNames) return bidderName
  const idx = (auction.bidderIds || []).indexOf(bidderId)
  return `Bidder ${idx === -1 ? '?' : idx + 1}`
}

function round2(n) {
  return Math.round(n * 100) / 100
}
