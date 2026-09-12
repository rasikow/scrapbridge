/**
 * localStorage.setItem throws (QuotaExceededError) once the origin's
 * storage limit is hit — and since every mock repository in this app
 * seeds its data on first read, an uncaught throw here happens during
 * initial render and takes the whole app down to a blank page.
 *
 * safeSetItem never throws: on failure it logs a warning and returns
 * false. Callers already return the in-memory value they were about to
 * persist regardless of whether the write succeeds, so a failed write
 * just means that data won't survive a refresh in this session — never
 * a crash.
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    console.warn(`[safeStorage] Could not persist "${key}" (${err?.name || 'error'}) — continuing in-memory only.`, err)
    return false
  }
}
