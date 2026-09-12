import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { wishlistStore } from '@/services/repositories/mockCommerceRepository'
import { getProduct } from '@/data/products'
import { useAuth } from '@/hooks/useAuth'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [productIds, setProductIds] = useState([])

  useEffect(() => {
    setProductIds(user ? wishlistStore.get(user.id) : [])
  }, [user])

  const toggle = useCallback(
    (productId) => {
      setProductIds((prev) => {
        const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        if (user) wishlistStore.set(user.id, next)
        return next
      })
    },
    [user]
  )

  const isWishlisted = (productId) => productIds.includes(productId)
  const products = productIds.map(getProduct).filter(Boolean)

  return (
    <WishlistContext.Provider value={{ productIds, products, count: productIds.length, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
