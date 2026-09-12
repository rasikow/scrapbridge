import { sleep, generateRefCode } from '@/lib/utils'
import { getProduct } from '@/data/products'
import { getSeller } from '@/data/sellers'
import {
  readAuctions, writeAuctions, seedAuctionsIfEmpty,
  readBids, writeBids, seedBidsIfEmpty,
  readAutoBids, writeAutoBids,
  readWinners, writeWinners,
  readIncrementTiers, writeIncrementTiers,
  auctionBus,
} from '@/lib/auctionStore'
import {
  applyBid, validateBidSubmission, resolveClose, minNextBid,
} from '@/lib/auctionEngine'
import { AUCTION_STATUS, DEFAULT_INCREMENT_TIERS } from '@/data/auctionConstants'
import { buildAuctionSeedAuctions } from '@/data/auctionSeed'
import { recordAuditEvent } from '@/services/repositories/mockAuditRepository'
import { pushNotification } from '@/lib/notificationStore'
import { orderService } from '@/services/order.service'
import { productService } from '@/services/product.service'

// --- Seeding -------------------------------------------------------------

function seedAuctionsAndBids() {
  const bids = []
  const autoBids = []
  const baseAuctions = buildAuctionSeedAuctions().map((a) => {
    const ladder = a._seedBidLadder || []
    let working = { ...a }
    delete working._seedBidLadder
    for (const step of ladder) {
      const user = { id: step.bidder.id, role: 'buyer' }
      const proposedMax = step.maxAmount ?? step.amount
      const { auctionPatch } = applyBid({ auction: working, user, proposedMax, tiers: DEFAULT_INCREMENT_TIERS })
      working = { ...working, ...auctionPatch }
      bids.push({
        id: `BID-${generateRefCode().replace('REF-', '')}-${bids.length}`,
        auctionId: working.id,
        buyerId: step.bidder.id,
        buyerName: step.bidder.name,
        amount: working.currentBid,
        maxAmount: proposedMax,
        isAutoBid: step.maxAmount != null && step.maxAmount !== step.amount,
        status: 'active',
        timestamp: new Date(Date.now() - step.hAgo * 3600000).toISOString(),
      })
      if (step.maxAmount != null) {
        autoBids.push({
          id: `AB-${generateRefCode().replace('REF-', '')}`,
          auctionId: working.id,
          buyerId: step.bidder.id,
          maxAmount: step.maxAmount,
          active: true,
          createdAt: new Date(Date.now() - step.hAgo * 3600000).toISOString(),
          updatedAt: new Date(Date.now() - step.hAgo * 3600000).toISOString(),
        })
      }
    }
    // Mark historical bid statuses (winning/outbid/won/lost) for completed lots
    if ([AUCTION_STATUS.COMPLETED, AUCTION_STATUS.RESERVE_NOT_MET].includes(working.status) && working.bidCount) {
      const isSold = working.status === AUCTION_STATUS.COMPLETED
      working.winnerId = isSold ? working.currentBidderId : null
      working.winningBid = isSold ? working.currentBid : null
      working.outcome = isSold ? 'sold' : 'reserve_not_met'
    }
    working.lastSimAt = 0
    return working
  })

  for (const b of bids) {
    const auction = baseAuctions.find((a) => a.id === b.auctionId)
    if (!auction) continue
    if (auction.status === AUCTION_STATUS.COMPLETED && b.buyerId === auction.winnerId) b.status = 'won'
    else if (auction.status === AUCTION_STATUS.COMPLETED) b.status = 'lost'
    else if (b.buyerId === auction.currentBidderId) b.status = 'winning'
    else b.status = 'outbid'
  }

  seedBidsIfEmpty(() => bids)
  if (autoBids.length) writeAutoBids(autoBids)
  return baseAuctions
}

function ensureSeeded() {
  seedAuctionsIfEmpty(() => seedAuctionsAndBids())
}

// --- Scheduler -------------------------------------------------------

const BIDDER_NAME_POOL = [
  'Falcon Traders FZE', 'Ironbridge Commodities Ltd', 'Pacific Rim Materials Pte',
  'Horizon Metal Recovery', 'Atlas Salvage & Trading', 'Continental Metal Buyers',
]
const BIDDER_ID_POOL = ['byr_falcon', 'byr_ironbridge', 'byr_pacific', 'byr_horizon', 'byr_atlas', 'byr_continental']

