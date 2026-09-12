import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cartStore } from '@/services/repositories/mockCommerceRepository'
import { getProduct } from '@/data/products'
import { useAuth } from '@/hooks/useAuth'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(user ? cartStore.get(user.id) : [])
  }, [user])

  const persist = useCallback(
    (next) => {
      setItems(next)
      if (user) cartStore.set(user.id, next)
    },
    [user]
  )

  const addItem = useCallback(
    (productId, quantity) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId)
        const next = existing
          ? prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
          : [...prev, { productId, quantity }]
        if (user) cartStore.set(user.id, next)
        return next
      })
    },
    [user]
  )

  const updateQuantity = useCallback(
    (productId, quantity) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        if (user) cartStore.set(user.id, next)
        return next
      })
    },
    [user]
  )

  const removeItem = useCallback(
    (productId) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId)
        if (user) cartStore.set(user.id, next)
        return next
      })
    },
    [user]
  )

  const clearCart = useCallback(() => persist([]), [persist])

  const detailedItems = items
    .map((i) => ({ ...i, product: getProduct(i.productId) }))
    .filter((i) => i.product)

  const subtotal = detailedItems.reduce((sum, i) => sum + i.quantity * i.product.price, 0)

  return (
    <CartContext.Provider
      value={{ items: detailedItems, count: detailedItems.length, subtotal, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
