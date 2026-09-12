import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Factory, ArrowRight, Sparkles } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'

const ROLES = [
  {
    role: 'buyer',
    icon: ShoppingCart,
    title: 'Register as a Buyer',
    description: 'Source verified scrap and recyclable materials from licensed sellers worldwide.',
    points: ['Browse the full material catalog', 'Bid, offer or buy now', 'Track shipments end to end'],
    gradient: 'from-copper-400 to-copper-600',
    glow: 'group-hover:shadow-copper-500/25',
    ring: 'hover:border-copper-400/60',
  },
  {
    role: 'seller',
    icon: Factory,
    title: 'Register as a Seller',
    description: 'List your materials and reach verified industrial buyers on a compliant marketplace.',
    points: ['List materials with grade & specs', 'Run auctions or accept offers', 'Get paid on verified trades'],
    gradient: 'from-verdigris-400 to-verdigris-600',
    glow: 'group-hover:shadow-verdigris-500/25',
    ring: 'hover:border-verdigris-400/60',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] } }),
}

export default function RegisterRoleSelect() {
  return (
    <AuthLayout
      eyebrow="Create account"
      title="How will you use ScrapBridge?"
      description="Choose an account type — every company is verified before it can trade."
    >
      <div className="space-y-4">
        {ROLES.map(({ role, icon: Icon, title, description, points, gradient, glow, ring }, i) => (
          <motion.div key={role} initial="hidden" animate="show" variants={fadeUp} custom={i}>
            <Link
              to={`/register/${role}`}
              className={`group relative block overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glow} ${ring}`}
            >
              {/* Animated sheen sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <div className="relative flex items-start gap-4">
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br text-white shadow-md ${gradient}`}
                >
                  <Icon className="size-6" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
                    <ArrowRight className="size-4 shrink-0 text-ink-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-copper-500" />
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{description}</p>
                  <ul className="mt-3 space-y-1">
                    {points.map((p) => (
                      <li key={p} className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Sparkles className="size-3 text-copper-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center text-sm text-ink-500"
      >
        Already registered?{' '}
        <Link to="/login" className="font-medium text-copper-600 hover:underline">
          Sign in
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
