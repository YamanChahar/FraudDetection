import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  User,
  RefreshToken,
  Transaction,
  ModelVersion,
  Prediction,
  FraudAlert,
  InvestigationRecord,
  DatasetTestingJob,
  AuditLog,
} from '../src/models/index.js';
import { transactionRepository } from '../src/repositories/transactionRepository.js';
import { modelRepository } from '../src/repositories/modelRepository.js';
import { auditRepository } from '../src/repositories/auditRepository.js';
import { checkDatabaseHealth } from '../src/config/database.js';

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Synchronize and build all indexes immediately for unique constraint testing
  await Promise.all([
    User.syncIndexes(),
    Transaction.syncIndexes(),
    ModelVersion.syncIndexes(),
    RefreshToken.syncIndexes(),
    Prediction.syncIndexes(),
    FraudAlert.syncIndexes(),
    InvestigationRecord.syncIndexes(),
    DatasetTestingJob.syncIndexes(),
    AuditLog.syncIndexes(),
  ]);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('TRACE MongoDB + Mongoose Integration Tests (Phase 2)', () => {
  test('1. MongoDB connection is active and healthy', async () => {
    assert.equal(mongoose.connection.readyState, 1);
    const health = await checkDatabaseHealth();
    assert.equal(health.status, 'UP');
    assert.equal(health.connected, true);
    assert.ok(typeof health.latencyMs === 'number');
  });

  test('2. User model validation & unique email constraint', async () => {
    // Valid user
    const user = await User.create({
      name: 'Alice Analyst',
      email: 'Alice.Analyst@trace.local',
      passwordHash: 'hash_alice_123',
      role: 'ANALYST',
    });
    assert.ok(user._id);
    assert.equal(user.email, 'alice.analyst@trace.local'); // Lowercased

    // Duplicate email rejected
    await assert.rejects(
      async () => {
        await User.create({
          name: 'Alice Impostor',
          email: 'alice.analyst@trace.local',
          passwordHash: 'hash_fake_456',
        });
      },
      (err) => err.code === 11000,
      'Duplicate email must trigger MongoDB E11000 duplicate key error'
    );
  });

  test('3. RefreshToken model references User with index', async () => {
    const user = await User.findOne({ email: 'alice.analyst@trace.local' });
    const token = await RefreshToken.create({
      userId: user._id,
      tokenHash: 'token_hash_abc_987',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    assert.ok(token._id);
    assert.equal(token.userId.toString(), user._id.toString());
  });

  test('4. Transaction model stores Decimal128 amount and supports metadata', async () => {
    const trxData = {
      externalTransactionId: 'TX_MONGO_001',
      amount: 1450.75,
      currency: 'USD',
      merchantId: 'MERCH_99',
      merchantName: 'Acme Electronics',
      merchantCategory: 'Electronics',
      customerId: 'CUST_442',
      channel: 'ONLINE',
      metadata: {
        v1: -0.4523,
        v2: 1.2845,
        velocity_24h: 3,
      },
    };

    const saved = await transactionRepository.create(trxData);
    assert.ok(saved.id);
    assert.equal(saved.externalTransactionId, 'TX_MONGO_001');
    assert.equal(saved.amount, 1450.75);
    assert.equal(saved.merchant.name, 'Acme Electronics');
    assert.equal(saved.metadata.velocity_24h, 3);

    // Retrieve by ID
    const retrieved = await transactionRepository.findById(saved.id);
    assert.equal(retrieved.id, saved.id);
    assert.equal(retrieved.amount, 1450.75);

    // Idempotency: Duplicate external ID rejected
    await assert.rejects(
      async () => {
        await transactionRepository.create(trxData);
      },
      (err) => err.code === 11000,
      'Duplicate externalTransactionId must be rejected'
    );
  });

  test('5. Transaction pagination and count', async () => {
    // Add two more transactions
    await transactionRepository.create({
      externalTransactionId: 'TX_MONGO_002',
      amount: 50.0,
      currency: 'USD',
    });
    await transactionRepository.create({
      externalTransactionId: 'TX_MONGO_003',
      amount: 75.25,
      currency: 'USD',
    });

    const page1 = await transactionRepository.findMany({ skip: 0, take: 2 });
    assert.equal(page1.length, 2);

    const totalCount = await transactionRepository.count({});
    assert.ok(totalCount >= 3);
  });

  test('6. ModelVersion creation, unique constraint and querying', async () => {
    const model = await modelRepository.create({
      name: 'XGBoost Fraud Classifier',
      version: 'v1.0.0-champion',
      algorithm: 'XGBOOST',
      status: 'CHAMPION',
      metrics: { prAuc: 0.884, rocAuc: 0.985, f1Score: 0.862 },
    });
    assert.ok(model.id);
    assert.equal(model.status, 'CHAMPION');

    const found = await modelRepository.findById(model.id);
    assert.equal(found.version, 'v1.0.0-champion');
    assert.equal(found._count.predictions, 0);

    // Duplicate version for same name rejected
    await assert.rejects(
      async () => {
        await modelRepository.create({
          name: 'XGBoost Fraud Classifier',
          version: 'v1.0.0-champion',
          algorithm: 'XGBOOST',
        });
      },
      (err) => err.code === 11000
    );
  });

  test('7. Prediction model separates fraudProbability and riskScore', async () => {
    const trx = await Transaction.findOne({ externalTransactionId: 'TX_MONGO_001' });
    const model = await ModelVersion.findOne({ version: 'v1.0.0-champion' });

    const prediction = await Prediction.create({
      transactionId: trx._id,
      modelVersionId: model._id,
      fraudProbability: mongoose.Types.Decimal128.fromString('0.91254'),
      riskScore: 91,
      riskLevel: 'CRITICAL',
      predictionLabel: 1,
      latencyMs: 12,
      explanationData: { topFeature: 'amount', contribution: 0.42 },
    });

    assert.ok(prediction._id);
    assert.equal(prediction.riskScore, 91);
    assert.equal(prediction.riskLevel, 'CRITICAL');
    assert.equal(parseFloat(prediction.fraudProbability.toString()), 0.91254);

    // Negative risk score rejected
    await assert.rejects(
      async () => {
        await Prediction.create({
          transactionId: trx._id,
          modelVersionId: model._id,
          fraudProbability: mongoose.Types.Decimal128.fromString('0.5'),
          riskScore: -10, // Invalid
          riskLevel: 'MEDIUM',
        });
      },
      (err) => err.name === 'ValidationError'
    );
  });

  test('8. FraudAlert and InvestigationRecord separation', async () => {
    const trx = await Transaction.findOne({ externalTransactionId: 'TX_MONGO_001' });
    const user = await User.findOne({ email: 'alice.analyst@trace.local' });
    const prediction = await Prediction.findOne({ transactionId: trx._id });

    // Create FraudAlert
    const alert = await FraudAlert.create({
      transactionId: trx._id,
      predictionId: prediction._id,
      severity: 'CRITICAL',
      status: 'OPEN',
      assignedToId: user._id,
      description: 'High velocity and unusual transaction amount detected',
    });
    assert.ok(alert._id);
    assert.equal(alert.severity, 'CRITICAL');

    // Create InvestigationRecord
    const investigation = await InvestigationRecord.create({
      alertId: alert._id,
      investigatorId: user._id,
      investigationStatus: 'COMPLETED',
      findings: 'Customer confirmed transaction was authorized; legitimate international travel purchase.',
      decision: 'FALSE_POSITIVE',
      isFraud: false,
    });
    assert.ok(investigation._id);
    assert.equal(investigation.decision, 'FALSE_POSITIVE');
    assert.equal(investigation.isFraud, false);

    // Verify Prediction remains unchanged (Model probability not overwritten by investigator outcome)
    const originalPrediction = await Prediction.findById(prediction._id);
    assert.equal(originalPrediction.riskScore, 91);
    assert.equal(originalPrediction.riskLevel, 'CRITICAL');
  });

  test('9. DatasetTestingJob persists batch progress metrics', async () => {
    const user = await User.findOne({ email: 'alice.analyst@trace.local' });
    const job = await DatasetTestingJob.create({
      datasetName: 'creditcard_2026_eval.csv',
      datasetFormat: 'CSV',
      status: 'PROCESSING',
      totalRecords: 10000,
      processedRecords: 3500,
      fraudCount: 42,
      createdById: user._id,
    });

    assert.ok(job._id);
    assert.equal(job.status, 'PROCESSING');
    assert.equal(job.totalRecords, 10000);
    assert.equal(job.processedRecords, 3500);
  });

  test('10. AuditLog creation & immutability enforcement', async () => {
    const log = await auditRepository.createLog({
      action: 'SYSTEM_SMOKE_TEST',
      entityType: 'Transaction',
      entityId: 'TX_MONGO_001',
      metadata: { testSuite: 'Phase 2 Mongoose Integration' },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'SYSTEM_SMOKE_TEST');

    // Test immutability: Updates are rejected by schema hook
    await assert.rejects(
      async () => {
        await AuditLog.updateOne({ _id: log.id }, { action: 'TAMPERED_ACTION' });
      },
      (err) => err.message.includes('append-only and cannot be modified')
    );

    // Test immutability: Deletes are rejected by schema hook
    await assert.rejects(
      async () => {
        await AuditLog.deleteOne({ _id: log.id });
      },
      (err) => err.message.includes('cannot be deleted')
    );
  });
});
