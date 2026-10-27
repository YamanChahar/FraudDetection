# TRACE — System Acceptance Criteria & Test Verification Matrix

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Product Discovery & System Architecture  
**Status:** Approved for Review  
**Product Codename:** TRACE (Transaction Risk & Fraud Analysis Platform)  

---

## 1. Acceptance Framework Overview

This document specifies the authoritative, non-negotiable **Acceptance Criteria** required to certify TRACE for production deployment. Acceptance tests are formulated using the industry-standard **Given-When-Then** specification syntax to guarantee unambiguous testing across functional, architectural, performance, and UI/UX dimensions.

---

## 2. Functional Acceptance Criteria by Domain

### 2.1 Authentication & Role-Based Access Control (RBAC)

#### AC-AUTH-01: Valid User Authentication
- **Given:** A registered user with email `analyst@trace-risk.com` and password `ValidPassword123!` exists in PostgreSQL.
- **When:** The user posts credentials to `POST /api/v1/auth/login`.
- **Then:** The server returns HTTP 200 with a valid JWT access token, a refresh token, user profile data with role `ANALYST`, and records an authentication event in `AuditLog`.

#### AC-AUTH-02: Invalid Credentials Rejection
- **Given:** An active user account.
- **When:** A request is sent with an incorrect password.
- **Then:** The server returns HTTP 401 with error code `UNAUTHORIZED` and generic message `"Invalid email or password"` without revealing which field was incorrect.

#### AC-AUTH-03: RBAC Route Protection
- **Given:** An authenticated user with role `ANALYST`.
- **When:** The user attempts to adjust global alert thresholds via `PATCH /api/v1/settings/threshold` (which requires `LEAD` or `ADMIN`).
- **Then:** The server rejects the request with HTTP 403 `FORBIDDEN` and error message `"Insufficient role permissions"`.

---

### 2.2 Fraud Testing Lab (Core Single Transaction Scoring)

#### AC-LAB-01: Successful Real-Time Scoring Flow
- **Given:** An authenticated analyst is on the Fraud Testing Lab page.
- **When:** The analyst selects the "High-Risk Card-Not-Present Sudden Spike" sample and clicks "Execute Risk Analysis".
- **Then:**
  1. The client validates the input schema and sends `POST /api/v1/fraud-testing/analyze`.
  2. Node.js relays features to Python FastAPI `/internal/v1/predict`.
  3. Python ML computes probability, maps to 0-100 risk score, and calculates SHAP drivers.
  4. Node.js persists the transaction and prediction in PostgreSQL.
  5. The UI renders the animated Risk Gauge with calculated score (e.g. 89 - HIGH), recommendation `DECLINE`, and displays the top 3 risk factors with human-readable descriptions in < 300ms total.

#### AC-LAB-02: Strict Client & Server-Side Input Validation
- **Given:** An analyst enters a negative amount (e.g., `-50.00 USD`) or leaves the customer ID blank.
- **When:** The analyst attempts to submit the form.
- **Then:**
  1. Client-side Zod validation intercepts the submit, disables the primary button, and displays inline error messages in Rust Terracotta (`#A83824`).
  2. If bypassed via curl/direct API, Node.js validation middleware immediately returns HTTP 422 `VALIDATION_ERROR` with structured field errors, never contacting the ML service.

#### AC-LAB-03: Automated Alert Generation on High Risk
- **Given:** The global alert threshold is set to 70.
- **When:** A transaction evaluates to a Risk Score of 85.
- **Then:**
  1. Node.js automatically generates a `FraudAlert` record with severity `HIGH` and status `PENDING_REVIEW`.
  2. The sidebar alert badge count increments immediately.
  3. The response payload returns `"alertCreated": true` with the linked `alertId`.

---

### 2.3 Transaction Explorer & Ledger

#### AC-TRX-01: Filterable & Paginated Ledger
- **Given:** A database containing 5,000 historical transactions.
- **When:** A user filters the ledger by `riskTier=HIGH` and `minAmount=1000`.
- **Then:**
  1. The server executes an indexed query and returns HTTP 200 with the exact matching subset.
  2. The UI renders the tabular ledger displaying tabular numbers for currency and dates.
  3. Pagination controls show exact page count and total records.

#### AC-TRX-02: Granular Transaction Detail Drawer
- **Given:** A transaction displayed in the ledger.
- **When:** The user clicks the transaction row.
- **Then:** A detail drawer slides in smoothly from the right, displaying raw features JSON, prediction latency, active model version, and linked alert details.

---

### 2.4 Fraud Alerts & Case Investigation

#### AC-ALT-01: Alert Status Transition & Immutable Audit Log
- **Given:** An active alert in `PENDING_REVIEW` state.
- **When:** A Senior Investigator updates the status to `CONFIRMED_FRAUD` with notes `"Confirmed card theft via phone with cardholder"`.
- **Then:**
  1. Node.js updates `FraudAlert.status` to `CONFIRMED_FRAUD`.
  2. Node.js creates an immutable `InvestigationRecord` with `action="STATUS_CHANGE"`, `previous_status="PENDING_REVIEW"`, `new_status="CONFIRMED_FRAUD"`, and the investigator's user ID.
  3. The UI updates the alert pill to Rust Terracotta and displays a success toast.

