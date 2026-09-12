import { sleep, generateRefCode } from '@/lib/utils'
import { readProductStore as readAll, writeProductStore as writeAll } from '@/lib/productStore'
import { recordAuditEvent } from '@/services/repositories/mockAuditRepository'

export const mockProductRepository = {
  async listBySeller(sellerId) {
    await sleep(350)
    return readAll()
      .filter((p) => p.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async getProduct(productId) {
    await sleep(200)
    return readAll().find((p) => p.id === productId) || null
  },

  async createProduct(sellerId, payload) {
    await sleep(600)
    const all = readAll()
    const product = {
      id: `PRD-${generateRefCode().replace('REF-', '')}`,
      sellerId,
      status: 'pending', // new listings go through moderation, per the brief
      featured: false,
      createdAt: new Date().toISOString(),
      ...payload,
    }
    writeAll([product, ...all])
    recordAuditEvent({ actor: payload.actorName || sellerId, role: 'seller', action: 'Created product', target: product.name, category: 'product' })
    return product
  },

  async updateProduct(productId, payload) {
    await sleep(500)
    const all = readAll()
    const idx = all.findIndex((p) => p.id === productId)
    if (idx === -1) throw new Error('Product not found')
    all[idx] = { ...all[idx], ...payload }
    writeAll(all)
    recordAuditEvent({ actor: payload.actorName || all[idx].sellerId, role: 'seller', action: 'Updated product', target: all[idx].name, category: 'product' })
    return all[idx]
  },

  async deleteProduct(productId) {
    await sleep(400)
    const target = readAll().find((p) => p.id === productId)
    writeAll(readAll().filter((p) => p.id !== productId))
    if (target) recordAuditEvent({ actor: target.sellerId, role: 'seller', action: 'Deleted product', target: target.name, category: 'product' })
  },

  async setStatus(productId, status) {
    await sleep(300)
    const all = readAll()
    const idx = all.findIndex((p) => p.id === productId)
    if (idx === -1) throw new Error('Product not found')
    all[idx] = { ...all[idx], status }
    writeAll(all)
    recordAuditEvent({ actor: all[idx].sellerId, role: 'seller', action: `Set product status to ${status}`, target: all[idx].name, category: 'product' })
    return all[idx]
  },

  // --- Admin: marketplace-wide product moderation ---

  async listAll({ status } = {}) {
    await sleep(350)
    let all = readAll()
    if (status) all = all.filter((p) => p.status === status)
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async setFeatured(productId, featured) {
    await sleep(300)
    const all = readAll()
    const idx = all.findIndex((p) => p.id === productId)
    if (idx === -1) throw new Error('Product not found')
    all[idx] = { ...all[idx], featured }
    writeAll(all)
    recordAuditEvent({ actor: 'Admin', role: 'admin', action: featured ? 'Featured product' : 'Unfeatured product', target: all[idx].name, category: 'product' })
    return all[idx]
  },

  async setModerationNote(productId, note) {
    await sleep(200)
    const all = readAll()
    const idx = all.findIndex((p) => p.id === productId)
    if (idx === -1) throw new Error('Product not found')
    all[idx] = { ...all[idx], moderationNote: note }
    writeAll(all)
    return all[idx]
  },
}
