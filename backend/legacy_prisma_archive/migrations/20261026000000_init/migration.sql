-- TRACE Initial PostgreSQL Migration (Phase 2)
-- Generated via Prisma Migrate Diff

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DEVELOPMENT', 'VALIDATION', 'CHAMPION', 'CHALLENGER', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANALYST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "external_transaction_id" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "transaction_timestamp" TIMESTAMPTZ NOT NULL,
    "merchant_id" VARCHAR(64),
    "merchant_name" VARCHAR(150),
    "merchant_category" VARCHAR(64),
    "customer_id" VARCHAR(64),
    "channel" VARCHAR(32),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_versions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "algorithm" VARCHAR(64) NOT NULL,
    "status" "ModelStatus" NOT NULL DEFAULT 'DEVELOPMENT',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "artifact_reference" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "model_version_id" UUID NOT NULL,
    "fraud_probability" DECIMAL(6,5) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "prediction_status" VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    "explanation_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "prediction_id" UUID,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to_id" UUID,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_records" (
    "id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "investigator_id" UUID NOT NULL,
    "investigation_status" VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    "findings" TEXT NOT NULL,
    "resolution" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_testing_jobs" (
    "id" UUID NOT NULL,
    "dataset_name" VARCHAR(255) NOT NULL,
    "dataset_format" VARCHAR(32) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "processed_records" INTEGER NOT NULL DEFAULT 0,
    "failed_records" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL DEFAULT '{}',
    "error_details" TEXT,
    "created_by_id" UUID,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_testing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_revoked_at_idx" ON "refresh_tokens"("expires_at", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_external_transaction_id_key" ON "transactions"("external_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_timestamp_idx" ON "transactions"("transaction_timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_external_transaction_id_idx" ON "transactions"("external_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_customer_id_transaction_timestamp_idx" ON "transactions"("customer_id", "transaction_timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_merchant_category_idx" ON "transactions"("merchant_category");

-- CreateIndex
CREATE INDEX "transactions_amount_idx" ON "transactions"("amount");

-- CreateIndex
CREATE UNIQUE INDEX "model_versions_version_key" ON "model_versions"("version");

-- CreateIndex
CREATE INDEX "model_versions_status_idx" ON "model_versions"("status");

-- CreateIndex
CREATE INDEX "model_versions_version_idx" ON "model_versions"("version");

-- CreateIndex
CREATE INDEX "predictions_transaction_id_idx" ON "predictions"("transaction_id");

-- CreateIndex
CREATE INDEX "predictions_model_version_id_idx" ON "predictions"("model_version_id");

-- CreateIndex
CREATE INDEX "predictions_risk_score_idx" ON "predictions"("risk_score" DESC);

-- CreateIndex
CREATE INDEX "predictions_risk_level_idx" ON "predictions"("risk_level");

-- CreateIndex
CREATE INDEX "fraud_alerts_status_created_at_idx" ON "fraud_alerts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "fraud_alerts_severity_idx" ON "fraud_alerts"("severity");

-- CreateIndex
CREATE INDEX "fraud_alerts_assigned_to_id_status_idx" ON "fraud_alerts"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "investigation_records_alert_id_created_at_idx" ON "investigation_records"("alert_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "investigation_records_investigator_id_idx" ON "investigation_records"("investigator_id");

-- CreateIndex
CREATE INDEX "dataset_testing_jobs_status_created_at_idx" ON "dataset_testing_jobs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "dataset_testing_jobs_created_by_id_idx" ON "dataset_testing_jobs"("created_by_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_model_version_id_fkey" FOREIGN KEY ("model_version_id") REFERENCES "model_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_records" ADD CONSTRAINT "investigation_records_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "fraud_alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_records" ADD CONSTRAINT "investigation_records_investigator_id_fkey" FOREIGN KEY ("investigator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_testing_jobs" ADD CONSTRAINT "dataset_testing_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
