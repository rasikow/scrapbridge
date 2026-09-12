import {
  listNotifications, unreadCount, markRead, markAllRead, pushNotification, notificationBus,
} from '@/lib/notificationStore'

export const notificationService = {
  list: (userId, opts) => listNotifications(userId, opts),
  unreadCount: (userId) => unreadCount(userId),
  markRead: (id) => markRead(id),
  markAllRead: (userId) => markAllRead(userId),
  push: (payload) => pushNotification(payload),
  bus: notificationBus,
}
