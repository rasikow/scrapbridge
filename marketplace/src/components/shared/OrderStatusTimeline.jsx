import { Check, X } from 'lucide-react'
import { STATUS_SEQUENCE } from '@/data/orderStatus'
import { cn } from '@/lib/utils'

export function OrderStatusTimeline({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-signal-down/30 bg-signal-down/5 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-signal-down text-white">
          <X className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-900">Order cancelled</p>
          <p className="text-xs text-ink-500">This order was cancelled and will not be fulfilled.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(status)

  return (
    <div className="flex items-start">
      {STATUS_SEQUENCE.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === STATUS_SEQUENCE.length - 1
        return (
          <div key={step} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-xs font-medium',
                  done ? 'border-verdigris-500 bg-verdigris-500 text-white' : 'border-ink-300/50 text-ink-300'
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn('hidden text-[11px] font-medium sm:block', done ? 'text-ink-900' : 'text-ink-300')}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={cn('mx-1.5 mb-4 h-0.5 flex-1 sm:mb-5', i < currentIndex ? 'bg-verdigris-500' : 'bg-paper-300')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
