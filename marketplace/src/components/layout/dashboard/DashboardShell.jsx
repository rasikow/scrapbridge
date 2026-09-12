import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TopNav } from './TopNav'
import { Topbar } from './Topbar'
import { DashboardFooter } from './DashboardFooter'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'

const ROLE_THEME_CLASS = { seller: 'theme-seller', admin: 'theme-admin' }

function CartAwareTopbar(props) {
  const { count } = useCart()
  return <Topbar {...props} cartCount={count} />
}

export function DashboardShell({ children, showSearch = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className={`flex min-h-screen flex-col bg-paper-100 ${ROLE_THEME_CLASS[user?.role] || ''}`}>
      <TopNav
        role={user?.role}
        showSearch={showSearch}
        onSearch={(q) => navigate(`/${user.role}/marketplace?q=${encodeURIComponent(q)}`)}
      />
      {user?.role === 'buyer' ? <CartAwareTopbar /> : <Topbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <DashboardFooter />
    </div>
  )
}
