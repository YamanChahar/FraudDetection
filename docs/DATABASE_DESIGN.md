# TRACE — Database Design & Data Modeling Specification

**Document Version:** 2.0.0 (Migrated to MongoDB)  
**Phase:** Phase 2 — Database Engineering & Migration  
**Status:** Approved & Implemented  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  
**Active Primary Database:** MongoDB Community Server 7.0+ / MongoDB Atlas  
**ODM / Data Access Layer:** Mongoose 8.x for Node.js  
**Legacy Architecture:** PostgreSQL 15+ & Prisma ORM (Archived in `backend/legacy_prisma_archive/`)

---

> [!IMPORTANT]
> **Database Architecture Migration Notice:**
> The primary database persistence architecture of TRACE was migrated from PostgreSQL + Prisma to MongoDB + Mongoose.
> - **Collections:** 9 MongoDB collections with document-based data modeling.
> - **Identifier Standard:** 24-character hexadecimal `ObjectId` identifiers.
> - **Monetary Representation:** Native `Decimal128` types to prevent floating-point precision loss.
> - **Historical Preservation:** Legacy Prisma schema and initial SQL migration are preserved in `backend/legacy_prisma_archive/`.

---

## 1. MongoDB Document-Oriented Architecture Principles

TRACE utilizes MongoDB for high-throughput fraud analytics, flexible schema ingestion, and document modeling:
1. **Document-Based Data Modeling:** Transactions ingest diverse dataset formats (e.g. credit card transactions, IEEE-CIS, custom bank feeds) using a flexible `metadata` field while strictly enforcing core financial columns (`amount`, `currency`, `transactionTimestamp`).
2. **Referencing vs Embedding:**
   - **Referenced Entities (ObjectId):** `User`, `Transaction`, `ModelVersion`, `Prediction`, `FraudAlert`, and `InvestigationRecord` maintain independent document identity via `ObjectId` references to support long-term auditing, separate lifecycles, and historical provenance.
   - **Embedded Entities (Subdocuments):** Merchant details (`merchant.id`, `merchant.name`, `merchant.category`), customer references (`customer.id`, `customer.email`), and location points are embedded directly within the Transaction document for single-query latency.
3. **Financial Precision:** `amount` and `lossAmount` are stored as `Decimal128` to maintain financial rounding integrity without IEEE 754 floating-point inaccuracies.
4. **Append-Only Immutability:** AuditLog records are protected at the schema level using Mongoose pre-hooks (`updateOne`, `deleteMany`, etc.) preventing runtime modification or deletion.
5. **Multi-Document Transaction Boundary:** Multi-document transactions are reserved for replica-set deployments; standalone local development uses single-document atomic operations and resilient application-level checks.

---

## 2. Active MongoDB Collections & Schema Definitions

### 2.1 Summary of Collections

| Collection | Model Name | Primary Key | Key References | Index Strategy |
|---|---|---|---|---|
| `users` | `User` | `_id` (`ObjectId`) | Self | Unique `email`, compound `[role, isActive]` |
| `refresh_tokens` | `RefreshToken` | `_id` (`ObjectId`) | `userId` $\rightarrow$ `User` | Unique `tokenHash`, compound `[userId, expiresAt]` |
| `transactions` | `Transaction` | `_id` (`ObjectId`) | Self | Unique sparse `externalTransactionId`, `[transactionTimestamp, amount]` |
| `model_versions` | `ModelVersion` | `_id` (`ObjectId`) | Self | Unique compound `[name, version]`, `status`, `isActive` |
| `predictions` | `Prediction` | `_id` (`ObjectId`) | `transactionId`, `modelVersionId` | `transactionId`, `modelVersionId`, `riskLevel`, `createdAt` |
| `fraud_alerts` | `FraudAlert` | `_id` (`ObjectId`) | `transactionId`, `predictionId`, `assignedToId` | `status`, `severity`, `assignedToId`, `transactionId`, `createdAt` |
| `investigation_records` | `InvestigationRecord` | `_id` (`ObjectId`) | `alertId`, `investigatorId` | `alertId`, `investigatorId`, `decision`, `createdAt` |
| `dataset_testing_jobs` | `DatasetTestingJob` | `_id` (`ObjectId`) | `createdById` $\rightarrow$ `User` | `status`, `createdById`, `createdAt` |
| `audit_logs` | `AuditLog` | `_id` (`ObjectId`) | `actorId` $\rightarrow$ `User` | `actorId`, `[entityType, entityId]`, `createdAt` |

