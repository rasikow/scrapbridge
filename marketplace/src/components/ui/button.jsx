import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-graphite-900 text-white shadow-sm hover:bg-graphite-800 hover:shadow-md',
        copper: 'bg-copper-500 text-white shadow-sm shadow-copper-500/20 hover:bg-copper-600 hover:shadow-lg hover:shadow-copper-500/30',
        outline: 'border border-ink-300 bg-transparent text-ink-900 hover:bg-paper-200',
        ghost: 'bg-transparent text-ink-700 hover:bg-paper-200',
        link: 'bg-transparent text-copper-600 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        destructive: 'bg-signal-down text-white shadow-sm hover:opacity-90 hover:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      // Slot requires exactly one element child — never inject the loading
      // icon here; asChild is for wrapping a single nav element (e.g. <Link>).
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
