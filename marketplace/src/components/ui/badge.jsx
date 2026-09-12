import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        default: 'bg-paper-200 text-ink-700 border-transparent',
        copper: 'bg-copper-100 text-copper-600 border-transparent',
        verdigris: 'bg-verdigris-100 text-verdigris-600 border-transparent',
        success: 'bg-signal-up/10 text-signal-up border-transparent',
        warning: 'bg-signal-warn/10 text-signal-warn border-transparent',
        danger: 'bg-signal-down/10 text-signal-down border-transparent',
        outline: 'bg-transparent text-ink-700 border-ink-300/50',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
