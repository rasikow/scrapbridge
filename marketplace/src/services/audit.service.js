import { mockAuditRepository } from '@/services/repositories/mockAuditRepository'

export const auditService = {
  listLogs: (filters) => mockAuditRepository.listLogs(filters),
}
