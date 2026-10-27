# TRACE — System Architecture Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  

---

## 1. High-Level Architecture Overview

TRACE is architected as a decoupled, multi-tier distributed system comprising four distinct tiers:
1. **Client Tier (Frontend):** High-density single-page application built with React.js, Vite, React Router, and Axios.
2. **Application Tier (Primary Backend):** Node.js + Express.js orchestrator handling identity, authorization, validation, transaction routing, persistence, and external reporting.
3. **Inference Tier (ML Service):** Dedicated Python + FastAPI microservice hosting scikit-learn, XGBoost, and SHAP explainability pipelines.
4. **Data Persistence Tier (Storage):** Document-based MongoDB database managed via Mongoose ODM for high-throughput fraud analytics, flexible dataset ingestion, and append-only audit trails. *(Migrated from legacy PostgreSQL/Prisma).*

```mermaid
graph TB
    subgraph Client Tier ["Client Tier (Browser)"]
        UI["React.js + Vite Application<br/>(Custom Vanilla CSS Financial Theme)"]
    end

    subgraph AppTier ["Application Tier (Node.js & Express)"]
        GW["Express API Gateway & Router<br/>(Port 4000)"]
        AuthM["Auth & RBAC Middleware<br/>(Planned Phase 3)"]
        ValM["Request Validator<br/>(Zod)"]
        Ctrl["Business Controllers<br/>(Transactions, Models, Health)"]
        Mongoose["Mongoose ODM Client"]
    end

    subgraph MLTier ["Inference Tier (Python FastAPI)"]
        FastAPI["FastAPI Microservice<br/>(Port 8000)"]
        Preproc["Preprocessing Pipeline<br/>(StandardScaler, OneHot, Imputer)"]
        Engine["Inference Engine<br/>(RandomForest / XGBoost)"]
        SHAP["Explainability Engine<br/>(TreeExplainer / Permutation)"]
    end

    subgraph DataTier ["Persistence Tier (MongoDB)"]
        Mongo[("MongoDB 7.0+<br/>(Users, Transactions, Predictions,<br/>Alerts, AuditLogs)")]
    end

    UI -->|"HTTPS / REST"| GW
    GW --> AuthM
    AuthM --> ValM
    ValM --> Ctrl
    Ctrl -->|"Internal HTTP / JSON<br/>(1500ms Timeout)"| FastAPI
    Ctrl --> Mongoose
    Mongoose -->|"MongoDB Wire Protocol"| Mongo
    FastAPI --> Preproc
    Preproc --> Engine
    Engine --> SHAP
```

---

## 2. Service Responsibilities & Boundaries

A strict separation of concerns prevents architectural drift between the Node.js application gateway and the Python inference service:

| Responsibility | Responsible Service | Implementation Details |
| :--- | :--- | :--- |
| **Client UI & State** | React Frontend | Client routing, optimistic UI, state machines, input masks, data visualization (charts, tables). |
| **Authentication & RBAC** | Node.js Backend | Password hashing (Argon2), JWT signing/verification, permission checks, session invalidation. |
| **Business Logic & Workflow** | Node.js Backend | Transaction creation, alert escalation rules, job dispatch, status state machines. |
| **Data Persistence** | Node.js Backend | Document models, queries, and transactions handled via Mongoose ODM (migrated from legacy PostgreSQL/Prisma). |
| **Batch Job Orchestration** | Node.js Backend | File parsing (CSV/JSON), chunked batch dispatching, progress tracking, and aggregation. |
| **Feature Transformation** | Python ML Service | Imputation, scaling, one-hot encoding, and feature alignment using frozen Scikit-Learn transformers. |
| **Mathematical Inference** | Python ML Service | Model probability calculation via Scikit-Learn / XGBoost estimators. |
| **Explainability (SHAP)** | Python ML Service | Local feature contribution calculation via TreeExplainer, top factor extraction. |
| **Relational Storage** | PostgreSQL | Multi-table joins, ACID guarantees, relational indexing, and immutable audit logging. |

