import mongoose from 'mongoose';
import { FraudAlert } from '../models/FraudAlert.model.js';
import { InvestigationRecord } from '../models/InvestigationRecord.model.js';
import { Prediction } from '../models/Prediction.model.js';
import { auditService } from './auditService.js';

export class AlertService {
  /**
   * Lists alerts with server-side filtering, sorting, and pagination
   */
  async listAlerts(query = {}) {
    const { page = 1, limit = 20, status, severity, assignedToId, search } = query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (assignedToId) {
      if (assignedToId === 'unassigned') {
        filter.assignedToId = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedToId)) {
        filter.assignedToId = assignedToId;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, totalRecords] = await Promise.all([
      FraudAlert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('transactionId')
        .populate('assignedToId', 'name email role')
        .populate('predictionId')
        .lean(),
      FraudAlert.countDocuments(filter),
    ]);

    const formatted = alerts.map((a) => {
      const tx = a.transactionId || {};
      const pred = a.predictionId || {};
      return {
        id: a._id.toString(),
        severity: a.severity,
        status: a.status,
        description: a.description || 'Elevated transaction fraud risk profile',
        triggeredRules: a.triggeredRules || [],
        transaction: {
          id: tx._id?.toString() || null,
          externalTransactionId: tx.externalTransactionId || 'N/A',
          amount: tx.amount ? parseFloat(tx.amount.toString()) : 0,
          currency: tx.currency || 'USD',
          timestamp: tx.transactionTimestamp || tx.createdAt,
          merchant: tx.merchant || {},
          customer: tx.customer || {},
        },
        prediction: {
          id: pred._id?.toString() || null,
          riskScore: pred.riskScore ?? null,
          riskLevel: pred.riskLevel ?? null,
          fraudProbability: pred.fraudProbability ? parseFloat(pred.fraudProbability.toString()) : 0,
        },
        assignedTo: a.assignedToId
          ? {
              id: a.assignedToId._id?.toString(),
              name: a.assignedToId.name,
              email: a.assignedToId.email,
              role: a.assignedToId.role,
            }
          : null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

    return {
      alerts: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
      },
    };
  }

  /**
   * Retrieves single alert with investigation record history & detailed SHAP
   */
  async getAlertById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid alert ID');
      err.status = 422;
      throw err;
    }

    const alert = await FraudAlert.findById(id)
      .populate('transactionId')
      .populate('assignedToId', 'name email role')
      .populate('predictionId')
      .lean();

    if (!alert) {
      const err = new Error('Alert not found');
      err.status = 404;
      throw err;
    }

    // Fetch all investigation records for this alert
    const investigations = await InvestigationRecord.find({ alertId: id })
      .populate('investigatorId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...alert,
      id: alert._id.toString(),
      investigations: investigations.map((inv) => ({
        ...inv,
        id: inv._id.toString(),
      })),
    };
  }

  /**
   * Assigns an alert to an investigator
   */
  async assignAlert(alertId, assignedToId, actorId) {
    const alert = await FraudAlert.findById(alertId);
    if (!alert) {
      const err = new Error('Alert not found');
      err.status = 404;
      throw err;
    }

    alert.assignedToId = assignedToId;
    if (alert.status === 'OPEN') {
      alert.status = 'IN_REVIEW';
    }
    await alert.save();

    await auditService.logAction({
      actorId,
      action: 'ALERT_ASSIGNED',
      entityType: 'FraudAlert',
      entityId: alert._id,
      metadata: { assignedToId },
    });

    return alert;
  }

  /**
   * Updates alert status with state transition audit
   */
  async updateStatus(alertId, newStatus, actorId) {
    const alert = await FraudAlert.findById(alertId);
    if (!alert) {
      const err = new Error('Alert not found');
      err.status = 404;
      throw err;
    }

    const oldStatus = alert.status;
    alert.status = newStatus;
    if (newStatus === 'RESOLVED' || newStatus === 'DISMISSED') {
      alert.resolvedAt = new Date();
    }
    await alert.save();

    await auditService.logAction({
      actorId,
      action: 'ALERT_STATUS_CHANGED',
      entityType: 'FraudAlert',
      entityId: alert._id,
      metadata: { oldStatus, newStatus },
    });

    return alert;
  }

  /**
   * Records human investigation findings and decision
   */
  async recordInvestigation(alertId, investigationData, actorId) {
    const alert = await FraudAlert.findById(alertId);
    if (!alert) {
      const err = new Error('Alert not found');
      err.status = 404;
      throw err;
    }

    const record = await InvestigationRecord.create({
      alertId,
      investigatorId: actorId,
      findings: investigationData.findings,
      decision: investigationData.decision,
      resolution: investigationData.resolution || '',
      isFraud: investigationData.isFraud ?? (investigationData.decision === 'CONFIRMED_FRAUD'),
      investigationStatus: investigationData.decision ? 'COMPLETED' : 'IN_PROGRESS',
      reviewedAt: new Date(),
    });

    // Update alert status accordingly
    if (investigationData.decision === 'CONFIRMED_FRAUD' || investigationData.decision === 'FALSE_POSITIVE') {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date();
    } else {
      alert.status = 'IN_REVIEW';
    }
    await alert.save();

    await auditService.logAction({
      actorId,
      action: 'INVESTIGATION_FINDING_RECORDED',
      entityType: 'InvestigationRecord',
      entityId: record._id,
      metadata: {
        alertId,
        decision: investigationData.decision,
        isFraud: record.isFraud,
      },
    });

    return record;
  }
}

export const alertService = new AlertService();
