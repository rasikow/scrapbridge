import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { timeRemainingMs } from '@/lib/auctionEngine'
import { cn } from '@/lib/utils'

/**
 * Compact circular progress ring showing time remaining as a shrinking arc
 * — an at-a-glance "wow" indicator for auction thumbnails in browse grids,
 * separate from the full flip-clock CountdownTimer used on detail pages.
 * Only meant for auctions ending soon (see usage guard in AuctionCard).
 */
export function CircularCountdownRing({ endAt, startAt, size = 44 }) {
  const [, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const ms = timeRemainingMs(endAt)
  if (ms == null || ms <= 0) return null

  const totalDuration = startAt ? new Date(endAt).getTime() - new Date(startAt).getTime() : 24 * 3600000
  const pctRemaining = Math.min(1, Math.max(0, ms / Math.min(totalDuration, 24 * 3600000)))
  const critical = ms < 300000
  const warn = ms < 3600000

  const radius = size / 2 - 3
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pctRemaining)

  const hours = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  const label = hours > 0 ? `${hours}h` : `${mins}m`
  const color = critical ? '#e11d48' : warn ? '#f59e0b' : '#4f46e5'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="rgba(10,14,39,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <span className={cn('absolute font-mono-data text-[10px] font-semibold text-white', critical && 'animate-pulse')}>
        {label}
      </span>
    </div>
  )
}