---

## 3. Legacy Relational Architecture (Historical PostgreSQL / Prisma)

```mermaid
erDiagram
    User ||--o{ Transaction : "ingests / simulates"
    User ||--o{ FraudAlert : "assigned_to"
    User ||--o{ InvestigationRecord : "investigates"
    User ||--o{ DatasetTestingJob : "submits"
    User ||--o{ AuditLog : "triggers"
    User ||--o{ RefreshToken : "owns"

    Transaction ||--one-to-one|| Prediction : "evaluates to"
    Transaction ||--o{ FraudAlert : "triggers"

    ModelVersion ||--o{ Prediction : "generates"

    FraudAlert ||--o{ InvestigationRecord : "contains history"

    User {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string hashed_token
        timestamp expires_at
        timestamp created_at
    }

    Transaction {
        uuid id PK
        string external_transaction_id UK
        uuid user_id FK
        decimal amount
        string currency
        timestamp timestamp
        string merchant_id
        string merchant_category
        string customer_id
        string channel
        string card_fingerprint
        string ip_address
        string location
        jsonb raw_features
        enum status
        timestamp created_at
    }

    ModelVersion {
        uuid id PK
        string model_name
        string algorithm
        string version_tag UK
        string artifact_path
        decimal threshold
        jsonb metrics_summary
        boolean is_active
        timestamp created_at
    }

    Prediction {
        uuid id PK
        uuid transaction_id FK,UK
        uuid model_version_id FK
        decimal fraud_probability
        integer risk_score
        enum risk_tier
        decimal decision_threshold
        boolean is_fraud_predicted
        enum recommendation
        jsonb shap_attributions
        integer latency_ms
        timestamp created_at
    }

    FraudAlert {
        uuid id PK
        uuid transaction_id FK
        uuid prediction_id FK
        enum severity
        enum status
        uuid assigned_to_user_id FK
        text trigger_reason
        text resolution_notes
        timestamp created_at
        timestamp updated_at
    }

    InvestigationRecord {
        uuid id PK
        uuid alert_id FK
        uuid investigator_id FK
        enum action
        enum previous_status
        enum new_status
        text notes
        timestamp created_at
    }

    DatasetTestingJob {
        uuid id PK
        uuid user_id FK
        string file_name
        integer file_size_bytes
        integer total_records
        integer processed_records
        integer fraud_detected_count
        enum status
        text error_message
        jsonb results_summary
        timestamp created_at
        timestamp completed_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        string ip_address
        jsonb details
        timestamp created_at
    }
```

---

## 3. Detailed Entity Specifications

