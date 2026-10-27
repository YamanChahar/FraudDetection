import mongoose from 'mongoose';
import { FraudAlert } from '../models/FraudAlert.model.js';

export class FraudAlertRepository {
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await FraudAlert.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    return doc;
  }

  async findByTransactionId(transactionId) {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) return [];
    const docs = await FraudAlert.find({ transactionId }).sort({ createdAt: -1 }).lean();
    return docs.map((doc) => {
      doc.id = doc._id.toString();
      return doc;
    });
  }

  async create(data) {
    const created = await FraudAlert.create({
      transactionId: new mongoose.Types.ObjectId(data.transactionId),
      predictionId: data.predictionId ? new mongoose.Types.ObjectId(data.predictionId) : null,
      severity: data.severity,
      status: data.status || 'OPEN',
      assignedToId: data.assignedToId ? new mongoose.Types.ObjectId(data.assignedToId) : null,
      triggeredRules: data.triggeredRules || [],
      description: data.description || '',
    });
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }
}

export const fraudAlertRepository = new FraudAlertRepository();