function maybeSimulateActivity(auction) {
  if (!auction.simulateActivity) return null
  if (auction.status !== AUCTION_STATUS.LIVE) return null
  if (auction.endAt && new Date(auction.endAt).getTime() <= Date.now()) return null
  const lastSim = auction.lastSimAt || 0
  if (Date.now() - lastSim < 15000) return null
  if (Math.random() > 0.4) return null

  const pool = BIDDER_ID_POOL.map((id, i) => ({ id, name: BIDDER_NAME_POOL[i] })).filter((b) => b.id !== auction.currentBidderId)
  const bidder = pool[Math.floor(Math.random() * pool.length)]
  const tiers = readIncrementTiers(DEFAULT_INCREMENT_TIERS)
  const floor = minNextBid(auction, tiers)
  const bump = Math.round(Math.random() * 3) * ((auction.bidIncrement || 1))
  const proposedMax = Math.round((floor + bump) * 100) / 100
  if (auction.buyNowPrice && proposedMax >= auction.buyNowPrice) return null // never let the bot auto-close a demo auction

  const { auctionPatch } = applyBid({ auction, user: { id: bidder.id }, proposedMax, tiers })
  return { bidder, auctionPatch: { ...auctionPatch, lastSimAt: Date.now() } }
}

/**
 * Advances every auction to its correct current state: flips scheduled →
 * live, closes expired live auctions (reserve check + winner + order +
 * notifications), and — for demo lots flagged `simulateActivity` — injects
 * an occasional competing bid so open tabs see genuine live movement. Runs
 * lazily on every repository read *and* on an interval (see
 * `useAuctionScheduler` hook mounted once in `App.jsx`), so state is always
 * correct even if the interval hasn't ticked yet.
 */
export function tickAuctions() {
  ensureSeeded()
  const auctions = readAuctions()
  const bids = readBids()
  const winners = readWinners()
  let auctionsChanged = false
  let bidsChanged = false
  let winnersChanged = false
  const now = Date.now()

  const nextAuctions = auctions.map((auction) => {
    let working = auction

    if (working.status === AUCTION_STATUS.SCHEDULED && working.startAt && new Date(working.startAt).getTime() <= now) {
      working = { ...working, status: AUCTION_STATUS.LIVE }
      auctionsChanged = true
      pushNotification({
        userId: sellerUserIdFor(working.sellerId), role: 'seller', tone: 'verdigris',
        title: 'Your auction is now live', body: `${productLabel(working)} is now accepting bids.`,
        meta: { auctionId: working.id, productId: working.productId },
      })
    }

    if (working.status === AUCTION_STATUS.LIVE && working.endAt && new Date(working.endAt).getTime() <= now) {
      const patch = resolveClose(working)
      working = { ...working, ...patch }
      auctionsChanged = true
      const outcome = closeSideEffects(working, bids, winners)
      if (outcome.bidsChanged) bidsChanged = true
      if (outcome.winnersChanged) winnersChanged = true
    } else if (working.status === AUCTION_STATUS.LIVE) {
      const sim = maybeSimulateActivity(working)
      if (sim) {
        const previousLeader = working.currentBidderId
        working = { ...working, ...sim.auctionPatch }
        auctionsChanged = true
        bids.push({
          id: `BID-${generateRefCode().replace('REF-', '')}`,
          auctionId: working.id,
          buyerId: sim.bidder.id,
          buyerName: sim.bidder.name,
          amount: working.currentBid,
          maxAmount: sim.auctionPatch.bidderMaxes[sim.bidder.id],
          isAutoBid: false,
          status: 'winning',
          timestamp: new Date().toISOString(),
        })
        bidsChanged = true
        if (previousLeader && previousLeader !== working.currentBidderId) {
          markOutbid(bids, working.id, previousLeader)
          bidsChanged = true
          if (isRealBuyer(previousLeader)) {
            pushNotification({
              userId: previousLeader, role: 'buyer', tone: 'warning',
              title: 'You have been outbid', body: `Someone placed a higher bid on ${productLabel(working)}. New leading bid: ${working.currentBid.toLocaleString()} ${working.currency}.`,
              meta: { auctionId: working.id, productId: working.productId },
            })
          }
        }
      }
    }

    return working
  })

  if (auctionsChanged) writeAuctions(nextAuctions)
  if (bidsChanged) writeBids(bids)
  if (winnersChanged) writeWinners(winners)
}

