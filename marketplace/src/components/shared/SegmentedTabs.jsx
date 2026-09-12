import { cn } from '@/lib/utils'

/**
 * Rounded pill segmented control (Fixed / Bid / Auction, etc.) matching
 * the reference marketplace design — a filled active pill on a light
 * track, with an optional count badge per segment. Used to split listings
 * or orders by how they're sold, consistently across the marketplace,
 * seller product list, and order screens.
 */
export function SegmentedTabs({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex flex-wrap items-center gap-1 rounded-full border border-paper-300 bg-paper-100 p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150',
              active ? 'bg-copper-500 text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            )}
          >
            {opt.icon && <opt.icon className="size-3.5" />}
            {opt.label}
            {opt.count != null && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/25' : 'bg-paper-300 text-ink-500')}>
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
