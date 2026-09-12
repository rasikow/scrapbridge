import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-20 w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-400 focus-visible:border-copper-400',
      error ? 'border-signal-down' : 'border-ink-300/40',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