function closeSideEffects(auction, bids, winners) {
  let bidsChanged = false
  let winnersChanged = false
  const product = getProduct(auction.productId)
  const seller = getSeller(auction.sellerId)

  // Update every bid's terminal status
  for (const b of bids) {
    if (b.auctionId !== auction.id) continue
    if (auction.status === AUCTION_STATUS.COMPLETED) b.status = b.buyerId === auction.winnerId ? 'won' : 'lost'
    bidsChanged = true
  }

  if (auction.status === AUCTION_STATUS.RESERVE_NOT_MET) {
    pushNotification({
      userId: sellerUserIdFor(auction.sellerId), role: 'seller', tone: 'warning',
      title: 'Reserve price not met', body: `${productLabel(auction)} closed at ${auction.currentBid.toLocaleString()} ${auction.currency}, below your reserve. Accept the highest bid or relist.`,
      meta: { auctionId: auction.id, productId: auction.productId },
    })
    if (isRealBuyer(auction.currentBidderId)) {
      pushNotification({
        userId: auction.currentBidderId, role: 'buyer', tone: 'warning',
        title: 'Auction ended — reserve not met', body: `Your bid on ${productLabel(auction)} was the highest, but the seller's reserve price wasn't met.`,
        meta: { auctionId: auction.id, productId: auction.productId },
      })
    }
    return { bidsChanged, winnersChanged }
  }

  if (auction.outcome === 'no_bids') {
    pushNotification({
      userId: sellerUserIdFor(auction.sellerId), role: 'seller', tone: 'default',
      title: 'Auction ended with no bids', body: `${productLabel(auction)} closed without receiving any bids.`,
      meta: { auctionId: auction.id, productId: auction.productId },
    })
    return { bidsChanged, winnersChanged }
  }

  // Sold: winner, order, notifications
  winners.push({
    id: `WIN-${generateRefCode().replace('REF-', '')}`,
    auctionId: auction.id,
    buyerId: auction.winnerId,
    amount: auction.winningBid,
    createdAt: new Date().toISOString(),
  })
  winnersChanged = true

  const totalValue = auction.pricingUnit === 'per_lot' ? auction.winningBid : Math.round(auction.winningBid * auction.lotQuantity * 100) / 100
  if (isRealBuyer(auction.winnerId)) {
    const order = orderService.placeOrderFromAuction({
      auction: { ...auction, productName: product?.name },
      winnerId: auction.winnerId,
      winningUnitPrice: auction.winningBid,
      totalValue,
      sellerCompanyName: seller?.companyName,
    })
    auction.orderId = order.id
  }

  recordAuditEvent({ actor: 'System', role: 'system', action: 'Auction closed — winner determined', target: auction.id, category: 'order' })

  pushNotification({
    userId: sellerUserIdFor(auction.sellerId), role: 'seller', tone: 'success',
    title: 'Auction won — order created', body: `${productLabel(auction)} sold for ${auction.winningBid.toLocaleString()} ${auction.currency} (${totalValue.toLocaleString()} ${auction.currency} total). An order has been created.`,
    meta: { auctionId: auction.id, productId: auction.productId },
  })
  if (isRealBuyer(auction.winnerId)) {
    pushNotification({
      userId: auction.winnerId, role: 'buyer', tone: 'success',
      title: 'You won the auction!', body: `Congratulations — you won ${productLabel(auction)} at ${auction.winningBid.toLocaleString()} ${auction.currency}. Payment is now required to complete the order.`,
      meta: { auctionId: auction.id, productId: auction.productId },
      channels: ['inapp', 'email'],
    })
  }
  const losers = new Set((auction.bidderIds || []).filter((id) => id !== auction.winnerId))
  for (const loserId of losers) {
    if (!isRealBuyer(loserId)) continue
    pushNotification({
      userId: loserId, role: 'buyer', tone: 'default',
      title: 'Auction ended', body: `${productLabel(auction)} has ended. Another buyer won this lot.`,
      meta: { auctionId: auction.id, productId: auction.productId },
    })
  }

  return { bidsChanged, winnersChanged }
}

