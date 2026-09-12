import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { TICKER_SEED, getMaterial } from '@/data/materials'
import { cn } from '@/lib/utils'

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: Minus }
const TREND_COLOR = {
  up: 'text-emerald-300',
  down: 'text-red-300',
  flat: 'text-ink-300',
}

function TickerRow({ row }) {
  const material = getMaterial(row.id)
  const TrendIcon = TREND_ICON[row.trend]
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] py-3">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: material?.swatch || '#999' }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/90">{row.label}</p>
      </div>
      <p className="font-mono-data text-sm text-white/80 tabular-nums">
        {row.price.toLocaleString()}
        <span className="text-white/40">/{row.unit}</span>
      </p>
      <span className={cn('flex items-center gap-0.5 font-mono-data text-xs tabular-nums w-14 justify-end', TREND_COLOR[row.trend])}>
        <TrendIcon className="size-3" />
        {row.change}
      </span>
    </div>
  )
}

/**
 * The marketplace's signature element: a live-exchange-style ticker of
 * reference material prices, doubled and animated so it loops seamlessly.
 * Reused visually across the product — the same swatch dot + mono price
 * language reappears on product cards, badges and dashboard charts.
 */
export function MaterialTicker() {
  const rows = [...TICKER_SEED, ...TICKER_SEED]
  return (
    <div className="relative h-full overflow-hidden fade-mask-y">
      <div className="ticker-track">
        {rows.map((row, i) => (
          <TickerRow row={row} key={`${row.id}-${i}`} />
        ))}
      </div>
    </div>
  )
}
