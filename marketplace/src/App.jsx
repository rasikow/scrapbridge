import { AppRouter } from '@/routes/AppRouter'
import { AuthProvider } from '@/hooks/useAuth'
import { CartProvider } from '@/hooks/useCart'
import { WishlistProvider } from '@/hooks/useWishlist'
import { Toaster } from '@/components/ui/sonner'
import { useAuctionScheduler } from '@/hooks/useAuctionRealtime'

// Runs the auction module's scheduler tick (scheduled→live, auto-close,
// simulated live-bidding for demo lots) for the lifetime of the app —
// see hooks/useAuctionRealtime.jsx.
function AuctionScheduler() {
  useAuctionScheduler()
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AuctionScheduler />
          <AppRouter />
          <Toaster />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
