import { mockAuthRepository } from '@/services/repositories/mockAuthRepository'

const repository = mockAuthRepository

export const adminService = {
  listApprovals: (filters) => repository.listApprovals(filters),
  approveUser: (userId, adminName) => repository.approveUser(userId, adminName),
  rejectUser: (userId, reason, adminName) => repository.rejectUser(userId, reason, adminName),
  requestMoreDocuments: (userId, note, adminName) => repository.requestMoreDocuments(userId, note, adminName),
  suspendUser: (userId, adminName) => repository.suspendUser(userId, adminName),
  activateUser: (userId, adminName) => repository.activateUser(userId, adminName),
  resetUserPassword: (userId, adminName) => repository.resetUserPassword(userId, adminName),
  listAllUsers: () => repository.listAllUsers(),
}
