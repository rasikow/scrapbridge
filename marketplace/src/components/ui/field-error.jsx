import { AlertCircle } from 'lucide-react'

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-signal-down">
      <AlertCircle className="size-3.5" />
      {children}
    </p>
  )
}
