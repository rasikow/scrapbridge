import { cn } from '@/lib/utils'
import { CountUpNumber } from '@/components/shared/CountUpNumber'

export function StatCard({ label, value, icon: Icon, tone = 'default', trend }) {
  const toneClasses = {
    default: 'bg-gradient-to-br from-graphite-800 to-graphite-950 text-white',
    copper: 'bg-gradient-to-br from-copper-400 to-copper-600 text-white',
    verdigris: 'bg-gradient-to-br from-verdigris-400 to-verdigris-600 text-white',
    outline: 'bg-paper-200 text-ink-700',
  }
  const isNumeric = typeof value === 'number' && !Number.isNaN(value)
  return (
    <div className="group rounded-[var(--radius-lg)] border border-paper-300 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-copper-300/60 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 truncate font-mono-data text-lg font-semibold text-ink-900 tabular-nums sm:text-2xl" title={String(value)}>
            {isNumeric ? <CountUpNumber value={value} /> : value}
          </p>
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.positive ? 'text-signal-up' : 'text-signal-down')}>
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] shadow-sm transition-transform duration-200 group-hover:scale-110', toneClasses[tone])}>
            <Icon className="size-4.5" />
          </div>
        )}
      </div>
    </div>
  )
}