> **Strict Rule:** The Python ML Service has **no direct database access**. It acts purely as a stateless, high-throughput computation engine. All database persistence is strictly orchestrated by Node.js.

---

## 3. Inter-Service Communication Contract

### 3.1 Network Topology & Protocol
- **Communication Protocol:** Private HTTP/1.1 REST over local network / internal Docker bridge.
- **Payload Format:** `application/json` with UTF-8 encoding.
- **Node-to-Python Endpoint:** `POST http://127.0.0.1:8000/internal/v1/predict` (configured via `ML_SERVICE_URL`).
- **Mutual Security:** Node.js injects a shared secret header `X-Internal-Service-Key: <SECRET_KEY>` validated by a FastAPI dependency to block unauthorized internal calls.

### 3.2 Resilience, Timeouts & Circuit Breaking
- **Timeout Budget:**
  - Single Transaction Inference: **1,500ms hard timeout** on Node.js Axios client.
  - Batch Chunk Inference (500 records): **10,000ms hard timeout**.
- **Retry Policy:** 1 immediate retry for network connection reset (`ECONNRESET`), zero retries for HTTP 4xx or 5xx application errors to prevent cascading failures.
- **Circuit Breaker:** If the Python ML service fails 5 consecutive health checks or times out repeatedly, the circuit trips open for 15 seconds, returning an immediate `503 Service Unavailable` with structured diagnostic payload to the client without queueing stalled requests.

---

## 4. Authentication, Authorization & Security Architecture

### 4.1 Token Lifecycle
- **Access Token:** Short-lived JWT (15-minute expiration) signed with HMAC-SHA256 (`JWT_SECRET`). Payload includes `userId`, `email`, `role`, and `tokenVersion`.
- **Refresh Token:** Long-lived cryptographically secure random token (7-day expiration) stored in PostgreSQL with hashed value (`hashed_token`) and revoked upon logout or password reset.
- **Header Format:** `Authorization: Bearer <ACCESS_TOKEN>`.

### 4.2 Role-Based Access Control (RBAC) Hierarchy
Node.js Express provides declarative middleware: `requireRole(['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'])`.

```
                    ┌──────────────┐
                    │ HTTP Request │
                    └──────┬───────┘
                           │
             ┌─────────────▼─────────────┐
             │ verifyJwtToken Middleware │
             └─────────────┬─────────────┘
                           │ Valid JWT?
                  ┌────────┴────────┐
                  ▼ YES             ▼ NO
       ┌──────────────────────┐  ┌──────────────────────┐
       │ attach req.user      │  │ HTTP 401             │
       └──────────┬───────────┘  │ TokenExpired / Invalid│
                  │              └──────────────────────┘
       ┌──────────▼───────────┐
       │ requireRole(['...']) │
       └──────────┬───────────┘
                  │ Role Allowed?
         ┌────────┴────────┐
         ▼ YES             ▼ NO
  ┌──────────────┐  ┌──────────────────────┐
  │ Next Handler │  │ HTTP 403 Forbidden   │
  └──────────────┘  └──────────────────────┘
```

### 4.3 Data Protection & Security Controls
1. **HTTP Security Headers:** Express applies `helmet()` configuring CSP, HSTS, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
2. **CORS Policy:** Strict whitelist allowing only the configured frontend domain (`CORS_ORIGIN`).
3. **Rate Limiting:** `express-rate-limit` enforces 100 requests per minute per IP for standard APIs, and 10 requests per minute for login/auth endpoints.
4. **PCI-DSS Compliance Awareness:** Cardholder data is sanitized before storage. Primary account numbers are masked (`**** **** **** 1234`). CVC/CVV values are never stored under any circumstance.

---

## 5. Request Validation & Centralized Error Handling

### 5.1 Validation Strategy
- **Client Tier:** React forms utilize Zod schemas for immediate inline validation feedback before dispatching requests.
- **Node.js Gateway:** Zod / Joi validation middleware validates `req.body`, `req.query`, and `req.params`. Any malformed request is rejected immediately with HTTP 422 before touching controllers or downstream services.
- **Python ML Service:** Pydantic models validate incoming feature tensors and numerical boundaries.