---

### 2.5 Batch Dataset Testing

#### AC-BAT-01: CSV File Upload & Asynchronous Execution
- **Given:** A valid CSV dataset containing 10,000 transaction rows.
- **When:** A Risk Lead uploads the file on the Dataset Testing page.
- **Then:**
  1. Node.js validates the file structure and returns HTTP 202 `Accepted` with a `jobId`.
  2. An asynchronous background process chunks the dataset (500 records/chunk) and streams inference calls to Python `/internal/v1/batch-predict`.
  3. The UI displays an active progress bar polling `GET /batch-jobs/:id` every 2 seconds.
  4. Upon 100% completion, the UI displays the aggregate summary metrics card (Mean Risk Score, Flagged Count, Tier Distribution) and enables the results CSV download button.

---

### 2.6 Model Governance & Performance Verification

#### AC-MDL-01: Authoritative Metric Integrity
- **Given:** The active model is the Random Forest Champion (`v1.0.0-rf`).
- **When:** A user views the Model Performance page.
- **Then:**
  1. The displayed metrics strictly reflect authoritative holdout evaluations:
     - **PR-AUC:** `0.8462`
     - **Recall:** `0.8469`
     - **Precision:** `0.7217`
     - **F1-Score:** `0.7793`
     - **ROC-AUC:** `0.9735`
     - **False Positives:** `32` (out of 56,864 legitimate transactions)
  2. No synthetic or hallucinated metrics are displayed.

---

## 3. Non-Functional & Architectural Acceptance Criteria

### 3.1 Performance & Latency SLAs
- **AC-PERF-01 (Inference Latency):** 95% of single-transaction inference requests (`POST /fraud-testing/analyze`) must complete end-to-end in < **300ms** under normal network conditions, with Python ML compute consuming < **80ms**.
- **AC-PERF-02 (Batch Throughput):** The batch processing subsystem must sustain at least **500 transactions per second** during asynchronous file processing.
- **AC-PERF-03 (UI Client Performance):** Initial page loads and client route transitions must achieve First Contentful Paint (FCP) < **1.2s** and Cumulative Layout Shift (CLS) < **0.05**.

### 3.2 Resiliency & Fault Tolerance
- **AC-REL-01 (ML Service Outage):** If the Python FastAPI service is stopped or unreachable, Node.js must not crash or hang. It must timeout at 1,500ms, trip its circuit breaker, and return HTTP 503 `SERVICE_UNAVAILABLE` with clear diagnostic details. The frontend must display a calm, non-blocking connection warning banner.
- **AC-REL-02 (Atomic Transactions):** Any multi-table write operation that encounters an error must rollback completely without leaving orphaned records.

### 3.3 Security & Compliance
- **AC-SEC-01 (Zero Cleartext PANs):** The database and API payloads must never store or transmit unmasked 16-digit credit card primary account numbers.
- **AC-SEC-02 (NoSQL & Injection Protection):** All queries must execute via strongly-typed Mongoose ODM queries with schema-level casting and sanitization; all client inputs must be validated via Zod schemas.
- **AC-SEC-03 (Audit Immutability):** Records in `AuditLog` and `InvestigationRecord` cannot be edited or deleted via any API endpoint.

---

## 4. UI/UX Design System Compliance Checklist

Every page in TRACE must pass the following visual and accessibility audit:

| Verification Item | Target Standard | Compliance Criteria |
| :--- | :--- | :--- |
| **Color Palette Adherence** | Warm Ivory / Charcoal / Terracotta | Primary background must be `#F5F2EA`; sidebar `#25251F`; primary text `#1B1B18`; accent `#B65D3A`. |
| **Strict Color Prohibition** | No Blue / No Purple | **Zero instances** of `#2563EB`, `#3B82F6`, `#7C3AED`, or purple/blue CSS utility classes. |
| **No Neon / No Glassmorphism**| No visual gimmicks | Zero neon glowing borders, zero blurred backdrop filters, zero fake decorative cards. |
| **Tabular Numbers** | Numeric Data Alignment | All monetary amounts, dates, percentages, and scores must use `tabular-nums` typography. |
| **Status Mineral Tones** | Semantic Status Badges | Low Risk: Sage Forest (`#2E5A36`); Medium: Ochre Amber (`#8F5D18`); High: Rust Terracotta (`#A83824`). |
| **Accessibility Standard** | WCAG 2.1 AA | Contrast ratio for all text elements must be $\ge 4.5:1$ against their respective backgrounds. |
| **Responsive Breakpoints** | Viewport Adaptability | Desktop (`1440px`), Laptop (`1024px`), and Tablet (`768px`) supported without horizontal scrollbars. |
