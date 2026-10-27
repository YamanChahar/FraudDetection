import mongoose from 'mongoose';
import { transactionRepository } from '../repositories/transactionRepository.js';
import { auditService } from './auditService.js';
import { predictTransaction } from './mlClientService.js';
import { Prediction } from '../models/Prediction.model.js';
import { ModelVersion } from '../models/ModelVersion.model.js';
import { FraudAlert } from '../models/FraudAlert.model.js';

export class TransactionService {
  /**
   * Ingests, analyzes with ML, and stores a financial transaction
   */
  async createTransaction(transactionData, actorId = null) {
    // Check for idempotency / duplicate externalTransactionId
    if (transactionData.externalTransactionId) {
      const existing = await transactionRepository.findByExternalId(transactionData.externalTransactionId);
      if (existing) {
        const error = new Error(`Transaction with external ID '${transactionData.externalTransactionId}' already exists`);
        error.code = 'CONFLICT';
        error.status = 409;
        throw error;
      }
    }

    const transaction = await transactionRepository.create(transactionData);

    // Prepare features for ML Inference
    const rawAmount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount?.toString() || '0');
    const mlFeatures = {
      Amount: rawAmount,
      Time: transactionData.Time ?? (Date.now() % 172800),
    };

    // Extract any V1-V28 PCA features if supplied (benchmark inputs or advanced form)
    for (let i = 1; i <= 28; i++) {
      const key = `V${i}`;
      if (transactionData[key] !== undefined) {
        mlFeatures[key] = parseFloat(transactionData[key]);
      } else if (transactionData.metadata && transactionData.metadata[key] !== undefined) {
        mlFeatures[key] = parseFloat(transactionData.metadata[key]);
      }
    }

    let predictionResult = null;
    let createdAlert = null;

    try {
      // 1. Call Python ML Microservice for prediction and SHAP attribution
      const mlResponse = await predictTransaction(mlFeatures);

      // 2. Ensure model version record exists in database
      const versionStr = mlResponse.model_version || 'v1.2.0-champion';
      let modelVersion = await ModelVersion.findOne({ version: versionStr });
      if (!modelVersion) {
        modelVersion = await ModelVersion.create({
          name: mlResponse.model_name || 'Champion Model',
          version: versionStr,
          algorithm: 'LOGISTIC_REGRESSION',
          status: 'CHAMPION',
          isActive: true,
          deployedAt: new Date(),
        });
      }

      // 3. Persist prediction in MongoDB
      const predictionDoc = await Prediction.create({
        transactionId: transaction.id,
        modelVersionId: modelVersion._id,
        fraudProbability: mongoose.Types.Decimal128.fromString(mlResponse.fraud_probability.toString()),
        riskScore: mlResponse.risk_score,
        riskLevel: mlResponse.risk_level,
        predictionLabel: mlResponse.prediction_label ?? (mlResponse.risk_score >= 71 ? 1 : 0),
        predictionStatus: 'SUCCESS',
        latencyMs: mlResponse.latency_ms || 12,
        explanationData: mlResponse.shap_explanation || {},
      });

      predictionResult = predictionDoc.toJSON();

      // 4. Auto-generate FraudAlert if transaction risk is HIGH or CRITICAL
      if (mlResponse.risk_level === 'HIGH' || mlResponse.risk_level === 'CRITICAL') {
        const alertDoc = await FraudAlert.create({
          transactionId: transaction.id,
          predictionId: predictionDoc._id,
          severity: mlResponse.risk_level,
          status: 'OPEN',
          description: `Automated alert: High risk score (${mlResponse.risk_score}/100) detected by ${modelVersion.name}`,
          triggeredRules: mlResponse.shap_explanation?.top_contributing_features || [],
        });
        createdAlert = alertDoc.toJSON();
      }
    } catch (mlErr) {
      console.warn(`[TRACE Transaction] ML Inference skipped or degraded: ${mlErr.message}`);
    }

    // Record audit event
    await auditService.logAction({
      actorId,
      action: 'TRANSACTION_CREATED',
      entityType: 'Transaction',
      entityId: transaction.id,
      metadata: {
        externalTransactionId: transaction.externalTransactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        riskScore: predictionResult?.riskScore ?? null,
        riskLevel: predictionResult?.riskLevel ?? null,
      },
    });

    return {
      transaction,
      prediction: predictionResult,
      alert: createdAlert,
    };
  }

  /**
   * Retrieves a single transaction with its linked predictions, alerts, and SHAP explanations
   */
  async getTransactionById(id) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      const error = new Error(`Transaction with ID '${id}' not found`);
      error.code = 'RESOURCE_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // Retrieve detailed prediction with explanation data
    const fullPrediction = await Prediction.findOne({ transactionId: id })
      .populate('modelVersionId')
      .sort({ createdAt: -1 })
      .lean();

    if (fullPrediction) {
      fullPrediction.id = fullPrediction._id.toString();
      if (fullPrediction.fraudProbability) {
        fullPrediction.fraudProbability = parseFloat(fullPrediction.fraudProbability.toString());
      }
      transaction.detailedPrediction = fullPrediction;
    }

    return transaction;
  }

  /**
   * Lists transactions with multi-field filtering and pagination
   */
  async listTransactions(query) {
    const { page = 1, limit = 25, customerId, merchantCategory, currency, channel, search, minAmount, maxAmount, startDate, endDate } = query;

    const where = {};
    if (customerId) where.customerId = customerId;
    if (merchantCategory) where.merchantCategory = merchantCategory;
    if (currency) where.currency = currency;
    if (channel) where.channel = channel;
    if (search) where.search = search;
    if (minAmount !== undefined) where.minAmount = minAmount;
    if (maxAmount !== undefined) where.maxAmount = maxAmount;
    if (startDate) where.startDate = startDate;
    if (endDate) where.endDate = endDate;

    const skip = (page - 1) * limit;

    const [transactions, totalRecords] = await Promise.all([
      transactionRepository.findMany({ skip, take: limit, where }),
      transactionRepository.count(where),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages,
      },
    };
  }
}

export const transactionService = new TransactionService();
