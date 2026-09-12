import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Zap } from 'lucide-react'
import { timeRemainingMs, formatDuration } from '@/lib/auctionEngine'
import { cn } from '@/lib/utils'

function breakdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  }
}

/** Single flip-style digit unit used by the size="lg" segmented clock. */
function TimeUnit({ value, label, urgency }) {
  const tone = {
    safe: 'bg-graphite-900 text-white',
    warn: 'bg-signal-warn text-white',
    critical: 'bg-signal-down text-white',
  }[urgency]
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative w-14 overflow-hidden rounded-[var(--radius-sm)] py-2 text-center shadow-sm', tone)}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="block font-mono-data text-xl font-semibold tabular-nums"
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-ink-500">{label}</span>
    </div>
  )
}

/**
 * Self-ticking countdown — updates every second on its own. Two display
 * modes:
 *  - default/sm: compact inline text with escalating urgency color, used
 *    in cards, tables and list rows.
 *  - lg: a rich segmented "flip clock" (days/hours/min/sec boxes) with a
 *    duration progress bar and pulsing critical state — used on the
 *    auction/product detail pages where the timer is the focal point.
 */
export function CountdownTimer({ endAt, startAt, className, size = 'default' }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!endAt) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-ink-500', className)}>
        <Timer className="size-3.5" /> Open-ended — closes when seller accepts an offer
      </span>
    )
  }

  const notStarted = startAt && new Date(startAt).getTime() > now
  const ms = timeRemainingMs(endAt)
  const ended = ms != null && ms <= 0
  const critical = ms != null && ms > 0 && ms < 300000 // < 5 min
  const warn = ms != null && ms > 0 && ms < 3600000 // < 1 hr
  const urgency = critical ? 'critical' : warn ? 'warn' : 'safe'

  if (size === 'lg' && !notStarted && !ended) {
    const { d, h, m, s } = breakdown(ms)
    const totalDuration = startAt ? new Date(endAt).getTime() - new Date(startAt).getTime() : null
    const pctElapsed = totalDuration ? Math.min(100, Math.max(0, ((totalDuration - ms) / totalDuration) * 100)) : null
    return (
      <div className={cn('inline-flex flex-col gap-2.5', className)}>
        <div className="flex items-center gap-2">
          {d > 0 && <TimeUnit value={d} label="Days" urgency={urgency} />}
          <TimeUnit value={h} label="Hrs" urgency={urgency} />
          <span className="pb-4 font-mono-data text-lg text-ink-300">:</span>
          <TimeUnit value={m} label="Min" urgency={urgency} />
          <span className="pb-4 font-mono-data text-lg text-ink-300">:</span>
          <motion.div
            animate={critical ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1, repeat: critical ? Infinity : 0 }}
          >
            <TimeUnit value={s} label="Sec" urgency={urgency} />
          </motion.div>
          {critical && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-1 flex items-center gap-1 self-start rounded-full bg-signal-down/10 px-2 py-1 text-[11px] font-semibold text-signal-down"
            >
              <Zap className="size-3" /> Ending fast
            </motion.span>
          )}
        </div>
        {pctElapsed != null && (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-paper-300">
            <motion.div
              className={cn('h-full rounded-full', critical ? 'bg-signal-down' : warn ? 'bg-signal-warn' : 'bg-copper-500')}
              animate={{ width: `${pctElapsed}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono-data tabular-nums',
        size === 'lg' ? 'text-lg font-semibold' : 'text-sm font-medium',
        ended ? 'text-ink-500' : urgency === 'critical' ? 'text-signal-down' : urgency === 'warn' ? 'text-signal-warn' : 'text-ink-900',
        className
      )}
    >
      {urgency === 'critical' && !ended && !notStarted ? (
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
          <Zap className={size === 'lg' ? 'size-4.5' : 'size-3.5'} />
        </motion.span>
      ) : (
        <Timer className={size === 'lg' ? 'size-4.5' : 'size-3.5'} />
      )}
      {notStarted ? `Starts in ${formatDuration(new Date(startAt).getTime() - now)}` : ended ? 'Auction ended' : formatDuration(ms)}
    </span>
  )
}
