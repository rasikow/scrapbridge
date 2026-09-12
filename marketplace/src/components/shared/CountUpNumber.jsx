import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number counting up from 0 to `value` on mount/value change.
 * Used to give dashboard stats a sense of momentum rather than just
 * appearing as static text.
 */
export function useCountUp(value, { duration = 900 } = {}) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  const startRef = useRef()
  const fromRef = useRef(0)

  useEffect(() => {
    const target = typeof value === 'number' && !Number.isNaN(value) ? value : 0
    fromRef.current = 0
    startRef.current = null

    function tick(ts) {
      if (startRef.current == null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(1, elapsed / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(fromRef.current + (target - fromRef.current) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return display
}

export function CountUpNumber({ value, format = (v) => Math.round(v).toLocaleString(), duration = 900, className }) {
  const display = useCountUp(value, { duration })
  return <span className={className}>{format(display)}</span>
}