function markOutbid(bids, auctionId, buyerId) {
  for (const b of bids) {
    if (b.auctionId === auctionId && b.buyerId === buyerId && b.status === 'winning') b.status = 'outbid'
  }
}

// Only the demo buyer account (usr_buyer_1) is a "real" logged-in user in
// this prototype — the rest of the bidder pool exists purely to simulate
// competing market activity, so we don't push notifications for them.
function isRealBuyer(buyerId) {
  return buyerId === 'usr_buyer_1'
}
function sellerUserIdFor(sellerId) {
  return sellerId === 'slr_gulf_recycling' ? 'usr_seller_1' : sellerId
}
function productLabel(auction) {
  const product = getProduct(auction.productId)
  return product?.name || auction.id
}

// --- Public repository ----------------------------------------------------

export const mockAuctionRepository = {
  async listAuctions({ sellerId, status, statuses, listingTypes, materialId, query, visibleOnly } = {}) {
    tickAuctions()
    await sleep(300)
    let rows = readAuctions()
    if (sellerId) rows = rows.filter((a) => a.sellerId === sellerId)
    if (status) rows = rows.filter((a) => a.status === status)
    if (statuses) rows = rows.filter((a) => statuses.includes(a.status))
    if (listingTypes) rows = rows.filter((a) => listingTypes.includes(a.listingType))
    if (visibleOnly) {
      rows = rows.filter((a) => [AUCTION_STATUS.LIVE, AUCTION_STATUS.SCHEDULED, AUCTION_STATUS.COMPLETED].includes(a.status))
    }
    if (materialId || query) {
      rows = rows.filter((a) => {
        const product = getProduct(a.productId)
        if (!product) return false
        if (materialId && product.materialId !== materialId) return false
        if (query && !product.name.toLowerCase().includes(query.toLowerCase())) return false
        return true
      })
    }
    return rows
      .map((a) => ({ ...a, product: getProduct(a.productId) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async getAuction(auctionId) {
    tickAuctions()
    await sleep(200)
    const auction = readAuctions().find((a) => a.id === auctionId)
    return auction ? { ...auction, product: getProduct(auction.productId) } : null
  },

  async getAuctionByProduct(productId) {
    tickAuctions()
    await sleep(150)
    const auction = readAuctions().find((a) => a.productId === productId)
    return auction ? { ...auction, product: getProduct(productId) } : null
  },

  async listBidsForAuction(auctionId) {
    tickAuctions()
    await sleep(200)
    return readBids()
      .filter((b) => b.auctionId === auctionId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  },

  async listBidsForBuyer(buyerId) {
    tickAuctions()
    await sleep(250)
    const bids = readBids().filter((b) => b.buyerId === buyerId)
    const auctions = readAuctions()
    // Collapse to one row per auction (latest bid = the buyer's current standing)
    const byAuction = new Map()
    for (const b of bids.sort((x, y) => new Date(x.timestamp) - new Date(y.timestamp))) {
      byAuction.set(b.auctionId, b)
    }
    return Array.from(byAuction.values()).map((b) => {
      const auction = auctions.find((a) => a.id === b.auctionId)
      return { ...b, auction: auction ? { ...auction, product: getProduct(auction.productId) } : null }
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  },

  async getAutoBid(auctionId, buyerId) {
    return readAutoBids().find((r) => r.auctionId === auctionId && r.buyerId === buyerId) || null
  },

  async placeBid(auctionId, user, { amount, maxAmount }) {
    tickAuctions()
    await sleep(500)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    const tiers = readIncrementTiers(DEFAULT_INCREMENT_TIERS)
    const { proposedMax } = validateBidSubmission({ auction: auctions[idx], user, amount, maxAmount, tiers })

    const { auctionPatch, outbidBuyerId, buyNowTriggered } = applyBid({
      auction: auctions[idx], user, proposedMax, tiers,
    })
    auctions[idx] = { ...auctions[idx], ...auctionPatch }

    const bids = readBids()
    bids.push({
      id: `BID-${generateRefCode().replace('REF-', '')}`,
      auctionId,
      buyerId: user.id,
      buyerName: user.name,
      amount: auctions[idx].currentBid,
      maxAmount: proposedMax,
      isAutoBid: maxAmount != null && Number(maxAmount) !== Number(amount),
      status: 'winning',
      timestamp: new Date().toISOString(),
    })
    if (outbidBuyerId) markOutbid(bids, auctionId, outbidBuyerId)

    if (maxAmount != null) {
      const autoBids = readAutoBids()
      const existingIdx = autoBids.findIndex((r) => r.auctionId === auctionId && r.buyerId === user.id)
      const record = {
        id: existingIdx === -1 ? `AB-${generateRefCode().replace('REF-', '')}` : autoBids[existingIdx].id,
        auctionId, buyerId: user.id, maxAmount: Number(maxAmount), active: true,
        createdAt: existingIdx === -1 ? new Date().toISOString() : autoBids[existingIdx].createdAt,
        updatedAt: new Date().toISOString(),
      }
      if (existingIdx === -1) autoBids.push(record)
      else autoBids[existingIdx] = record
      writeAutoBids(autoBids)
    }

    let closedNow = false
    if (buyNowTriggered) {
      const patch = resolveClose(auctions[idx], { forcedWinnerId: user.id })
      auctions[idx] = { ...auctions[idx], ...patch }
      closedNow = true
    }

    writeBids(bids)
    writeAuctions(auctions)

    if (closedNow) {
      const winners = readWinners()
      closeSideEffects(auctions[idx], readBids(), winners)
      writeWinners(winners)
      writeBids(readBids())
    } else if (outbidBuyerId && isRealBuyer(outbidBuyerId)) {
      pushNotification({
        userId: outbidBuyerId, role: 'buyer', tone: 'warning',
        title: 'You have been outbid', body: `Someone placed a higher bid on ${productLabel(auctions[idx])}. New leading bid: ${auctions[idx].currentBid.toLocaleString()} ${auctions[idx].currency}.`,
        meta: { auctionId, productId: auctions[idx].productId },
      })
    }

    if (isRealBuyer(user.id)) {
      pushNotification({
        userId: user.id, role: 'buyer', tone: 'success',
        title: buyNowTriggered ? 'Buy Now purchase confirmed' : 'Bid placed successfully',
        body: buyNowTriggered
          ? `You purchased ${productLabel(auctions[idx])} instantly at ${auctions[idx].currentBid.toLocaleString()} ${auctions[idx].currency}.`
          : `Your bid of ${amount.toLocaleString()} ${auctions[idx].currency} on ${productLabel(auctions[idx])} was placed. Current leading bid: ${auctions[idx].currentBid.toLocaleString()} ${auctions[idx].currency}.`,
        meta: { auctionId, productId: auctions[idx].productId },
      })
      if (auctions[idx].reservePrice) {
        pushNotification({
          userId: sellerUserIdFor(auctions[idx].sellerId), role: 'seller',
          tone: auctions[idx].reserveMet ? 'success' : 'default',
          title: auctions[idx].reserveMet ? 'Reserve price reached' : 'New bid received',
          body: auctions[idx].reserveMet
            ? `${productLabel(auctions[idx])} has reached its reserve price.`
            : `A new bid was placed on ${productLabel(auctions[idx])}.`,
          meta: { auctionId, productId: auctions[idx].productId },
        })
      }
    }

    recordAuditEvent({ actor: user.name, role: 'buyer', action: buyNowTriggered ? 'Bought now (auction)' : 'Placed bid', target: `${auctionId} — ${amount}`, category: 'order' })
    return { ...auctions[idx], product: getProduct(auctions[idx].productId) }
  },

  // --- Seller: listing & lifecycle management ---

  async createAuctionListing(sellerId, { product, auction }) {
    await sleep(600)
    // Reuse the existing product-moderation pipeline: create the underlying
    // product exactly like a fixed-price listing (status: pending) via the
    // real product repository so admin's existing Product Approvals screen
    // already governs visibility — the Auction Management screen then
    // additionally governs the auction-specific schedule/approval.
    const createdProduct = await productService.createProduct(sellerId, { ...product, listingType: auction.listingType })

    const auctions = readAuctions()
    const record = {
      id: `AUC-${generateRefCode().replace('REF-', '')}`,
      productId: createdProduct.id,
      sellerId,
      ...auction,
      currentBid: auction.startingBid,
      currentBidderId: null,
      bidCount: 0,
      bidderIds: [],
      bidderMaxes: {},
      reserveMet: !auction.reservePrice,
      winnerId: null,
      winningBid: null,
      outcome: null,
      cancelReason: null,
      simulateActivity: false,
      lastSimAt: 0,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      status: AUCTION_STATUS.PENDING_APPROVAL,
    }
    writeAuctions([record, ...auctions])
    recordAuditEvent({ actor: sellerId, role: 'seller', action: 'Created auction listing', target: createdProduct.name, category: 'product' })
    return { ...record, product: createdProduct }
  },

  async updateAuctionListing(auctionId, payload) {
    await sleep(400)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    const current = auctions[idx]
    if (current.bidCount > 0) {
      // Editing an active/bid-on auction must never invalidate existing
      // bids — only non-pricing/timing fields may change once bidding has
      // started.
      const PROTECTED = ['startingBid', 'reservePrice', 'bidIncrement', 'buyNowPrice', 'startAt', 'endAt', 'lotQuantity', 'pricingUnit', 'listingType']
      const attemptedProtectedChange = PROTECTED.some((k) => payload[k] !== undefined && payload[k] !== current[k])
      if (attemptedProtectedChange) {
        throw new Error('This auction already has bids — pricing, quantity and timing can no longer be changed. Cancel and relist instead.')
      }
    }
    auctions[idx] = { ...current, ...payload }
    writeAuctions(auctions)
    recordAuditEvent({ actor: current.sellerId, role: 'seller', action: 'Updated auction listing', target: auctionId, category: 'product' })
    return auctions[idx]
  },

  async cancelAuction(auctionId, reason, actorRole = 'seller') {
    await sleep(400)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    auctions[idx] = { ...auctions[idx], status: AUCTION_STATUS.CANCELLED, cancelReason: reason || 'Cancelled.' }
    writeAuctions(auctions)
    recordAuditEvent({ actor: actorRole === 'admin' ? 'Admin' : auctions[idx].sellerId, role: actorRole, action: 'Cancelled auction', target: auctionId, category: 'product' })
    if (auctions[idx].currentBidderId && isRealBuyer(auctions[idx].currentBidderId)) {
      pushNotification({
        userId: auctions[idx].currentBidderId, role: 'buyer', tone: 'danger',
        title: 'Auction cancelled', body: `${productLabel(auctions[idx])} was cancelled by the ${actorRole}. ${reason || ''}`.trim(),
        meta: { auctionId, productId: auctions[idx].productId },
      })
    }
    return auctions[idx]
  },

  async pauseAuction(auctionId, paused) {
    await sleep(300)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    auctions[idx] = paused
      ? { ...auctions[idx], status: AUCTION_STATUS.PAUSED, _prePauseStatus: auctions[idx].status }
      : { ...auctions[idx], status: auctions[idx]._prePauseStatus || AUCTION_STATUS.LIVE, _prePauseStatus: undefined }
    writeAuctions(auctions)
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: paused ? 'Paused auction' : 'Resumed auction', target: auctionId, category: 'product' })
    return auctions[idx]
  },

  async acceptReserveNotMet(auctionId) {
    await sleep(500)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    const patch = resolveClose(auctions[idx], { acceptBelowReserve: true })
    auctions[idx] = { ...auctions[idx], ...patch }
    writeAuctions(auctions)
    const winners = readWinners()
    const bids = readBids()
    closeSideEffects(auctions[idx], bids, winners)
    writeWinners(winners)
    writeBids(bids)
    recordAuditEvent({ actor: auctions[idx].sellerId, role: 'seller', action: 'Accepted highest bid below reserve', target: auctionId, category: 'order' })
    return auctions[idx]
  },

  /** Accept Bids listings: seller manually picks a bid to close the deal. */
  async acceptOfferBid(auctionId, buyerId) {
    await sleep(500)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    const patch = resolveClose(auctions[idx], { forcedWinnerId: buyerId, acceptBelowReserve: true })
    auctions[idx] = { ...auctions[idx], ...patch }
    writeAuctions(auctions)
    const bids = readBids()
    const winners = readWinners()
    closeSideEffects(auctions[idx], bids, winners)
    writeWinners(winners)
    writeBids(bids)
    recordAuditEvent({ actor: auctions[idx].sellerId, role: 'seller', action: 'Accepted offer', target: `${auctionId} — ${buyerId}`, category: 'order' })
    return auctions[idx]
  },

  // --- Admin ---

  async adminApproveAuction(auctionId) {
    await sleep(400)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    const startsInFuture = new Date(auctions[idx].startAt).getTime() > Date.now()
    auctions[idx] = {
      ...auctions[idx],
      status: startsInFuture ? AUCTION_STATUS.SCHEDULED : AUCTION_STATUS.LIVE,
      approvedAt: new Date().toISOString(),
    }
    writeAuctions(auctions)
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: 'Approved auction', target: auctionId, category: 'approval' })
    pushNotification({
      userId: sellerUserIdFor(auctions[idx].sellerId), role: 'seller', tone: 'success',
      title: 'Auction approved', body: `${productLabel(auctions[idx])} was approved and is now ${startsInFuture ? 'scheduled' : 'live'}.`,
      meta: { auctionId, productId: auctions[idx].productId },
    })
    return auctions[idx]
  },

  async adminRejectAuction(auctionId, reason) {
    await sleep(400)
    const auctions = readAuctions()
    const idx = auctions.findIndex((a) => a.id === auctionId)
    if (idx === -1) throw new Error('Auction not found.')
    auctions[idx] = { ...auctions[idx], status: AUCTION_STATUS.CANCELLED, cancelReason: reason || 'Rejected by admin.' }
    writeAuctions(auctions)
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: 'Rejected auction', target: auctionId, category: 'approval' })
    pushNotification({
      userId: sellerUserIdFor(auctions[idx].sellerId), role: 'seller', tone: 'danger',
      title: 'Auction rejected', body: `${productLabel(auctions[idx])} was rejected. ${reason || ''}`.trim(),
      meta: { auctionId, productId: auctions[idx].productId },
    })
    return auctions[idx]
  },

  async listAllForAdmin({ status, query } = {}) {
    tickAuctions()
    await sleep(350)
    let rows = readAuctions()
    if (status && status !== 'All') rows = rows.filter((a) => a.status === status)
    if (query) {
      const q = query.toLowerCase()
      rows = rows.filter((a) => {
        const product = getProduct(a.productId)
        return a.id.toLowerCase().includes(q) || (product?.name || '').toLowerCase().includes(q)
      })
    }
    return rows
      .map((a) => ({ ...a, product: getProduct(a.productId), seller: getSeller(a.sellerId) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async listSuspiciousActivity() {
    tickAuctions()
    await sleep(300)
    const bids = readBids()
    const auctions = readAuctions()
    const flags = []
    const byAuction = new Map()
    for (const b of bids) {
      if (!byAuction.has(b.auctionId)) byAuction.set(b.auctionId, [])
      byAuction.get(b.auctionId).push(b)
    }
    for (const [auctionId, rows] of byAuction) {
      const auction = auctions.find((a) => a.id === auctionId)
      if (!auction) continue
      const sorted = [...rows].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      for (let i = 0; i < sorted.length - 2; i++) {
        const [a1, a2, a3] = sorted.slice(i, i + 3)
        if (a1.buyerId === a2.buyerId && a2.buyerId === a3.buyerId) {
          const spanMs = new Date(a3.timestamp) - new Date(a1.timestamp)
          if (spanMs < 5 * 60000) {
            flags.push({
              auctionId, buyerId: a1.buyerId, buyerName: a1.buyerName,
              reason: 'Same bidder placed 3+ consecutive bids within 5 minutes — possible self-bidding or bid manipulation.',
              product: getProduct(auction.productId)?.name,
              at: a3.timestamp,
            })
            break
          }
        }
      }
    }
    return flags
  },

  // --- Increment tiers (admin-managed) ---

  async getIncrementTiers() {
    await sleep(150)
    return readIncrementTiers(DEFAULT_INCREMENT_TIERS)
  },

  async setIncrementTiers(tiers) {
    await sleep(300)
    writeIncrementTiers(tiers)
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: 'Updated bid increment tiers', target: null, category: 'approval' })
    return tiers
  },

  // Exposed for the app-level scheduler hook + tests
  tick: tickAuctions,
  bus: auctionBus,
}
