import mongoose from 'mongoose';
import { Prediction } from '../models/Prediction.model.js';

export class PredictionRepository {
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await Prediction.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    if (doc.fraudProbability) {
      doc.fraudProbability = parseFloat(doc.fraudProbability.toString());
    }
    return doc;
  }

  async findByTransactionId(transactionId) {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) return [];
    const docs = await Prediction.find({ transactionId }).sort({ createdAt: -1 }).lean();
    return docs.map((doc) => {
      doc.id = doc._id.toString();
      if (doc.fraudProbability) {
        doc.fraudProbability = parseFloat(doc.fraudProbability.toString());
      }
      return doc;
    });
  }

  async create(data) {
    const created = await Prediction.create({
      transactionId: new mongoose.Types.ObjectId(data.transactionId),
      modelVersionId: new mongoose.Types.ObjectId(data.modelVersionId),
      fraudProbability: mongoose.Types.Decimal128.fromString(data.fraudProbability.toString()),
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      predictionStatus: data.predictionStatus || 'SUCCESS',
      predictionLabel: data.predictionLabel ?? 0,
      latencyMs: data.latencyMs || 0,
      explanationData: data.explanationData || {},
    });
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }
}

export const predictionRepository = new PredictionRepository();
