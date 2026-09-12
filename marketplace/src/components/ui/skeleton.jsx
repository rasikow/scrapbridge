import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-paper-300/70',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className
      )}
      {...props}
    />
  )
}
