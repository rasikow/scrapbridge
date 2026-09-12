import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const ROLE_LABEL = { buyer: 'Buyer workspace', seller: 'Seller workspace', admin: 'Admin board' }

/**
 * Warm, human "Welcome back" hero banner for dashboard home screens —
 * bright blue-to-teal gradient, avatar initial, greeting, and a row of
 * quick highlight stats on the right. Matches the friendly SaaS reference
 * look rather than a cold data-terminal aesthetic.
 */
export function WelcomeBanner({ highlights = [] }) {
  const { user } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || 'U'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-brand-gradient px-6 py-6 shadow-lg shadow-copper-500/15 sm:px-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/25 text-xl font-semibold text-white shadow-inner ring-2 ring-white/40 backdrop-blur">
            {initial}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-white sm:text-[1.7rem]">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="mt-0.5 text-sm text-white/80">{user?.name} · {ROLE_LABEL[user?.role]}</p>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {highlights.map((h) => (
              <div key={h.label}>
                <p className="text-xs font-medium text-white/70">{h.label}</p>
                <p className="mt-0.5 font-mono-data text-2xl font-semibold text-white">{h.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
