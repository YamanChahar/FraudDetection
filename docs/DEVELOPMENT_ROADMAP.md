# TRACE — Multi-Phase Development Roadmap

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  

---

## 1. Roadmap Overview & Phasing Strategy

The construction of TRACE follows a rigorous, sequential, multi-phase delivery model. Each phase culminates in an explicit **Verification & Completion Gate** that must be audited before advancing to subsequent phases.

```
[ Phase 0: Discovery & Architecture ] ◄── WE ARE HERE (Planning Only)
               │
               ▼ (Explicit User Review & Approval)
[ Phase 1: Monorepo Foundation & Tooling ]
               │
               ▼
[ Phase 2: PostgreSQL Database & Prisma Schema ]
               │
               ▼
[ Phase 3: Python FastAPI ML Service ]
               │
               ▼
[ Phase 4: Node.js Express Main Backend ]
               │
               ▼
[ Phase 5: React Frontend Shell & Design System ]
               │
               ▼
[ Phase 6: Fraud Testing Lab & Real-Time Scoring Flow ]
               │
               ▼
[ Phase 7: Transaction Explorer, Alerts & Investigation Case Management ]
               │
               ▼
[ Phase 8: Batch Dataset Testing & Model Performance Analytics ]
               │
               ▼
[ Phase 9: End-to-End System Verification, Security & Production Readiness ]
```

---

## 2. Phase-by-Phase Execution Plan

### Phase 0: Product Discovery & System Architecture (CURRENT PHASE)
- **Objective:** Establish comprehensive system architecture, product requirements, database schema, API contracts, ML lifecycle plan, and UI/UX design specifications.
- **Key Deliverables:** 9 exhaustive specification documents in `docs/`.
- **Strict Boundary:** No application code, no package installations, no database migrations, no model training.
- **Completion Gate:** User review and explicit approval of Phase 0 documentation.

---

### Phase 1: Monorepo Foundation & Workspace Tooling
- **Objective:** Scaffolding the repository workspace with clean isolation between `apps/web`, `apps/api`, and `services/ml-service`.
- **Key Activities:**
  - Initialize root `package.json` workspace definitions.
  - Setup linting, formatting (ESLint, Prettier, Black, Flake8), and Git hooks.
  - Configure root `.env.example` templates and directory scaffolding.
- **Completion Gate:** Clean workspace setup with zero code cross-contamination; automated lint checks pass.

---

### Phase 2: MongoDB Database & Mongoose Data Modeling
- **Objective:** Implement the document-oriented data persistence layer in MongoDB using Mongoose ODM *(migrated from legacy PostgreSQL + Prisma)*.
- **Key Activities:**
  - Implement 9 Mongoose model definitions in `backend/src/models/` (`User`, `RefreshToken`, `Transaction`, `ModelVersion`, `Prediction`, `FraudAlert`, `InvestigationRecord`, `DatasetTestingJob`, `AuditLog`).
  - Configure resilient Mongoose connection manager with lifecycle monitoring, timeouts, and health checks.
  - Implement encapsulated repository query layer in `backend/src/repositories/`.
  - Implement Decimal128 monetary precision, unique indexes, and append-only audit hooks.
  - Archive legacy Prisma schema and SQL migrations in `backend/legacy_prisma_archive/`.
  - Implement automated test suite with `mongodb-memory-server` ensuring isolated, zero-dependency test execution.
- **Completion Gate:** Mongoose models validated, 27/27 automated unit/integration tests passing, resilient database health probes operational.

---

### Phase 3: Python FastAPI Machine Learning Service
- **Objective:** Implement the dedicated high-performance Python inference microservice.
- **Key Activities:**
  - Setup FastAPI application shell with Pydantic schemas.
  - Implement model and transformer loaders in `ml/loader.py`.
  - Implement `ml/preprocessor.py` for feature scaling and imputation.
  - Implement single transaction prediction and batch prediction endpoints.
  - Integrate SHAP `TreeExplainer` for local feature attribution on single predictions.
  - Implement probability-to-risk score calibration engine (0-100 score and risk tiers).
  - Write comprehensive unit tests for inference pipelines.
- **Completion Gate:** Internal endpoints `/internal/v1/health`, `/internal/v1/predict`, and `/internal/v1/batch-predict` execute with < 50ms latency; test suite passes 100%.

---

### Phase 4: Node.js Express Application Backend
- **Objective:** Implement the central API gateway, authentication system, business workflows, and external REST endpoints.
- **Key Activities:**
  - Setup Express server with security middleware (`helmet`, `cors`, `express-rate-limit`, correlation IDs).
  - Implement authentication system with Argon2 password hashing, JWT access tokens, and refresh token rotation.
  - Implement RBAC middleware (`requireRole`).
  - Implement downstream `mlClientService.js` to communicate with Python FastAPI with circuit breaking and 1500ms timeouts.
  - Implement controllers and routes for authentication, fraud testing, transactions, alerts, and model metrics.
  - Write unit and integration test suite using Supertest and Jest.