### 5.2 Uniform API Error Structure
All error responses conform to a predictable JSON envelope:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid transaction payload: amount must be greater than zero",
    "details": [
      {
        "field": "amount",
        "issue": "Expected number > 0, received -15.50"
      }
    ],
    "timestamp": "2026-10-26T02:00:00.000Z",
    "requestId": "req_8f1a23c4d5"
  }
}
```

---

## 6. Structured Logging, Tracing & Correlation IDs

1. **Request Correlation ID:** Every inbound HTTP request received by Node.js is tagged with a unique `X-Request-Id` (UUID v4) via middleware.
2. **Context Propagation:** When Node.js calls Python FastAPI, it forwards `X-Request-Id: <ID>`. FastAPI echoes it in internal logs and response headers.
3. **Structured Log Format:** All application logs are output as JSON containing `timestamp`, `level`, `requestId`, `service`, `endpoint`, `durationMs`, and `message`.
4. **Zero Sensitive Data in Logs:** PII, passwords, authorization tokens, and credit card numbers are scrubbed by a custom logging sanitizer.

---

## 7. Machine Learning Model Lifecycle

### 7.1 Model Artifact Storage & Loading
- **Storage Location:** Frozen model binaries (`.joblib` or `.pkl`) and preprocessor transformers are stored in a designated `models/` directory inside the Python ML service.
- **Eager Loading on Startup:** Models and preprocessors are loaded into memory during FastAPI's `@app.on_event("startup")` lifecycle hook. This eliminates cold-start latency for user-facing inference.
- **Model Registry Cache:** An in-memory dictionary maintains loaded model instances keyed by model identifier (e.g., `random_forest_v1`, `xgboost_v1`).
- **Graceful Warmup:** During startup, a synthetic dummy transaction is passed through the inference pipeline to initialize JIT compilations, NumPy caches, and Scikit-Learn tree paths.

### 7.2 Prediction & Explanation Lifecycle
```
[ Incoming Feature Dict ]
          │
          ▼
[ Pydantic Schema Validation ]
          │
          ▼
[ Feature Transformer Pipeline ] ──> Imputes missing values, encodes categories, scales amounts
          │
          ▼
[ Estimator Inference ]          ──> predict_proba() returns P(Fraud)
          │
          ▼
[ Calibrated Risk Translation ]  ──> Probability mapped to 0-100 Risk Score & Tier
          │
          ▼
[ SHAP Feature Attribution ]     ──> Computes shap_values for top 5 risk drivers
          │
          ▼
[ Structured JSON Response ]
```

---

## 8. Configuration & Environment Variables

All environments are managed strictly through typed environment configurations.

### 8.1 Node.js Backend (`.env`)
```bash
# Server Configuration
PORT=4000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://trace_user:trace_password@localhost:5432/trace_db?schema=public

# Authentication & Security
JWT_SECRET=super_secret_jwt_signing_key_at_least_32_chars_long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Downstream ML Service
ML_SERVICE_URL=http://localhost:8000
ML_INTERNAL_API_KEY=internal_trace_ml_service_shared_secret_key
ML_TIMEOUT_MS=1500

# Operational Risk Parameters
DEFAULT_ALERT_THRESHOLD=70
```

### 8.2 Python ML Service (`.env`)
```bash
# Service Configuration
HOST=0.0.0.0
PORT=8000
ENV=development
LOG_LEVEL=info

# Security
INTERNAL_API_KEY=internal_trace_ml_service_shared_secret_key

# Model Artifacts
ACTIVE_MODEL_PATH=models/random_forest_champion.joblib
PREPROCESSOR_PATH=models/preprocessor.joblib
MODEL_METRIC_REPORT_PATH=reports/model_comparison.json
```

### 8.3 React Frontend (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=TRACE
```
