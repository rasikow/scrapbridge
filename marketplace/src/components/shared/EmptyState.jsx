import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-paper-300 bg-gradient-to-b from-paper-100/60 to-white px-6 py-14 text-center"
    >
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-paper-200 to-paper-300 shadow-inner">
          <Icon className="size-6 text-ink-400" />
        </div>
      )}
      <p className="font-display text-base font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {actionLabel && (
        <Button variant="copper" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
