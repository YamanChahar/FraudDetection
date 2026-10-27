import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.model.js';

export class AuditRepository {
  /**
   * Appends an immutable audit log record to MongoDB
   * @param {object} params
   * @param {string} [params.actorId] - ID of actor (optional)
   * @param {string} params.action - Action identifier
   * @param {string} params.entityType - Target entity name
   * @param {string} [params.entityId] - Primary key of affected entity
   * @param {string} [params.ipAddress] - Request IP
   * @param {string} [params.userAgent] - Request User Agent
   * @param {string} [params.correlationId] - Correlation ID
   * @param {object} [params.metadata] - Structured contextual metadata
   * @returns {Promise<object>}
   */
  async createLog({ actorId, action, entityType, entityId, ipAddress, userAgent, correlationId, metadata }) {
    let validActorId = null;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      validActorId = new mongoose.Types.ObjectId(actorId);
    }

    const created = await AuditLog.create({
      actorId: validActorId,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      correlationId: correlationId || null,
      metadata: metadata || {},
    });

    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }

  /**
   * Reads audit entries with pagination (read-only; no update or delete operations exist)
   */
  async findMany({ skip = 0, take = 50, where = {} } = {}) {
    const query = {};
    if (where.action) query.action = where.action;
    if (where.entityType) query.entityType = where.entityType;
    if (where.entityId) query.entityId = where.entityId;

    const docs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .lean();

    return docs.map((doc) => {
      doc.id = doc._id.toString();
      return doc;
    });
  }
}

export const auditRepository = new AuditRepository();