### 3.1 Entity: `User`
Stores system operators, analysts, investigators, and administrators.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Unique identifier.
- **`email`** (`VARCHAR(255)`, UNIQUE, NOT NULL): Corporate login email.
- **`password_hash`** (`VARCHAR(255)`, NOT NULL): Argon2id password hash.
- **`first_name`** (`VARCHAR(100)`, NOT NULL): User's given name.
- **`last_name`** (`VARCHAR(100)`, NOT NULL): User's family name.
- **`role`** (`ENUM('ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN')`, NOT NULL, default: `'ANALYST'`): Role for RBAC.
- **`is_active`** (`BOOLEAN`, NOT NULL, default: `true`): Account status flag.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Record creation time.
- **`updated_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Last record modification.

### 3.2 Entity: `RefreshToken`
Enables secure long-lived user sessions with cryptographic revocation.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Token record ID.
- **`user_id`** (`UUID`, FK -> `User.id`, ON DELETE CASCADE, NOT NULL): Linked user.
- **`hashed_token`** (`VARCHAR(255)`, NOT NULL): SHA-256 hash of refresh token.
- **`expires_at`** (`TIMESTAMPTZ`, NOT NULL): Token expiry timestamp.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Issuance timestamp.

### 3.3 Entity: `Transaction`
Stores the canonical record of every transaction ingested or simulated in the system.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Internal system identifier.
- **`external_transaction_id`** (`VARCHAR(64)`, UNIQUE, NOT NULL): Idempotency key from external payment gateway or simulation session.
- **`user_id`** (`UUID`, FK -> `User.id`, ON DELETE SET NULL, NULLABLE): Operator who created or submitted the transaction (null for automated API ingestion).
- **`amount`** (`DECIMAL(12, 2)`, NOT NULL): Monetary transaction value.
- **`currency`** (`VARCHAR(3)`, NOT NULL, default: `'USD'`): ISO 4217 currency code.
- **`timestamp`** (`TIMESTAMPTZ`, NOT NULL): Original transaction occurrence time.
- **`merchant_id`** (`VARCHAR(64)`, NOT NULL): Merchant or payee identifier.
- **`merchant_category`** (`VARCHAR(64)`, NOT NULL): MCC code or category (e.g. `'grocery'`, `'electronics'`, `'crypto_exchange'`).
- **`customer_id`** (`VARCHAR(64)`, NOT NULL): Unique identifier of the paying customer.
- **`channel`** (`VARCHAR(32)`, NOT NULL, default: `'ONLINE_CNP'`): Channel (e.g., `'ONLINE_CNP'`, `'POS_CHIP'`, `'ATM'`).
- **`card_fingerprint`** (`VARCHAR(64)`, NULLABLE): One-way cryptographic hash of card number for velocity tracking without storing PAN.
- **`ip_address`** (`INET`, NULLABLE): Client IP address for geolocation analysis.
- **`location`** (`VARCHAR(100)`, NULLABLE): City/Country or ISO region.
- **`raw_features`** (`JSONB`, NOT NULL, default: `'{}'`): Complete feature dictionary used for ML input (PCA components `V1-V28`, velocity features, etc.).
- **`status`** (`ENUM('APPROVED', 'FLAGGED', 'REJECTED', 'UNDER_REVIEW')`, NOT NULL, default: `'APPROVED'`): Operational status.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Timestamp of ingestion.

### 3.4 Entity: `ModelVersion`
Maintains strict governance, provenance, and auditability of all ML models deployed into TRACE.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Model version ID.
- **`model_name`** (`VARCHAR(100)`, NOT NULL): Human-readable model title (e.g., `'Random Forest Fraud Champion'`).
- **`algorithm`** (`VARCHAR(64)`, NOT NULL): Algorithm family (e.g., `'RandomForestClassifier'`, `'XGBClassifier'`).
- **`version_tag`** (`VARCHAR(32)`, UNIQUE, NOT NULL): Semantic version identifier (e.g., `'v1.0.0-rf'`).
- **`artifact_path`** (`VARCHAR(255)`, NOT NULL): Filesystem or bucket path to serialized model binary.
- **`threshold`** (`DECIMAL(5, 4)`, NOT NULL, default: `0.5000`): Calibrated decision threshold.
- **`metrics_summary`** (`JSONB`, NOT NULL): Frozen evaluation metrics (PR-AUC, ROC-AUC, Recall, Precision, Confusion Matrix).
- **`is_active`** (`BOOLEAN`, NOT NULL, default: `false`): Flag indicating if this model is active for live inference.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Deployment registration date.

### 3.5 Entity: `Prediction`
Stores the deterministic output of the ML inference service for every evaluated transaction.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Prediction ID.
- **`transaction_id`** (`UUID`, FK -> `Transaction.id`, UNIQUE, ON DELETE CASCADE, NOT NULL): 1-to-1 link to transaction.
- **`model_version_id`** (`UUID`, FK -> `ModelVersion.id`, ON DELETE RESTRICT, NOT NULL): Specific model version that generated inference.
- **`fraud_probability`** (`DECIMAL(6, 5)`, NOT NULL): Raw continuous model output in range `[0.00000, 1.00000]`.
- **`risk_score`** (`INTEGER`, NOT NULL): Calibrated integer score in range `[0, 100]`.
- **`risk_tier`** (`ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`, NOT NULL): Tier derived from calibrated score.
- **`decision_threshold`** (`DECIMAL(5, 4)`, NOT NULL): Threshold in effect at time of prediction.
- **`is_fraud_predicted`** (`BOOLEAN`, NOT NULL): Binary classification based on threshold.
- **`recommendation`** (`ENUM('APPROVE', 'REVIEW', 'DECLINE')`, NOT NULL): Automated operational advice.
- **`shap_attributions`** (`JSONB`, NOT NULL, default: `'{}'`): Local SHAP explanation values (top positive and negative drivers).
- **`latency_ms`** (`INTEGER`, NOT NULL): Execution duration in milliseconds for the ML inference call.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Timestamp of prediction.

### 3.6 Entity: `FraudAlert`
Generated when a transaction exceeds the risk threshold or violates high-severity risk policies.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Alert ID.
- **`transaction_id`** (`UUID`, FK -> `Transaction.id`, ON DELETE CASCADE, NOT NULL): Transaction triggering alert.
- **`prediction_id`** (`UUID`, FK -> `Prediction.id`, ON DELETE CASCADE, NOT NULL): Linked prediction record.
- **`severity`** (`ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`, NOT NULL): Alert priority.
- **`status`** (`ENUM('PENDING_REVIEW', 'UNDER_INVESTIGATION', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'DISMISSED')`, NOT NULL, default: `'PENDING_REVIEW'`): Triage state.
- **`assigned_to_user_id`** (`UUID`, FK -> `User.id`, ON DELETE SET NULL, NULLABLE): Assigned investigator.
- **`trigger_reason`** (`TEXT`, NOT NULL): Human-readable trigger explanation (e.g., `'Risk score 92 exceeded critical threshold 85; abnormal velocity'`).
- **`resolution_notes`** (`TEXT`, NULLABLE): Summary of investigation outcome.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Alert creation time.
- **`updated_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Last status update time.

