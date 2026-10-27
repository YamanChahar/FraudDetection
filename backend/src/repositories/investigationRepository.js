import mongoose from 'mongoose';
import { InvestigationRecord } from '../models/InvestigationRecord.model.js';

export class InvestigationRepository {
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await InvestigationRecord.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    if (doc.lossAmount) {
      doc.lossAmount = parseFloat(doc.lossAmount.toString());
    }
    return doc;
  }

  async findByAlertId(alertId) {
    if (!mongoose.Types.ObjectId.isValid(alertId)) return [];
    const docs = await InvestigationRecord.find({ alertId }).sort({ createdAt: -1 }).lean();
    return docs.map((doc) => {
      doc.id = doc._id.toString();
      if (doc.lossAmount) {
        doc.lossAmount = parseFloat(doc.lossAmount.toString());
      }
      return doc;
    });
  }

  async create(data) {
    const created = await InvestigationRecord.create({
      alertId: new mongoose.Types.ObjectId(data.alertId),
      investigatorId: new mongoose.Types.ObjectId(data.investigatorId),
      investigationStatus: data.investigationStatus || 'IN_PROGRESS',
      findings: data.findings,
      decision: data.decision || null,
      resolution: data.resolution || '',
      evidence: data.evidence || {},
      isFraud: data.isFraud ?? null,
      lossAmount: data.lossAmount ? mongoose.Types.Decimal128.fromString(data.lossAmount.toString()) : null,
      reviewedAt: data.reviewedAt || null,
    });
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }
}

export const investigationRepository = new InvestigationRepository();
