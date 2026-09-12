import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Formats a Date/number as a short reference code, e.g. BYR-2K91QF */
export function generateRefCode(prefix = 'REF') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${rand}`
}

export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Fixed 2-decimal price display without the currency symbol, e.g. "149.30" */
export function formatPrice(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
