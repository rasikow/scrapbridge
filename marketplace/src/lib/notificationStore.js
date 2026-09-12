// Generic, per-user, persisted notification feed.
//
// The existing `data/notifications.js` static arrays remain untouched and
// are still used as the seed content for each role's feed on first load —
// this store just makes notifications real (dismissible, markable-as-read,
// and appendable) instead of a frozen demo list, which the auction module
// needs in order to push live "Outbid", "Auction won" etc. events.
//
// Architecture note (brief section 8 — "prepare the architecture for
// email/SMS/WhatsApp"): every notification is created through
// `pushNotification()` below, which fans out to `CHANNEL_DISPATCHERS`.
// Only the `inapp` channel actually does anything in this prototype; the
// email/sms/whatsapp entries are stubbed so a real integration only needs
// to replace the stub function bodies — no call-site changes anywhere in
// the auction engine.

import { BUYER_NOTIFICATIONS, SELLER_NOTIFICATIONS, ADMIN_NOTIFICATIONS } from '@/data/notifications'
import { safeSetItem } from '@/lib/safeStorage'

const KEY = 'marketplace_mock_notifications_v1'

export const notificationBus = new EventTarget()

function readAll() {
  const raw = localStorage.getItem(KEY)
  if (raw) return JSON.parse(raw)
  const seeded = [
    ...BUYER_NOTIFICATIONS.map((n) => ({ ...n, userId: 'usr_buyer_1', role: 'buyer', createdAt: relTimeToIso(n.time) })),
    ...SELLER_NOTIFICATIONS.map((n) => ({ ...n, userId: 'usr_seller_1', role: 'seller', createdAt: relTimeToIso(n.time) })),
    ...ADMIN_NOTIFICATIONS.map((n) => ({ ...n, userId: 'usr_admin', role: 'admin', createdAt: relTimeToIso(n.time) })),
  ]
  safeSetItem(KEY, JSON.stringify(seeded))
  return seeded
}

function writeAll(rows) {
  safeSetItem(KEY, JSON.stringify(rows))
  notificationBus.dispatchEvent(new CustomEvent('changed'))
}

function relTimeToIso(label) {
  // Best-effort parse of the existing seed data's "2 hours ago" style
  // strings into real timestamps so they sort correctly alongside new,
  // live auction notifications.
  const m = /(\d+)\s+(minute|hour|day)/.exec(label || '')
  if (!m) return new Date().toISOString()
  const n = Number(m[1])
  const ms = { minute: 60000, hour: 3600000, day: 86400000 }[m[2]]
  return new Date(Date.now() - n * ms).toISOString()
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// --- Channel architecture (in-app live, others stubbed) -----------------

const CHANNEL_DISPATCHERS = {
  inapp() {
    /* handled by the localStorage write itself */
  },
  email(notification) {
    // Placeholder: wire up to a transactional email provider (e.g. SES,
    // Postmark, SendGrid) here. Intentionally a no-op in this prototype.
    console.debug('[notify:email:stub]', notification.title)
  },
  sms(notification) {
    // Placeholder: wire up to an SMS gateway (e.g. Twilio, MSG91) here.
    console.debug('[notify:sms:stub]', notification.title)
  },
  whatsapp(notification) {
    // Placeholder: wire up to the WhatsApp Business API here.
    console.debug('[notify:whatsapp:stub]', notification.title)
  },
}

/**
 * Creates a notification and fans it out across the requested channels.
 * `channels` defaults to just in-app; auction events that are genuinely
 * time-critical (outbid, auction won, payment required) pass additional
 * channels to demonstrate the multi-channel architecture end to end.
 */
export function pushNotification({ userId, role, title, body, tone = 'default', meta = null, channels = ['inapp'] }) {
  const notification = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    role,
    title,
    body,
    tone,
    unread: true,
    meta,
    createdAt: new Date().toISOString(),
    channels,
  }
  const all = readAll()
  writeAll([notification, ...all])
  channels.forEach((c) => CHANNEL_DISPATCHERS[c]?.(notification))
  return notification
}

export function listNotifications(userId, { limit } = {}) {
  const rows = readAll()
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((n) => ({ ...n, time: n.time || timeAgo(n.createdAt) }))
  return limit ? rows.slice(0, limit) : rows
}

export function unreadCount(userId) {
  return readAll().filter((n) => n.userId === userId && n.unread).length
}

export function markRead(notificationId) {
  const all = readAll()
  const idx = all.findIndex((n) => n.id === notificationId)
  if (idx === -1) return
  all[idx] = { ...all[idx], unread: false }
  writeAll(all)
}

export function markAllRead(userId) {
  const all = readAll().map((n) => (n.userId === userId ? { ...n, unread: false } : n))
  writeAll(all)
}