### 3.7 Entity: `InvestigationRecord`
Immutable ledger tracking every action, note, and status change performed on a FraudAlert.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Record ID.
- **`alert_id`** (`UUID`, FK -> `FraudAlert.id`, ON DELETE CASCADE, NOT NULL): Associated alert.
- **`investigator_id`** (`UUID`, FK -> `User.id`, ON DELETE RESTRICT, NOT NULL): User who performed the action.
- **`action`** (`ENUM('STATUS_CHANGE', 'NOTE_ADDED', 'REASSIGNED', 'ESCALATED')`, NOT NULL): Action type.
- **`previous_status`** (`VARCHAR(32)`, NULLABLE): Status prior to transition.
- **`new_status`** (`VARCHAR(32)`, NULLABLE): Status following transition.
- **`notes`** (`TEXT`, NOT NULL): Detailed investigator commentary.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Timestamp of audit event.

### 3.8 Entity: `DatasetTestingJob`
Tracks asynchronous portfolio batch evaluation jobs.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Job identifier.
- **`user_id`** (`UUID`, FK -> `User.id`, ON DELETE RESTRICT, NOT NULL): User who initiated batch test.
- **`file_name`** (`VARCHAR(255)`, NOT NULL): Uploaded file name.
- **`file_size_bytes`** (`INTEGER`, NOT NULL): File size in bytes.
- **`total_records`** (`INTEGER`, NOT NULL, default: 0): Total transactions detected in file.
- **`processed_records`** (`INTEGER`, NOT NULL, default: 0): Progress counter.
- **`fraud_detected_count`** (`INTEGER`, NOT NULL, default: 0): Total transactions flagged as high risk.
- **`status`** (`ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')`, NOT NULL, default: `'QUEUED'`): Execution status.
- **`error_message`** (`TEXT`, NULLABLE): Diagnostic message if job failed.
- **`results_summary`** (`JSONB`, NOT NULL, default: `'{}'`): Aggregate metrics (mean risk score, tier counts, estimated exposure).
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Submission time.
- **`completed_at`** (`TIMESTAMPTZ`, NULLABLE): Completion timestamp.

