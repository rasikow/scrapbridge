import { sleep } from '@/lib/utils'
import { safeSetItem } from '@/lib/safeStorage'

// Mirrors the `auditLogs` Firestore collection. Other repositories call
// `auditRepository.log(...)` at the point an action happens (login,
// approvals, product changes, order changes) so this stays a real trail
// rather than a static demo list.

const KEY = 'marketplace_mock_audit_logs_v1'

const SEED_LOGS = [
  { actor: 'Priya Nair', role: 'admin', action: 'Approved buyer', target: 'Meridian Metals Trading LLC', category: 'approval', at: daysAgo(180) },
  { actor: 'Priya Nair', role: 'admin', action: 'Approved seller', target: 'Gulf Recycling Industries', category: 'approval', at: daysAgo(200) },
  { actor: 'Fatima Al-Sayed', role: 'seller', action: 'Logged in', target: null, category: 'login', at: daysAgo(2) },
  { actor: 'Fatima Al-Sayed', role: 'seller', action: 'Updated product', target: 'Steel Scrap — HMS 1&2', category: 'product', at: daysAgo(3) },
  { actor: 'Arjun Mehta', role: 'buyer', action: 'Placed order', target: 'ORD-02005', category: 'order', at: daysAgo(4) },
  { actor: 'Priya Nair', role: 'admin', action: 'Rejected product listing', target: 'Mixed Scrap — Ungraded', category: 'approval', at: daysAgo(6) },
  { actor: 'Arjun Mehta', role: 'buyer', action: 'Logged in', target: null, category: 'login', at: daysAgo(1) },
  { actor: 'System', role: 'system', action: 'Order status changed to Delivered', target: 'ORD-02003', category: 'order', at: daysAgo(3) },
]

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}

function readLogs() {
  const raw = localStorage.getItem(KEY)
  if (raw) return JSON.parse(raw)
  const seeded = SEED_LOGS.map((l, i) => ({ id: `log_${i}`, ...l }))
  safeSetItem(KEY, JSON.stringify(seeded))
  return seeded
}

function writeLogs(logs) {
  safeSetItem(KEY, JSON.stringify(logs))
}

export const mockAuditRepository = {
  async log({ actor, role, action, target, category }) {
    const logs = readLogs()
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actor, role, action, target: target || null, category,
      at: new Date().toISOString(),
    }
    writeLogs([entry, ...logs])
    return entry
  },

  async listLogs({ category, query } = {}) {
    await sleep(300)
    let logs = readLogs().sort((a, b) => new Date(b.at) - new Date(a.at))
    if (category && category !== 'All') logs = logs.filter((l) => l.category === category.toLowerCase())
    if (query) {
      const q = query.toLowerCase()
      logs = logs.filter(
        (l) => l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || (l.target || '').toLowerCase().includes(q)
      )
    }
    return logs
  },
}

// Synchronous fire-and-forget logger for other repositories to call inline
// without needing to await — audit logging should never block or fail the
// primary action.
export function recordAuditEvent(entry) {
  try {
    mockAuditRepository.log(entry)
  } catch {
    // best-effort — never let audit logging break the calling action
  }
}
