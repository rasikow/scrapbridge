import { generateRefCode, sleep } from '@/lib/utils'
import { getProduct } from '@/data/products'
import { SEED_PRODUCTS } from '@/data/seedProducts'
import { STATUS_SEQUENCE } from '@/data/orderStatus'
import { recordAuditEvent } from '@/services/repositories/mockAuditRepository'
import { safeSetItem } from '@/lib/safeStorage'

const ORDERS_KEY = 'marketplace_mock_orders_v3'

const BUYER_COMPANIES = [
  { id: 'usr_buyer_1', name: 'Meridian Metals Trading LLC', contact: 'Arjun Mehta', email: 'buyer@demo.com' },
  { id: 'byr_falcon', name: 'Falcon Traders FZE', contact: 'Sara Al Farsi', email: 'sara@falcontraders.com' },
  { id: 'byr_ironbridge', name: 'Ironbridge Commodities Ltd', contact: 'Daniel Cole', email: 'daniel@ironbridge.co.uk' },
  { id: 'byr_pacific', name: 'Pacific Rim Materials Pte', contact: 'Mei Lin Tan', email: 'meilin@pacificrim.sg' },
  { id: 'byr_horizon', name: 'Horizon Metal Recovery', contact: 'Emma Larsson', email: 'emma@horizonrecovery.se' },
  { id: 'byr_atlas', name: 'Atlas Salvage & Trading', contact: 'Marcus Webb', email: 'marcus@atlassalvage.com' },
  { id: 'byr_vantage', name: 'Vantage Industrial Supply', contact: 'Priya Nair', email: 'priya@vantageindustrial.in' },
  { id: 'byr_summit', name: 'Summit Alloys & Metals', contact: 'Carlos Reyes', email: 'carlos@summitalloys.mx' },
]

function seedOrders() {
  const rnd = (n) => Math.floor(Math.abs(Math.sin(n * 999)) * 1000) % 100
  const statuses = ['Delivered', 'Delivered', 'Shipped', 'Processing', 'Pending', 'Cancelled', 'Delivered', 'Approved']
  const orders = []
  let seq = 2000

  // Orders placed by the demo buyer (any seller) — powers the Buyer dashboard/orders screens.
  for (let i = 0; i < 16; i++) {
    const product = SEED_PRODUCTS[(i * 7 + 3) % SEED_PRODUCTS.length]
    const qty = Math.max(product.minOrderQty, Math.round(product.minOrderQty * (1 + rnd(i) / 50)))
    const status = statuses[i % statuses.length]
    const placedAt = new Date(Date.now() - (3 + i * 9) * 86400000)
    const buyer = BUYER_COMPANIES[0]
    orders.push({
      id: `ORD-${String(seq++).padStart(5, '0')}`,
      userId: buyer.id,
      buyerCompany: buyer.name,
      buyerContact: buyer.contact,
      buyerEmail: buyer.email,
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.price,
      total: Math.round(qty * product.price * 100) / 100,
      currency: product.currency,
      status,
      placedAt: placedAt.toISOString(),
      poFile: i % 3 === 0 ? { name: `PO-${2000 + i}.pdf`, sizeKb: 180 + i } : null,
      invoiceFile: null,
      deliveryNoteFile: null,
      trackingRef: status === 'Shipped' || status === 'Delivered' ? generateRefCode('TRK') : null,
      sellerNote: null,
      listingType: 'fixed',
    })
  }

  // Orders received by the demo seller (Gulf Recycling), placed by a spread
  // of other buyer companies — powers the Seller dashboard/orders screens.
  const DEMO_SELLER = 'slr_gulf_recycling'
  const sellerProducts = SEED_PRODUCTS.filter((p) => p.sellerId === DEMO_SELLER)
  const catalog = sellerProducts.length > 0 ? sellerProducts : SEED_PRODUCTS.slice(0, 5)
  for (let i = 0; i < 20; i++) {
    const product = catalog[i % catalog.length]
    const buyer = BUYER_COMPANIES[(i % (BUYER_COMPANIES.length - 1)) + 1]
    const qty = Math.max(product.minOrderQty, Math.round(product.minOrderQty * (1 + rnd(i + 50) / 40)))
    const status = statuses[(i + 3) % statuses.length]
    const placedAt = new Date(Date.now() - (1 + i * 6) * 86400000)
    orders.push({
      id: `ORD-${String(seq++).padStart(5, '0')}`,
      userId: buyer.id,
      buyerCompany: buyer.name,
      buyerContact: buyer.contact,
      buyerEmail: buyer.email,
      productId: product.id,
      productName: product.name,
      sellerId: DEMO_SELLER,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.price,
      total: Math.round(qty * product.price * 100) / 100,
      currency: product.currency,
      status,
      placedAt: placedAt.toISOString(),
      poFile: i % 4 === 0 ? { name: `PO-${3000 + i}.pdf`, sizeKb: 150 + i } : null,
      invoiceFile: ['Shipped', 'Delivered'].includes(status) ? { name: `invoice-ORD-${3000 + i}.pdf`, sizeKb: 90 } : null,
      deliveryNoteFile: status === 'Delivered' ? { name: `delivery-note-ORD-${3000 + i}.pdf`, sizeKb: 60 } : null,
      trackingRef: status === 'Shipped' || status === 'Delivered' ? generateRefCode('TRK') : null,
      sellerNote: status === 'Cancelled' ? 'Rejected — insufficient stock at requested grade.' : null,
      listingType: 'fixed',
    })
  }

  // A few orders sourced from won auctions/accepted bids so the buyer and
  // seller order screens have real Auction/Bid tab content out of the box.
  const auctionSeedOrders = [
    { listingType: 'auction', productName: 'Grade A Copper Millberry Scrap — 8,500 kg Lot', unitPrice: 8.42, qty: 8500, unit: 'kg', status: 'Delivered' },
    { listingType: 'auction_buynow', productName: 'Shredded Steel Scrap — 40,000 kg Bulk Lot', unitPrice: 318, qty: 40, unit: 'ton', status: 'Shipped' },
    { listingType: 'accept_bids', productName: 'HMS 1&2 Heavy Melting Steel — 22,000 kg Lot', unitPrice: 0.31, qty: 22000, unit: 'kg', status: 'Processing' },
  ]
  auctionSeedOrders.forEach((a, i) => {
    const buyer = BUYER_COMPANIES[0]
    const placedAt = new Date(Date.now() - (5 + i * 11) * 86400000)
    orders.push({
      id: `ORD-${String(seq++).padStart(5, '0')}`,
      userId: buyer.id,
      buyerCompany: buyer.name,
      buyerContact: buyer.contact,
      buyerEmail: buyer.email,
      productId: `PRD-AUC${String(i + 1).padStart(5, '0')}`,
      productName: a.productName,
      sellerId: DEMO_SELLER,
      sellerCompany: 'Gulf Recycling Industries',
      quantity: a.qty,
      unit: a.unit,
      unitPrice: a.unitPrice,
      total: Math.round(a.qty * a.unitPrice * 100) / 100,
      currency: 'USD',
      status: a.status,
      placedAt: placedAt.toISOString(),
      poFile: null,
      invoiceFile: null,
      deliveryNoteFile: null,
      trackingRef: a.status === 'Shipped' || a.status === 'Delivered' ? generateRefCode('TRK') : null,
      sellerNote: null,
      source: 'auction',
      paymentPending: false,
      paymentMethod: 'card',
      paymentDetail: 'Visa ending 4242',
      paymentStatus: 'paid',
      listingType: a.listingType,
    })
  })

  return orders
}

