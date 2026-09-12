import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-400 focus-visible:border-copper-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-signal-down' : 'border-ink-300/40',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