- **Completion Gate:** All public REST endpoints operational; JWT auth and RBAC verified; automated test coverage > 85%.

---

### Phase 5: React Frontend Shell & FinTech Design System
- **Objective:** Construct the responsive client application shell adhering strictly to the Warm Ivory / Charcoal / Terracotta design system.
- **Key Activities:**
  - Initialize React 19 + Vite application.
  - Configure Tailwind CSS tokens (`bg-primary: #F5F2EA`, `surface-sidebar: #25251F`, `accent-terracotta: #B65D3A`, mineral status indicators).
  - Implement responsive application layout (`AppShell`, `Sidebar`, `Header`).
  - Build reusable UI design system primitives (`Button`, `Card`, `Input`, `Badge`, `Modal`, `Drawer`, `Table`, `Skeleton`).
  - Implement Axios client with automatic JWT token refresh interceptors.
- **Completion Gate:** Design system verified against strict color guidelines (zero blue, zero purple, zero neon); responsive shell renders cleanly.

---

### Phase 6: Fraud Testing Lab & Real-Time Scoring Flow
- **Objective:** Implement the flagship interactive fraud testing workbench connecting the React UI to Node.js and the Python ML service.
- **Key Activities:**
  - Build `ScenarioSelector` with pre-configured benchmark transaction scenarios.
  - Build `TransactionForm` with client-side Zod validation and parameter inputs.
  - Build interactive `RiskGauge` (0-100 score) and `RecommendationBadge`.
  - Build SHAP feature attribution waterfall chart displaying risk escalators vs trust stabilizers.
  - Connect end-to-end flow: Form Submit -> Node.js -> Python ML -> PostgreSQL -> UI Results.
- **Completion Gate:** Single transaction testing executes smoothly with instant risk scoring and explainability in < 300ms end-to-end.

---

### Phase 7: Transaction Explorer, Alerts & Investigation Case Management
- **Objective:** Deliver the operational fraud investigation and case disposition subsystem.
- **Key Activities:**
  - Build `TransactionExplorer` with server-side pagination, multi-faceted filtering, and detail drawer.
  - Build `FraudAlerts` triage queue with priority sorting and status filters.
  - Implement status update modal with mandatory investigator rationale notes.
  - Verify immutable write to `InvestigationRecord` and `AuditLog` upon every triage action.
- **Completion Gate:** Investigators can triage alerts, update dispositions (`CONFIRMED_FRAUD`, `FALSE_POSITIVE`), and view audit logs with full referential integrity.

---

### Phase 8: Batch Dataset Testing & Model Performance Analytics
- **Objective:** Implement portfolio batch testing and model governance analytics.
- **Key Activities:**
  - Build `DatasetTesting` upload dropzone supporting CSV/JSON files.
  - Implement chunked asynchronous processing in Node.js streaming to Python batch endpoint.
  - Build live progress bar and batch summary metrics card.
  - Build `ModelPerformance` page displaying PR-AUC (0.8462), ROC-AUC (0.9735), Confusion Matrix, and Precision-Recall curves.
- **Completion Gate:** Batch upload evaluates 5,000 transactions smoothly; model performance metrics match authoritative holdout reports.

---

### Phase 9: End-to-End System Verification, Security & Production Readiness
- **Objective:** Comprehensive testing, security hardening, and production audit.
- **Key Activities:**
  - Execute end-to-end integration test suites across all workflows.
  - Conduct security audit (CORS, rate limiting, SQL injection defense, token expiration).
  - Verify WCAG 2.1 AA accessibility compliance.
  - Final documentation update and deployment readiness audit.
- **Completion Gate:** Full test suite passes; zero critical security vulnerabilities; project certified ready for production deployment.

---

## 3. Risk Assessment & Mitigation Strategies

| Risk Factor | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Downstream ML Service Latency Spike** | Moderate | High | Node.js enforces 1500ms timeout with circuit breaker, returning graceful 503 instead of hanging requests. |
| **Model Drift / Feedback Loop** | High | Critical | Strict architectural separation between model's automated risk score and human-verified confirmed ground truth. |
| **Large Batch Upload Memory Exhaustion**| Moderate | High | Node.js processes batch files using streams and chunks (500 records per chunk) rather than loading entire file into memory. |
| **Token Hijacking or Session Leak** | Low | High | Short-lived 15-minute access tokens paired with revocable, hashed refresh tokens stored in database. |
