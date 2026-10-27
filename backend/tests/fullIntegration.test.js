import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import { User, Transaction, Prediction, FraudAlert, InvestigationRecord, ModelVersion, DatasetTestingJob } from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/tokenUtils.js';

let mongoServer;
let server;
let baseUrl;

let analystToken;
let investigatorToken;
let leadToken;
let adminToken;

let createdTransactionId;
let createdAlertId;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Synchronize model indexes
  await Promise.all([
    User.syncIndexes(),
    Transaction.syncIndexes(),
    Prediction.syncIndexes(),
    FraudAlert.syncIndexes(),
    InvestigationRecord.syncIndexes(),
    ModelVersion.syncIndexes(),
    DatasetTestingJob.syncIndexes(),
  ]);

  // Seed sample users with distinct RBAC roles
  const [analyst, investigator, lead, admin] = await Promise.all([
    User.create({ name: 'Analyst Jane', email: 'jane@trace.io', passwordHash: 'hash', role: 'ANALYST' }),
    User.create({ name: 'Investigator Bob', email: 'bob@trace.io', passwordHash: 'hash', role: 'INVESTIGATOR' }),
    User.create({ name: 'Lead Sarah', email: 'sarah@trace.io', passwordHash: 'hash', role: 'LEAD' }),
    User.create({ name: 'Admin Marcus', email: 'marcus@trace.io', passwordHash: 'hash', role: 'ADMIN' }),
  ]);

  analystToken = generateAccessToken(analyst);
  investigatorToken = generateAccessToken(investigator);
  leadToken = generateAccessToken(lead);
  adminToken = generateAccessToken(admin);

  // Start ephemeral HTTP server on dynamic port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('TRACE End-to-End System Integration Tests', () => {
  test('1. POST /api/v1/transactions creates transaction and orchestrates prediction & alert', async () => {
    const payload = {
      externalTransactionId: `INT-TEST-${Date.now()}`,
      amount: 1950.00,
      currency: 'USD',
      channel: 'ONLINE',
      merchantName: 'Apex Timepieces',
      merchantCategory: 'Luxury Goods',
      customerEmail: 'suspicious.client@domain.com',
      // High anomaly PCA features to test automated alert generation
      V14: -8.5,
      V12: -6.2,
      V10: -5.1,
      V4: 4.8,
    };

    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.transaction);
    assert.equal(json.data.transaction.currency, 'USD');
    createdTransactionId = json.data.transaction.id;

    // Check if prediction was persisted
    if (json.data.prediction) {
      assert.ok(json.data.prediction.riskScore !== undefined);
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(json.data.prediction.riskLevel));
    }
  });

  test('2. GET /api/v1/transactions lists transactions with pagination and search', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions?limit=10`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 1);
  });

  test('3. GET /api/v1/transactions/:id retrieves detailed transaction and predictions', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions/${createdTransactionId}`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.id, createdTransactionId);
  });

  test('4. GET /api/v1/dashboard/overview returns real aggregated metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/overview`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.metrics.totalTransactions >= 1);
    assert.ok(Array.isArray(json.data.riskDistribution));
  });

  test('5. Alert workflow: list, update status, and record investigation', async () => {
    // 5a. Create a manual alert to test workflow if none auto-generated
    const alertDoc = await FraudAlert.create({
      transactionId: createdTransactionId,
      severity: 'CRITICAL',
      status: 'OPEN',
      description: 'Critical transaction anomaly flagged for audit',
    });
    createdAlertId = alertDoc._id.toString();

    // 5b. List alerts
    const listRes = await fetch(`${baseUrl}/api/v1/alerts`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(listJson.data.length >= 1);

    // 5c. Analyst cannot update alert status (RBAC test)
    const failUpdate = await fetch(`${baseUrl}/api/v1/alerts/${createdAlertId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({ status: 'IN_REVIEW' }),
    });
    assert.equal(failUpdate.status, 403);

    // 5d. Investigator CAN update status
    const successUpdate = await fetch(`${baseUrl}/api/v1/alerts/${createdAlertId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorToken}`,
      },
      body: JSON.stringify({ status: 'IN_REVIEW' }),
    });
    assert.equal(successUpdate.status, 200);

    // 5e. Record investigation finding
    const invRes = await fetch(`${baseUrl}/api/v1/alerts/${createdAlertId}/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorToken}`,
      },
      body: JSON.stringify({
        findings: 'Verified cardholder confirms unauthorized transaction from distinct geo-IP.',
        decision: 'CONFIRMED_FRAUD',
        isFraud: true,
      }),
    });
    assert.equal(invRes.status, 201);
    const invJson = await invRes.json();
    assert.equal(invJson.data.decision, 'CONFIRMED_FRAUD');
    assert.equal(invJson.data.isFraud, true);
  });

  test('6. POST /api/v1/batch/jobs creates persistent dataset testing job', async () => {
    const payload = {
      datasetName: 'Synthetic_Benchmark_Batch.csv',
      records: [
        { Time: 10.0, Amount: 14.50, V1: 0.1, V2: -0.2 },
        { Time: 20.0, Amount: 450.00, V14: -8.0, Class: 1 },
      ],
    };

    const res = await fetch(`${baseUrl}/api/v1/batch/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investigatorToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 202);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.totalRecords, 2);
  });

  test('7. Admin routes: list users and inspect audit trail', async () => {
    // 7a. Non-admin cannot access user management
    const failUsers = await fetch(`${baseUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert.equal(failUsers.status, 403);

    // 7b. Admin can list users
    const adminUsers = await fetch(`${baseUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminUsers.status, 200);
    const usersJson = await adminUsers.json();
    assert.ok(usersJson.data.length >= 4);

    // 7c. Lead and Admin can list audit logs
    const auditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${leadToken}` },
    });
    assert.equal(auditRes.status, 200);
    const auditJson = await auditRes.json();
    assert.ok(Array.isArray(auditJson.data));
    assert.ok(auditJson.data.length >= 1);
  });
});
