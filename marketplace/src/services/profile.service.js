import { mockProfileRepository } from '@/services/repositories/mockProfileRepository'

const repository = mockProfileRepository

export const profileService = {
  getBuyerProfile: (userId) => repository.getBuyerProfile(userId),
  getSellerProfile: (userId) => repository.getSellerProfile(userId),
  updatePassword: (userId, current, next) => repository.updatePassword(userId, current, next),
  getNotificationPrefs: (userId) => repository.getNotificationPrefs(userId),
  updateNotificationPrefs: (userId, prefs) => repository.updateNotificationPrefs(userId, prefs),
}
