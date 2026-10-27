import { auditRepository } from '../repositories/auditRepository.js';

export class AuditService {
  /**
   * Records an audit event safely without throwing fatal exceptions if logging fails
   */
  async logAction({ actorId, action, entityType, entityId, metadata = {} }) {
    try {
      const record = await auditRepository.createLog({
        actorId,
        action,
        entityType,
        entityId,
        metadata,
      });
      return record;
    } catch (error) {
      // Non-blocking fallback: log to console so business transactions are not aborted
      console.error(`[TRACE AuditService] Failed to record audit log for action ${action}:`, error.message);
      return null;
    }
  }
}

export const auditService = new AuditService();
