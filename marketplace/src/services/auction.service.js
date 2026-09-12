import { mockAuctionRepository } from '@/services/repositories/mockAuctionRepository'

const repository = mockAuctionRepository

export const auctionService = {
  listAuctions: (filters) => repository.listAuctions(filters),
  getAuction: (auctionId) => repository.getAuction(auctionId),
  getAuctionByProduct: (productId) => repository.getAuctionByProduct(productId),
  listBidsForAuction: (auctionId) => repository.listBidsForAuction(auctionId),
  listBidsForBuyer: (buyerId) => repository.listBidsForBuyer(buyerId),
  getAutoBid: (auctionId, buyerId) => repository.getAutoBid(auctionId, buyerId),
  placeBid: (auctionId, user, payload) => repository.placeBid(auctionId, user, payload),

  createAuctionListing: (sellerId, payload) => repository.createAuctionListing(sellerId, payload),
  updateAuctionListing: (auctionId, payload) => repository.updateAuctionListing(auctionId, payload),
  cancelAuction: (auctionId, reason, actorRole) => repository.cancelAuction(auctionId, reason, actorRole),
  pauseAuction: (auctionId, paused) => repository.pauseAuction(auctionId, paused),
  acceptReserveNotMet: (auctionId) => repository.acceptReserveNotMet(auctionId),
  acceptOfferBid: (auctionId, buyerId) => repository.acceptOfferBid(auctionId, buyerId),

  adminApproveAuction: (auctionId) => repository.adminApproveAuction(auctionId),
  adminRejectAuction: (auctionId, reason) => repository.adminRejectAuction(auctionId, reason),
  listAllForAdmin: (filters) => repository.listAllForAdmin(filters),
  listSuspiciousActivity: () => repository.listSuspiciousActivity(),
  getIncrementTiers: () => repository.getIncrementTiers(),
  setIncrementTiers: (tiers) => repository.setIncrementTiers(tiers),

  tick: () => repository.tick(),
  bus: repository.bus,
}
