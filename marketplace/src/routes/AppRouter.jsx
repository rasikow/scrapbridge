import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from '@/features/home/pages/HomePage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// Everything except the homepage is lazy-loaded on demand. Previously every
// route in the app — including all buyer/seller/admin dashboards — was
// statically imported here, which forced every visitor (including an
// anonymous person just looking at the marketing homepage) to download a
// single ~2.7MB JS bundle up front. Splitting each route into its own chunk
// means the homepage now only loads the code it actually needs, and every
// other page loads its chunk the moment it's navigated to.
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterRoleSelect = lazy(() => import('@/features/auth/pages/RegisterRoleSelect'))
const BuyerRegisterWizard = lazy(() => import('@/features/auth/pages/BuyerRegisterWizard'))
const SellerRegisterWizard = lazy(() => import('@/features/auth/pages/SellerRegisterWizard'))
const PendingApprovalPage = lazy(() => import('@/features/auth/pages/PendingApprovalPage'))
const BuyerDashboardPage = lazy(() => import('@/features/dashboard/buyer/BuyerDashboardPage'))
const SellerDashboardPage = lazy(() => import('@/features/dashboard/seller/SellerDashboardPage'))
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage'))
const ProductDetailsPage = lazy(() => import('@/features/marketplace/pages/ProductDetailsPage'))
const WishlistPage = lazy(() => import('@/features/marketplace/pages/WishlistPage'))
const CartPage = lazy(() => import('@/features/orders/pages/CartPage'))
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'))
const OrderDetailsPage = lazy(() => import('@/features/orders/pages/OrderDetailsPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const ProductsListPage = lazy(() => import('@/features/seller/pages/ProductsListPage'))
const ProductFormPage = lazy(() => import('@/features/seller/pages/ProductFormPage'))
const SellerOrdersPage = lazy(() => import('@/features/seller/pages/SellerOrdersPage'))
const SellerOrderDetailsPage = lazy(() => import('@/features/seller/pages/SellerOrderDetailsPage'))
const SellerProfilePage = lazy(() => import('@/features/seller/pages/SellerProfilePage'))
const AdminDashboardPage = lazy(() => import('@/features/dashboard/admin/AdminDashboardPage'))
const BuyerApprovalsPage = lazy(() => import('@/features/admin/pages/BuyerApprovalsPage'))
const SellerApprovalsPage = lazy(() => import('@/features/admin/pages/SellerApprovalsPage'))
const ProductApprovalsPage = lazy(() => import('@/features/admin/pages/ProductApprovalsPage'))
const UserManagementPage = lazy(() => import('@/features/admin/pages/UserManagementPage'))
const CategoryManagementPage = lazy(() => import('@/features/admin/pages/CategoryManagementPage'))
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage'))
const ReportsPage = lazy(() => import('@/features/admin/pages/ReportsPage'))
const AuditLogsPage = lazy(() => import('@/features/admin/pages/AuditLogsPage'))
const AuctionManagementPage = lazy(() => import('@/features/admin/pages/AuctionManagementPage'))
const AuctionsPage = lazy(() => import('@/features/marketplace/pages/AuctionsPage'))
const MyBidsPage = lazy(() => import('@/features/buyer/pages/MyBidsPage'))
const SellerAuctionsPage = lazy(() => import('@/features/seller/pages/SellerAuctionsPage'))
const SellerAuctionDetailsPage = lazy(() => import('@/features/seller/pages/SellerAuctionDetailsPage'))

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-copper-300 border-t-copper-600" />
        <p className="font-mono-data text-xs uppercase tracking-wider text-ink-500">Loading…</p>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterRoleSelect />} />
        <Route path="/register/buyer" element={<BuyerRegisterWizard />} />
        <Route path="/register/seller" element={<SellerRegisterWizard />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        {/* Buyer */}
        <Route
          path="/buyer/dashboard"
          element={
            <ProtectedRoute roles={['buyer']}>
              <BuyerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/marketplace"
          element={
            <ProtectedRoute roles={['buyer']}>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/marketplace/:productId"
          element={
            <ProtectedRoute roles={['buyer']}>
              <ProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/wishlist"
          element={
            <ProtectedRoute roles={['buyer']}>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/auctions"
          element={
            <ProtectedRoute roles={['buyer']}>
              <AuctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/my-bids"
          element={
            <ProtectedRoute roles={['buyer']}>
              <MyBidsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/cart"
          element={
            <ProtectedRoute roles={['buyer']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute roles={['buyer']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders/:orderId"
          element={
            <ProtectedRoute roles={['buyer']}>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/profile"
          element={
            <ProtectedRoute roles={['buyer']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Seller */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute roles={['seller']}>
              <ProductsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/new"
          element={
            <ProtectedRoute roles={['seller']}>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/:productId/edit"
          element={
            <ProtectedRoute roles={['seller']}>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/auctions"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerAuctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/auctions/:auctionId"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerAuctionDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders/:orderId"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerOrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/profile"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/buyers"
          element={
            <ProtectedRoute roles={['admin']}>
              <BuyerApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/sellers"
          element={
            <ProtectedRoute roles={['admin']}>
              <SellerApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/products"
          element={
            <ProtectedRoute roles={['admin']}>
              <ProductApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auctions"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuctionManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <CategoryManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