### 3.9 Entity: `AuditLog`
High-security system audit log recording all administrative, configuration, and security events.
- **`id`** (`UUID`, PK, default: `gen_random_uuid()`): Log record ID.
- **`user_id`** (`UUID`, FK -> `User.id`, ON DELETE SET NULL, NULLABLE): Actor user ID (null for system jobs).
- **`action`** (`VARCHAR(64)`, NOT NULL): Action identifier (e.g., `'USER_LOGIN'`, `'THRESHOLD_UPDATE'`, `'BATCH_UPLOAD'`).
- **`entity_type`** (`VARCHAR(64)`, NOT NULL): Affected entity (e.g., `'FraudAlert'`, `'ModelVersion'`).
- **`entity_id`** (`VARCHAR(64)`, NULLABLE): Primary key of affected entity.
- **`ip_address`** (`INET`, NULLABLE): Originating client IP.
- **`details`** (`JSONB`, NOT NULL, default: `'{}'`): Metadata payload before/after diff.
- **`created_at`** (`TIMESTAMPTZ`, NOT NULL, default: `NOW()`): Immutable timestamp.

---

## 4. Indexing Strategy & Query Optimization

| Table | Index Name | Type | Indexed Columns | Justification / Target Query |
| :--- | :--- | :--- | :--- | :--- |
| `Transaction` | `idx_transactions_timestamp` | B-tree | `timestamp DESC` | Ledger ordering, time-series aggregation. |
| `Transaction` | `idx_transactions_customer_time` | Composite B-tree | `customer_id, timestamp DESC` | Velocity checks: customer transaction history lookup. |
| `Transaction` | `idx_transactions_status` | B-tree | `status` | Filter ledger by operational state. |
| `Transaction` | `idx_transactions_ext_id` | B-tree | `external_transaction_id` | Fast idempotency lookup during ingestion. |
| `Prediction` | `idx_predictions_risk_score` | B-tree | `risk_score DESC` | High-risk transaction discovery and filtering. |
| `Prediction` | `idx_predictions_tier` | B-tree | `risk_tier` | Aggregating portfolio risk distribution. |
| `FraudAlert` | `idx_alerts_status_created` | Composite B-tree | `status, created_at DESC` | Primary investigator triage queue query. |
| `FraudAlert` | `idx_alerts_assigned_status` | Composite B-tree | `assigned_to_user_id, status` | "My Assigned Alerts" dashboard view. |
| `DatasetTestingJob` | `idx_jobs_user_created` | Composite B-tree | `user_id, created_at DESC` | User's batch history list. |
| `AuditLog` | `idx_audit_created` | B-tree | `created_at DESC` | Compliance audit trail chronological queries. |

---

## 5. Rationale & Anti-Bloat Justification

