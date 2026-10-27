import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model.js';
import { Prediction } from '../models/Prediction.model.js';
import { FraudAlert } from '../models/FraudAlert.model.js';

export class TransactionRepository {
  /**
   * Persists a new financial transaction into MongoDB
   */
  async create(data) {
    const docData = {
      externalTransactionId: data.externalTransactionId,
      amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      currency: data.currency || 'USD',
      transactionTimestamp: data.transactionTimestamp ? new Date(data.transactionTimestamp) : new Date(),
      merchant: {
        id: data.merchantId || data.merchant?.id,
        name: data.merchantName || data.merchant?.name,
        category: data.merchantCategory || data.merchant?.category,
      },
      customer: {
        id: data.customerId || data.customer?.id,
        email: data.customerEmail || data.customer?.email,
        phone: data.customerPhone || data.customer?.phone,
      },
      channel: data.channel || 'ONLINE',
      cardPresent: data.cardPresent ?? null,
      deviceId: data.deviceId || null,
      ipAddress: data.ipAddress || null,
      location: data.location || {},
      metadata: data.metadata || {},
    };

    const created = await Transaction.create(docData);
    const json = created.toJSON();
    json.id = created._id.toString();
    return json;
  }

  /**
   * Finds a transaction by its primary MongoDB ObjectId or string id
   */
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await Transaction.findById(id).lean();
    if (!doc) return null;

    doc.id = doc._id.toString();
    if (doc.amount) {
      doc.amount = parseFloat(doc.amount.toString());
    }

    // Attach latest predictions and fraud alerts
    const predictions = await Prediction.find({ transactionId: doc._id })
      .select('modelVersionId fraudProbability riskScore riskLevel createdAt')
      .lean();

    doc.predictions = predictions.map((p) => ({
      id: p._id.toString(),
      modelVersionId: p.modelVersionId.toString(),
      fraudProbability: p.fraudProbability ? parseFloat(p.fraudProbability.toString()) : 0,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      createdAt: p.createdAt,
    }));

    const alerts = await FraudAlert.find({ transactionId: doc._id })
      .select('severity status description createdAt')
      .lean();

    doc.fraudAlerts = alerts.map((a) => ({
      id: a._id.toString(),
      severity: a.severity,
      status: a.status,
      description: a.description,
      createdAt: a.createdAt,
    }));

    return doc;
  }

  /**
   * Finds a transaction by its unique external transaction ID
   */
  async findByExternalId(externalTransactionId) {
    if (!externalTransactionId) return null;
    const doc = await Transaction.findOne({ externalTransactionId }).lean();
    if (!doc) return null;

    doc.id = doc._id.toString();
    if (doc.amount) {
      doc.amount = parseFloat(doc.amount.toString());
    }
    return doc;
  }

  /**
   * Lists transactions with filtering, pagination, and sorting
   */
  async findMany({ skip = 0, take = 20, where = {}, orderBy = { transactionTimestamp: -1 } }) {
    const query = {};

    if (where.customerId) {
      query['customer.id'] = where.customerId;
    }
    if (where.merchantId) {
      query['merchant.id'] = where.merchantId;
    }
    if (where.currency) {
      query.currency = where.currency;
    }
    if (where.channel) {
      query.channel = where.channel;
    }
    if (where.startDate || where.endDate) {
      query.transactionTimestamp = {};
      if (where.startDate) query.transactionTimestamp.$gte = new Date(where.startDate);
      if (where.endDate) query.transactionTimestamp.$lte = new Date(where.endDate);
    }
    if (where.minAmount || where.maxAmount) {
      query.amount = {};
      if (where.minAmount) {
        query.amount.$gte = mongoose.Types.Decimal128.fromString(where.minAmount.toString());
      }
      if (where.maxAmount) {
        query.amount.$lte = mongoose.Types.Decimal128.fromString(where.maxAmount.toString());
      }
    }

    if (where.search) {
      const searchRegex = new RegExp(where.search, 'i');
      query.$or = [
        { externalTransactionId: searchRegex },
        { 'customer.email': searchRegex },
        { 'merchant.name': searchRegex },
      ];
    }

    const docs = await Transaction.find(query)
      .sort(orderBy)
      .skip(skip)
      .limit(take)
      .lean();

    const txIds = docs.map((d) => d._id);
    const predictions = await Prediction.find({ transactionId: { $in: txIds } })
      .select('transactionId riskScore riskLevel fraudProbability modelVersionId createdAt')
      .lean();

    const predMap = new Map();
    predictions.forEach((p) => {
      predMap.set(p.transactionId.toString(), {
        riskScore: p.riskScore,
        riskLevel: p.riskLevel,
        fraudProbability: p.fraudProbability ? parseFloat(p.fraudProbability.toString()) : 0,
        predictionId: p._id.toString(),
      });
    });

    return docs.map((doc) => {
      doc.id = doc._id.toString();
      if (doc.amount) {
        doc.amount = parseFloat(doc.amount.toString());
      }
      const pred = predMap.get(doc._id.toString()) || null;
      doc.prediction = pred;
      doc.riskScore = pred?.riskScore ?? null;
      doc.riskLevel = pred?.riskLevel ?? 'UNSCORRED';
      return doc;
    });
  }

  /**
   * Counts total matching transactions for pagination metadata
   */
  async count(where = {}) {
    const query = {};
    if (where.customerId) query['customer.id'] = where.customerId;
    if (where.merchantId) query['merchant.id'] = where.merchantId;
    if (where.currency) query.currency = where.currency;
    if (where.channel) query.channel = where.channel;
    if (where.search) {
      const searchRegex = new RegExp(where.search, 'i');
      query.$or = [
        { externalTransactionId: searchRegex },
        { 'customer.email': searchRegex },
        { 'merchant.name': searchRegex },
      ];
    }
    if (where.startDate || where.endDate) {
      query.transactionTimestamp = {};
      if (where.startDate) query.transactionTimestamp.$gte = new Date(where.startDate);
      if (where.endDate) query.transactionTimestamp.$lte = new Date(where.endDate);
    }
    return Transaction.countDocuments(query);
  }
}

export const transactionRepository = new TransactionRepository();
