# TRACE — Transaction Risk & Fraud Analysis Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v24-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-brightgreen.svg)](https://www.mongodb.com/)
[![SHAP](https://img.shields.io/badge/Explainability-True%20SHAP-orange.svg)](https://shap.readthedocs.io/)

TRACE is an enterprise-grade financial fraud detection and risk analysis platform. Designed for risk analysts, compliance officers, and fintech operators, TRACE evaluates financial transactions in real time, computes calibrated 0–100 risk scores, triages suspicious activity into prioritized investigation queues, and provides instance-level explainability through true Shapley (SHAP) feature attributions.

---

## 1. Problem Statement & Solution

### The Challenge
Modern electronic payments operate at massive scale with low transaction margins. Traditional rule-based fraud detection engines struggle with:
1. **High False Positive Rates:** Legitimate cardholders are inconvenienced by rigid heuristics, leading to cart abandonment and merchant loss.
2. **Black-Box AI Models:** Complex neural networks or gradient-boosted trees flag suspicious activity without explaining *why*, leaving compliance analysts unable to justify transaction holds to regulators or cardholders.
3. **Audit Incompatibility:** Financial compliance standards require immutable records of human determinations versus automated machine learning outputs.

### The TRACE Solution
TRACE bridges modern statistical machine learning with regulatory auditability:
- **Calibrated Multi-Model Pipeline:** Real-time scoring using high-recall champion models (Logistic Regression, Random Forest, XGBoost) specifically trained on severe class imbalance.
- **True SHAP Explainability:** Decomposes risk into exact directional factor pushes (`INCREASES_RISK` vs `DECREASES_RISK`), giving analysts plain-English narrative summaries of primary anomaly drivers.
- **Audit-Compliant Separation:** Clear architectural boundaries between statistical ML estimates (`Prediction`) and legally binding human findings (`InvestigationRecord`), enforced through append-only database immutability.

---

## 2. Major Features

1. **Executive Overview Dashboard:** Live KPI cards (Total Volume, Flagged Anomalies, Pending Investigations, Exposure), 14-day transaction volume trend charts, and real-time risk tier distribution breakdowns.
2. **Interactive Fraud Testing Lab:** Interactive single-transaction simulator with pre-loaded benchmark scenarios (*Typical Retail*, *High-Value Transfer*, *Geo-Velocity Anomaly*), PCA slider adjustments, real-time risk gauges, operational policy recommendations, and SHAP factor attribution bars.
3. **Transaction Explorer:** Filterable data grid supporting search, channel filtering, risk level sorting, server-side pagination, and a slide-out transaction inspection drawer with full metadata.
4. **Fraud Alerts & Human Triage:** Severity-ranked alert queues with role-guarded status management (`OPEN` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `ESCALATED` / `RESOLVED` / `DISMISSED`) and investigation note recording.
5. **Model Performance & Candidate Benchmarks:** Live metrics display (ROC-AUC, PR-AUC, Precision, Recall, F1 score) and side-by-side comparison tables against candidate models evaluated on genuine held-out test data.
6. **Dataset Batch Testing:** Asynchronous portfolio stress-testing supporting CSV uploads or pre-loaded benchmark batches (up to 25,000 records) with chunked inference, live progress tracking, and CSV report export.
7. **Platform Administration & Immutable Audit Trail:** Role-based access control management and read-only viewer for the tamper-resistant, append-only `AuditLog` collection.

---

## 3. Technology Stack

- **Client Tier (`frontend/`):** React 19, Vite, React Router v7, Axios, Lucide Icons. Designed with custom financial Vanilla CSS (Warm Ivory `#F5F2EA`, Deep Charcoal `#25251F`, Terracotta `#B65D3A`, Sage `#2E5A36`, Ochre `#8F5D18`, Rust `#A83824`). Strictly no generic default templates.
- **Gateway & Orchestration Tier (`backend/`):** Node.js, Express, Mongoose ODM, Zod runtime validation, Helmet, CORS, Morgan request logging with correlation IDs (`X-Request-Id`).
- **Machine Learning Inference Tier (`ml-service/`):** Python 3.13, FastAPI, Uvicorn, Scikit-learn, XGBoost, SHAP, Pydantic v2.
- **Persistence Tier:** MongoDB Community Server 7.0+ (with automated in-memory `mongodb-memory-server` development fallback).

---

## 4. Architecture Overview

```
[ React Client (Port: 5173) ]
           │
           │ (HTTP / JSON via Axios with Bearer JWT)
           ▼
[ Node.js + Express API Gateway (Port: 4000) ]
           │
           ├── (Mongoose ODM) ─────────────> [ MongoDB Database (Port: 27017) ]
           │                                   (trace_dev / Embedded Dev Fallback)
           │
           │ (Internal HTTP + X-Internal-Service-Key + 1500ms timeout)
           ▼
[ Python FastAPI ML Service (Port: 8000) ]
           ├── Champion Model (Logistic Regression v1.2.0-champion)
           └── True SHAP Tree/Linear Explainer (Instance Factor Decomposition)
```

---

## 5. Application Views

> *Note: Placeholders for visual reference. Capture and add screenshots into `docs/screenshots/`.*

| View | Description | Screenshot Location |
| :--- | :--- | :--- |
| **Overview Dashboard** | Real-time transaction volume, risk breakdown, and active alerts | `docs/screenshots/01_dashboard.png` |
| **Fraud Testing Lab** | Real-time single transaction scoring, risk gauge, and SHAP bars | `docs/screenshots/02_testing_lab.png` |
| **Transaction Explorer** | Searchable transactions table with slide-out inspection drawer | `docs/screenshots/03_transactions.png` |
| **Alerts & Triage** | Prioritized alert queue and human investigation modal | `docs/screenshots/04_alerts.png` |
| **Model Performance** | Confusion matrix and candidate model benchmark comparison | `docs/screenshots/05_model_performance.png` |
| **Batch Testing** | Asynchronous CSV dataset portfolio stress-testing | `docs/screenshots/06_batch_testing.png` |

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js v20+ or v24+
- Python 3.11+
- MongoDB Community Server 7.0+ (Optional; backend includes automatic embedded memory fallback)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/trace-fraud-platform.git
cd trace-fraud-platform
```

### Step 2: Environment Configuration
Copy template environment files:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
```

### Step 3: Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# ML Service (create and activate virtualenv)
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1 | Unix: source .venv/bin/activate
pip install -r ml-service/requirements.txt
```

### Step 4: Model Training & Artifact Generation
To train and benchmark candidate models and serialize the champion artifact:
```bash
cd ml-service
python -m app.core.trainer
cd ..
```

### Step 5: Start All Services
Open three terminal windows:

```bash
# Terminal 1 — Python ML Service (Port 8000)
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Backend API Gateway (Port 4000)
cd backend
npm run dev

# Terminal 3 — Frontend Web App (Port 5173)
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` to access the application.

---

## 7. Automated Testing

### Backend Unit & Integration Tests (50 Tests)
```bash
cd backend
npm test
```
*Coverage:* JWT rotation, reuse detection, RBAC permissions, E2E transaction flow, MongoDB persistence, Decimal128 handling, and exact risk boundary enforcement (0, 30, 31, 70, 71, 89, 90, 100).

### Python ML Tests (14 Tests)
```bash
cd ml-service
python -m pytest
```
*Coverage:* Health checks, single inference, batch vectorization, SHAP feature alignment, linear and tree explainer verification, and directional attribution.

### Frontend Production Build
```bash
cd frontend
npm run build
```
*Result:* 9.77s build (`dist/`, 129.5 kB gzip JS).

---

## 8. Machine Learning Pipeline & True SHAP

### Preprocessing & Feature Alignment
Input transactions contain 30 features: `Time`, `V1` through `V28` (PCA latent features), and `Amount`. The `ColumnTransformer` applies `RobustScaler` to `Time` and `Amount` while passing through `V1`–`V28` in exact original order, guaranteeing 100% feature index alignment with SHAP explainers.

### Held-Out Test Evaluation (1,250 samples, 37 fraud cases)
- **Champion Model:** Logistic Regression (`class_weight="balanced"`)
- **PR-AUC:** `0.9880`
- **ROC-AUC:** `0.9995`
- **Recall:** `1.0000` (Zero false negatives)
- **Precision:** `0.5968` (25 false positives)

### Ground Truth Risk Boundaries
- **LOW (0–30):** Legitimate baseline transaction $\rightarrow$ Auto-Approve.
- **MEDIUM (31–70):** Moderate anomaly detected $\rightarrow$ Step-Up Authentication (3DS/MFA).
- **HIGH (71–89):** Elevated anomaly $\rightarrow$ Route to Fraud Analyst Queue.
- **CRITICAL (90–100):** Severe fraud vector $\rightarrow$ Immediate Payment Block.

---

## 9. Security & Compliance Considerations

1. **Authentication:** Bcrypt password hashing (work factor 10), short-lived JWT access tokens (15m), and single-use refresh token rotation with immediate token family revocation on reuse attempts.
2. **Internal API Protection:** The ML microservice rejects requests lacking the shared secret key in `X-Internal-Service-Key`.
3. **Audit Log Immutability:** The `AuditLog` collection is append-only. Modification and deletion operations trigger hard Mongoose errors.
4. **Rate Limiting:** Authentication routes are protected by a sliding window rate limiter allowing max 15 attempts/min per IP.

---

## 10. Known Limitations & Future Roadmap

- **Probability Calibration:** The ML service currently outputs raw logistic sigmoid / tree leaf probabilities. Formal calibration (e.g. Platt scaling or Isotonic regression) is recommended before live payment clearing.
- **MongoDB Replica Sets:** Production multi-document transactions require a replica set configuration (`rs0`).
- **Future Improvements:**
  - Streaming Kafka/RabbitMQ ingestion for enterprise transaction feeds.
  - Champion/Challenger live A/B model routing.
  - Multi-factor behavioral biometric telemetry.

---

## 11. Documentation Directory

- [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)
- [Local Setup Guide](docs/LOCAL_SETUP.md)
- [Machine Learning Pipeline](docs/ML_PIPELINE.md)
- [API Reference Specification](docs/API_REFERENCE.md)
- [Final Engineering Audit Report](docs/FINAL_ENGINEERING_AUDIT.md)

---

## 12. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
