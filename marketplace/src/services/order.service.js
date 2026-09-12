import { mockOrderRepository } from '@/services/repositories/mockOrderRepository'

const repository = mockOrderRepository

export const orderService = {
  listOrders: (userId) => repository.listOrders(userId),
  listOrdersForSeller: (sellerId) => repository.listOrdersForSeller(sellerId),
  listAllOrders: (filters) => repository.listAllOrders(filters),
  getOrder: (orderId) => repository.getOrder(orderId),
  placeOrder: (payload) => repository.placeOrder(payload),
  cancelOrder: (orderId) => repository.cancelOrder(orderId),
  acceptOrder: (orderId) => repository.acceptOrder(orderId),
  rejectOrder: (orderId, reason) => repository.rejectOrder(orderId, reason),
  updateOrderStatus: (orderId, status) => repository.updateOrderStatus(orderId, status),
  dispatchOrder: (orderId, trackingRef) => repository.dispatchOrder(orderId, trackingRef),
  attachInvoice: (orderId, file) => repository.attachInvoice(orderId, file),
  attachDeliveryNote: (orderId, file) => repository.attachDeliveryNote(orderId, file),
  refundOrder: (orderId, reason) => repository.refundOrder(orderId, reason),
  payOrder: (orderId, payment) => repository.payOrder(orderId, payment),
  placeOrderFromAuction: (payload) => repository.placeOrderFromAuction(payload),
}
