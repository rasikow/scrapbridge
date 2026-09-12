import { motion } from 'framer-motion'

/**
 * Rich gradient banner used at the top of dashboard/listing pages in place
 * of a plain text heading. Dark graphite gradient with a subtle blueprint
 * grid texture (matching the marketing homepage's hero language), an icon
 * badge, eyebrow label, title, optional subtitle, and a right-side slot for
 * page actions or quick stats.
 */
export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-graphite-900 px-5 py-5 sm:px-7 sm:py-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(63,125,116,0.35),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(193,121,63,0.22),transparent_50%)]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden>
        <defs>
          <pattern id="pageheader-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="white" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pageheader-grid)" />
      </svg>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-copper-400 to-copper-600 shadow-lg shadow-copper-500/20">
              <Icon className="size-5 text-white" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="font-mono-data text-[11px] uppercase tracking-wider text-copper-400">{eyebrow}</p>
            )}
            <h1 className="mt-0.5 font-display text-xl font-semibold text-white sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-white/55">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  )
}
