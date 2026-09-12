import { mockProductRepository } from '@/services/repositories/mockProductRepository'

const repository = mockProductRepository

export const productService = {
  listBySeller: (sellerId) => repository.listBySeller(sellerId),
  listAll: (filters) => repository.listAll(filters),
  getProduct: (productId) => repository.getProduct(productId),
  createProduct: (sellerId, payload) => repository.createProduct(sellerId, payload),
  updateProduct: (productId, payload) => repository.updateProduct(productId, payload),
  deleteProduct: (productId) => repository.deleteProduct(productId),
  setStatus: (productId, status) => repository.setStatus(productId, status),
  setFeatured: (productId, featured) => repository.setFeatured(productId, featured),
  setModerationNote: (productId, note) => repository.setModerationNote(productId, note),
}
