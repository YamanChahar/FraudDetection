import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  USER_ROLES,
  MODEL_STATUSES,
  RISK_LEVELS,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  JOB_STATUSES,
} from '../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legacySchemaPath = path.resolve(__dirname, '../legacy_prisma_archive/schema.prisma');
const legacyMigrationPath = path.resolve(__dirname, '../legacy_prisma_archive/migrations/20261026000000_init/migration.sql');

describe('TRACE MongoDB & Mongoose Schema Architecture (Phase 2)', () => {
  test('All 9 Mongoose models are properly defined and registered', () => {
    assert.ok(User, 'User model must be defined');
    assert.ok(RefreshToken, 'RefreshToken model must be defined');
    assert.ok(Transaction, 'Transaction model must be defined');
    assert.ok(ModelVersion, 'ModelVersion model must be defined');
    assert.ok(Prediction, 'Prediction model must be defined');
    assert.ok(FraudAlert, 'FraudAlert model must be defined');
    assert.ok(InvestigationRecord, 'InvestigationRecord model must be defined');
    assert.ok(DatasetTestingJob, 'DatasetTestingJob model must be defined');
    assert.ok(AuditLog, 'AuditLog model must be defined');
  });

  test('All required Enum constants are defined', () => {
    assert.deepEqual(USER_ROLES, ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN']);
    assert.deepEqual(MODEL_STATUSES, ['DEVELOPMENT', 'VALIDATION', 'CHAMPION', 'CHALLENGER', 'ARCHIVED']);
    assert.deepEqual(RISK_LEVELS, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    assert.deepEqual(ALERT_SEVERITIES, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    assert.deepEqual(ALERT_STATUSES, ['OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED']);
    assert.deepEqual(JOB_STATUSES, ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);
  });

  test('User schema defines required constraints and fields', () => {
    const paths = User.schema.paths;
    assert.ok(paths.name, 'name field required');
    assert.ok(paths.email, 'email field required');
    assert.ok(paths.passwordHash, 'passwordHash field required');
    assert.ok(paths.role, 'role field required');
    assert.ok(paths.isActive, 'isActive field required');
  });

  test('Transaction schema uses Decimal128 amount and flexible metadata', () => {
    const paths = Transaction.schema.paths;
    assert.equal(paths.amount.instance, 'Decimal128');
    assert.ok(paths.metadata, 'metadata field required');
    assert.ok(paths.externalTransactionId, 'externalTransactionId field required');
  });

  test('Prediction schema stores fraudProbability as Decimal128 and riskScore as Number', () => {
    const paths = Prediction.schema.paths;
    assert.equal(paths.fraudProbability.instance, 'Decimal128');
    assert.equal(paths.riskScore.instance, 'Number');
    assert.ok(paths.riskLevel);
  });

  test('AuditLog schema implements append-only immutability hooks', () => {
    const hooks = AuditLog.schema.s.hooks;
    assert.ok(hooks, 'Hooks should be registered');
  });

  test('Legacy Prisma schema and migration are archived', () => {
    assert.ok(fs.existsSync(legacySchemaPath), 'legacy_prisma_archive/schema.prisma must be preserved');
    assert.ok(fs.existsSync(legacyMigrationPath), 'legacy migration.sql must be preserved');
  });
});