function readOrders() {
  const raw = localStorage.getItem(ORDERS_KEY)
  if (!raw) {
    const seeded = seedOrders()
    safeSetItem(ORDERS_KEY, JSON.stringify(seeded))
    return seeded
  }
  return JSON.parse(raw)
}

function writeOrders(orders) {
  safeSetItem(ORDERS_KEY, JSON.stringify(orders))
}

function patchOrder(orderId, patch) {
  const orders = readOrders()
  const idx = orders.findIndex((o) => o.id === orderId)
  if (idx === -1) throw new Error('Order not found')
  orders[idx] = { ...orders[idx], ...patch }
  writeOrders(orders)
  return orders[idx]
}

export const mockOrderRepository = {
  async listOrders(userId) {
    await sleep(350)
    return readOrders()
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
  },

  async listOrdersForSeller(sellerId) {
    await sleep(350)
    return readOrders()
      .filter((o) => o.sellerId === sellerId)
      .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
  },

  async getOrder(orderId) {
    await sleep(250)
    return readOrders().find((o) => o.id === orderId) || null
  },

  async placeOrder({ userId, items, poFile, payment }) {
    await sleep(700)
    const orders = readOrders()
    const buyer = BUYER_COMPANIES.find((b) => b.id === userId)
    const created = items.map((item) => {
      const product = getProduct(item.productId)
      return {
        id: `ORD-${generateRefCode().replace('REF-', '')}`,
        userId,
        buyerCompany: buyer?.name || 'Your company',
        buyerContact: buyer?.contact || '',
        buyerEmail: buyer?.email || '',
        productId: item.productId,
        productName: product.name,
        sellerId: product.sellerId,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: product.price,
        total: Math.round(item.quantity * product.price * 100) / 100,
        currency: product.currency,
        status: 'Pending',
        placedAt: new Date().toISOString(),
        poFile: poFile || null,
        invoiceFile: null,
        deliveryNoteFile: null,
        trackingRef: null,
        sellerNote: null,
        paymentMethod: payment?.method || null,
        paymentDetail: payment?.detail || null,
        paymentStatus: payment?.status || 'paid',
        listingType: 'fixed',
      }
    })
    writeOrders([...created, ...orders])
    recordAuditEvent({ actor: buyer?.name || userId, role: 'buyer', action: 'Placed order', target: created.map((o) => o.id).join(', '), category: 'order' })
    return created
  },

  async cancelOrder(orderId) {
    await sleep(400)
    const updated = patchOrder(orderId, { status: 'Cancelled' })
    recordAuditEvent({ actor: updated.buyerCompany, role: 'buyer', action: 'Cancelled order', target: orderId, category: 'order' })
    return updated
  },

  // --- Seller-side order fulfillment ---

  async acceptOrder(orderId) {
    await sleep(400)
    const updated = patchOrder(orderId, { status: 'Approved' })
    recordAuditEvent({ actor: 'Seller', role: 'seller', action: 'Accepted order', target: orderId, category: 'order' })
    return updated
  },

  async rejectOrder(orderId, reason) {
    await sleep(400)
    const updated = patchOrder(orderId, { status: 'Cancelled', sellerNote: reason || 'Rejected by seller.' })
    recordAuditEvent({ actor: 'Seller', role: 'seller', action: 'Rejected order', target: orderId, category: 'order' })
    return updated
  },

  async updateOrderStatus(orderId, status) {
    await sleep(400)
    const updated = patchOrder(orderId, { status })
    recordAuditEvent({ actor: 'Seller', role: 'seller', action: `Order status changed to ${status}`, target: orderId, category: 'order' })
    return updated
  },

  async dispatchOrder(orderId, trackingRef) {
    await sleep(500)
    const updated = patchOrder(orderId, { status: 'Shipped', trackingRef: trackingRef || generateRefCode('TRK') })
    recordAuditEvent({ actor: 'Seller', role: 'seller', action: 'Dispatched order', target: `${orderId} (${updated.trackingRef})`, category: 'order' })
    return updated
  },

  async attachInvoice(orderId, file) {
    await sleep(400)
    return patchOrder(orderId, { invoiceFile: file })
  },

  async attachDeliveryNote(orderId, file) {
    await sleep(400)
    return patchOrder(orderId, { deliveryNoteFile: file })
  },

  // --- Admin: platform-wide order management ---

  async listAllOrders({ status } = {}) {
    await sleep(400)
    let orders = readOrders()
    if (status) orders = orders.filter((o) => o.status === status)
    return orders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
  },

  async refundOrder(orderId, reason) {
    await sleep(600)
    const updated = patchOrder(orderId, { status: 'Cancelled', refunded: true, refundReason: reason || 'Refunded by admin.' })
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: 'Refunded order', target: `${orderId}${reason ? ` — ${reason}` : ''}`, category: 'order' })
    return updated
  },

  async payOrder(orderId, payment) {
    await sleep(500)
    const updated = patchOrder(orderId, {
      paymentMethod: payment?.method || null,
      paymentDetail: payment?.detail || null,
      paymentStatus: payment?.status || 'paid',
      paymentPending: false,
    })
    recordAuditEvent({ actor: updated.buyerCompany, role: 'buyer', action: 'Paid for order', target: orderId, category: 'order' })
    return updated
  },

  // --- Auction module integration ---------------------------------------
  // Generates a normal order from a won auction/accepted bid so the buyer
  // and seller drop straight into the existing order/payment workflow —
  // no separate "auction checkout" path. Synchronous (no artificial sleep)
  // since it's called from inside the auction engine's close/accept flow,
  // which already has its own delay.
  placeOrderFromAuction({ auction, winnerId, winningUnitPrice, totalValue, sellerCompanyName }) {
    const orders = readOrders()
    const buyer = BUYER_COMPANIES.find((b) => b.id === winnerId)
    const order = {
      id: `ORD-${generateRefCode().replace('REF-', '')}`,
      userId: winnerId,
      buyerCompany: buyer?.name || 'Winning buyer',
      buyerContact: buyer?.contact || '',
      buyerEmail: buyer?.email || '',
      productId: auction.productId,
      productName: auction.productName || auction.id,
      sellerId: auction.sellerId,
      sellerCompany: sellerCompanyName,
      quantity: auction.lotQuantity,
      unit: auction.lotUnit,
      unitPrice: winningUnitPrice,
      total: Math.round(totalValue * 100) / 100,
      currency: auction.currency,
      status: 'Pending',
      placedAt: new Date().toISOString(),
      poFile: null,
      invoiceFile: null,
      deliveryNoteFile: null,
      trackingRef: null,
      sellerNote: null,
      source: 'auction',
      auctionId: auction.id,
      paymentPending: true,
      listingType: auction.listingType,
    }
    writeOrders([order, ...orders])
    recordAuditEvent({ actor: buyer?.name || winnerId, role: 'buyer', action: 'Order created from won auction', target: order.id, category: 'order' })
    return order
  },
}

export function statusIndex(status) {
  return STATUS_SEQUENCE.indexOf(status)
}