Every table in this schema serves a distinct, indispensable operational or legal purpose:
- **No Entity Bloat:** We do not create separate tables for minor attributes (e.g., addresses, phone numbers, or merchant profiles) when they can be cleanly stored in canonical columns or `raw_features` JSONB.
- **Explicit Separation of `Transaction` and `Prediction`:** Decoupling transactions from predictions allows re-evaluating historical transactions against newer model versions without mutating original transaction records.
- **Dedicated `InvestigationRecord` Table:** Regulatory compliance (e.g., FINRA, GDPR, OCC) requires that decisions altering fraud classifications must be accompanied by an immutable audit trail showing who changed the status, when, and why.
- **`ModelVersion` Governance:** Prevents ambiguity about which exact model weights and threshold produced a given customer rejection or alert.

---

## 6. Prisma Schema Implementation Blueprint

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ANALYST
  INVESTIGATOR
  LEAD
  ADMIN
}

enum TransactionStatus {
  APPROVED
  FLAGGED
  REJECTED
  UNDER_REVIEW
}

enum RiskTier {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Recommendation {
  APPROVE
  REVIEW
  DECLINE
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AlertStatus {
  PENDING_REVIEW
  UNDER_INVESTIGATION
  CONFIRMED_FRAUD
  FALSE_POSITIVE
  DISMISSED
}

enum InvestigationAction {
  STATUS_CHANGE
  NOTE_ADDED
  REASSIGNED
  ESCALATED
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

model User {
  id                   String                @id @default(uuid()) @db.Uuid
  email                String                @unique @db.VarChar(255)
  passwordHash         String                @map("password_hash") @db.VarChar(255)
  firstName            String                @map("first_name") @db.VarChar(100)
  lastName             String                @map("last_name") @db.VarChar(100)
  role                 Role                  @default(ANALYST)
  isActive             Boolean               @default(true) @map("is_active")
  createdAt            DateTime              @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime              @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  transactions         Transaction[]
  refreshTokens        RefreshToken[]
  assignedAlerts       FraudAlert[]          @relation("AssignedAlerts")
  investigations       InvestigationRecord[]
  datasetJobs          DatasetTestingJob[]
  auditLogs            AuditLog[]

  @@map("users")
}

model RefreshToken {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  hashedToken String   @map("hashed_token") @db.VarChar(255)
  expiresAt   DateTime @map("expires_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model Transaction {
  id                    String            @id @default(uuid()) @db.Uuid
  externalTransactionId String            @unique @map("external_transaction_id") @db.VarChar(64)
  userId                String?           @map("user_id") @db.Uuid
  amount                Decimal           @db.Decimal(12, 2)
  currency              String            @default("USD") @db.VarChar(3)
  timestamp             DateTime          @db.Timestamptz
  merchantId            String            @map("merchant_id") @db.VarChar(64)
  merchantCategory      String            @map("merchant_category") @db.VarChar(64)
  customerId            String            @map("customer_id") @db.VarChar(64)
  channel               String            @default("ONLINE_CNP") @db.VarChar(32)
  cardFingerprint       String?           @map("card_fingerprint") @db.VarChar(64)
  ipAddress             String?           @map("ip_address") @db.VarChar(45)
  location              String?           @db.VarChar(100)
  rawFeatures           Json              @default("{}") @map("raw_features")
  status                TransactionStatus @default(APPROVED)
  createdAt             DateTime          @default(now()) @map("created_at") @db.Timestamptz

  user                  User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  prediction            Prediction?
  alerts                FraudAlert[]

  @@index([timestamp(sort: Desc)])
  @@index([customerId, timestamp(sort: Desc)])
  @@index([status])
  @@map("transactions")
}

model ModelVersion {
  id             String       @id @default(uuid()) @db.Uuid
  modelName      String       @map("model_name") @db.VarChar(100)
  algorithm      String       @db.VarChar(64)
  versionTag     String       @unique @map("version_tag") @db.VarChar(32)
  artifactPath   String       @map("artifact_path") @db.VarChar(255)
  threshold      Decimal      @default(0.5000) @db.Decimal(5, 4)
  metricsSummary Json         @map("metrics_summary")
  isActive       Boolean      @default(false) @map("is_active")
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz

  predictions    Prediction[]

  @@map("model_versions")
}

model Prediction {
  id                String         @id @default(uuid()) @db.Uuid
  transactionId     String         @unique @map("transaction_id") @db.Uuid
  modelVersionId    String         @map("model_version_id") @db.Uuid
  fraudProbability  Decimal        @map("fraud_probability") @db.Decimal(6, 5)
  riskScore         Int            @map("risk_score")
  riskTier          RiskTier       @map("risk_tier")
  decisionThreshold Decimal        @map("decision_threshold") @db.Decimal(5, 4)
  isFraudPredicted  Boolean        @map("is_fraud_predicted")
  recommendation    Recommendation
  shapAttributions  Json           @default("{}") @map("shap_attributions")
  latencyMs         Int            @map("latency_ms")
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz

  transaction       Transaction    @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  modelVersion      ModelVersion   @relation(fields: [modelVersionId], references: [id], onDelete: Restrict)
  alerts            FraudAlert[]

  @@index([riskScore(sort: Desc)])
  @@index([riskTier])
  @@map("predictions")
}

model FraudAlert {
  id               String          @id @default(uuid()) @db.Uuid
  transactionId    String          @map("transaction_id") @db.Uuid
  predictionId     String          @map("prediction_id") @db.Uuid
  severity         AlertSeverity
  status           AlertStatus     @default(PENDING_REVIEW)
  assignedToUserId String?         @map("assigned_to_user_id") @db.Uuid
  triggerReason    String          @map("trigger_reason") @db.Text
  resolutionNotes  String?         @map("resolution_notes") @db.Text
  createdAt        DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime        @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  transaction      Transaction     @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  prediction       Prediction      @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  assignedTo       User?           @relation("AssignedAlerts", fields: [assignedToUserId], references: [id], onDelete: SetNull)
  investigations   InvestigationRecord[]

  @@index([status, createdAt(sort: Desc)])
  @@index([assignedToUserId, status])
  @@map("fraud_alerts")
}

model InvestigationRecord {
  id             String              @id @default(uuid()) @db.Uuid
  alertId        String              @map("alert_id") @db.Uuid
  investigatorId String              @map("investigator_id") @db.Uuid
  action         InvestigationAction
  previousStatus String?             @map("previous_status") @db.VarChar(32)
  newStatus      String?             @map("new_status") @db.VarChar(32)
  notes          String              @db.Text
  createdAt      DateTime            @default(now()) @map("created_at") @db.Timestamptz

  alert          FraudAlert          @relation(fields: [alertId], references: [id], onDelete: Cascade)
  investigator   User                @relation(fields: [investigatorId], references: [id], onDelete: Restrict)

  @@index([alertId, createdAt(sort: Desc)])
  @@map("investigation_records")
}

model DatasetTestingJob {
  id                 String    @id @default(uuid()) @db.Uuid
  userId             String    @map("user_id") @db.Uuid
  fileName           String    @map("file_name") @db.VarChar(255)
  fileSizeBytes      Int       @map("file_size_bytes")
  totalRecords       Int       @default(0) @map("total_records")
  processedRecords   Int       @default(0) @map("processed_records")
  fraudDetectedCount Int       @default(0) @map("fraud_detected_count")
  status             JobStatus @default(QUEUED)
  errorMessage       String?   @map("error_message") @db.Text
  resultsSummary     Json      @default("{}") @map("results_summary")
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz
  completedAt        DateTime? @map("completed_at") @db.Timestamptz

  user               User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, createdAt(sort: Desc)])
  @@map("dataset_testing_jobs")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  action     String   @db.VarChar(64)
  entityType String   @map("entity_type") @db.VarChar(64)
  entityId   String?  @map("entity_id") @db.VarChar(64)
  ipAddress  String?  @map("ip_address") @db.VarChar(45)
  details    Json     @default("{}")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}
```
