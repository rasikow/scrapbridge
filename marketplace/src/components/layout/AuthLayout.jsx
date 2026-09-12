import { Link } from 'react-router-dom'
import { Recycle, ShieldCheck, Globe2, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { MaterialTicker } from '@/components/shared/MaterialTicker'
import { MATERIAL_CATEGORIES, LOCATIONS } from '@/data/materials'

const THEME_CLASS = { seller: 'theme-seller', admin: 'theme-admin' }

const STATS = [
  { icon: Layers, value: MATERIAL_CATEGORIES.length, label: 'Material categories tracked' },
  { icon: Globe2, value: LOCATIONS.length, label: 'Trading hub cities' },
  { icon: ShieldCheck, value: '100%', label: 'License-verified accounts' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function AuthLayout({ children, eyebrow, title, description, theme }) {
  return (
    <div className={`min-h-screen w-full grid lg:grid-cols-[minmax(0,520px)_1fr] bg-paper-100 ${THEME_CLASS[theme] || ''}`}>
      {/* Brand / exchange-floor panel */}
      <aside className="relative hidden lg:flex flex-col overflow-hidden bg-graphite-900 px-10 py-9 text-white">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,rgba(63,125,116,0.4),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_105%,rgba(193,121,63,0.22),transparent_45%)]" />

        {/* Blueprint grid texture */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="blueprint-grid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M 34 0 L 0 0 0 34" fill="none" stroke="white" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        </svg>

        {/* Oversized watermark mark */}
        <Recycle className="pointer-events-none absolute -right-14 -top-14 size-72 text-white/[0.035]" strokeWidth={0.6} aria-hidden />

        {/* Brand row */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          className="relative flex items-center justify-between"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-copper-500">
              <Recycle className="size-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">ScrapBridge</span>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verdigris-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-verdigris-400" />
            </span>
            <span className="font-mono-data text-[10px] uppercase tracking-wider text-white/60">Marketplace open</span>
          </div>
        </motion.div>

        {/* Hero copy */}
        <div className="relative mt-14 mb-10">
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mb-3 font-mono-data text-[11px] uppercase tracking-[0.15em] text-copper-400"
          >
            Digital scrap marketplace · est. verified network
          </motion.p>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            className="font-display text-[2.35rem] font-semibold leading-[1.12] text-white"
          >
            The digital marketplace for industrial scrap.
          </motion.p>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={3}
            className="mt-3 max-w-sm text-sm leading-relaxed text-white/60"
          >
            Companies list scrap, verified vendors quote and bid — copper to CDW,
            faster disposal with transparent pricing.
          </motion.p>

          {/* Stat strip */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={4}
            className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-white/10"
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-graphite-900/95 px-3 py-3.5">
                <Icon className="size-3.5 text-copper-400" strokeWidth={2} />
                <p className="mt-2 font-mono-data text-xl font-medium tabular-nums text-white">{value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-white/45">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live reference board */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={5} className="relative mt-auto">
          <div className="mb-5 h-px w-full bg-gradient-to-r from-white/15 via-white/[0.06] to-transparent" />
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono-data text-[11px] uppercase tracking-wider text-white/40">
              Live reference board
            </p>
            <span className="font-mono-data text-[10px] text-white/25">illustrative</span>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-3">
            <div className="h-52">
              <MaterialTicker />
            </div>
          </div>
        </motion.div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
        <div className="flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-md bg-copper-500">
                <Recycle className="size-5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-ink-900">ScrapBridge</span>
            </Link>

            {eyebrow && (
              <p className="mb-2 font-mono-data text-xs uppercase tracking-wider text-copper-600">{eyebrow}</p>
            )}
            {title && <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>}
            {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}

            <div className="mt-7">{children}</div>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-6 text-xs text-ink-300">
          <span>© {new Date().getFullYear()} ScrapBridge</span>
          <span aria-hidden>·</span>
          <Link to="/" className="hover:text-ink-500">Home</Link>
          <span aria-hidden>·</span>
          <a href="#" className="hover:text-ink-500">Support</a>
          <span aria-hidden>·</span>
          <a href="#" className="hover:text-ink-500">Privacy</a>
        </footer>
      </main>
    </div>
  )
}
