# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 3 Complete & Verified — Awaiting Approval for Phase 4

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Yes (Approved) |
| **Phase 2** | Preprocessing and Experimental Design | **VERIFIED** | Yes (Approved) |
| **Phase 3** | Logistic Regression Baseline | **VERIFIED** | Awaiting Approval to proceed to Phase 4 |
| **Phase 4** | Imbalance Handling Experiments | NOT STARTED | Pending |
| **Phase 5** | Model Comparison and Selection | NOT STARTED | Pending |
| **Phase 6** | Risk Scoring and Prediction Interface | NOT STARTED | Pending |
| **Phase 7** | Streamlit Dashboard | NOT STARTED | Pending |
| **Phase 8** | Explainability (SHAP) | NOT STARTED | Pending |
| **Phase 9** | Quality Assurance and Reliability | NOT STARTED | Pending |
| **Phase 10** | Deployment and Portfolio Preparation | NOT STARTED | Pending |
| **Phase 11** | Final Review and Interview Readiness | NOT STARTED | Pending |

---

## Detailed Phase Logs

### Phase 0 — Workspace, Environment, and Repository Setup
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.

### Phase 1 — Data Validation and Exploratory Data Analysis
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.
- Real dataset: 284,807 rows, 31 columns, 0 nulls. Imbalance: 99.8273% legit vs 0.1727% fraud (577.88:1 ratio). Duplicates: 1,081 rows.

### Phase 2 — Preprocessing and Experimental Design
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.
- Stratified 80/20 split: 227,845 train rows (394 frauds), 56,962 test rows (98 frauds). Zero index overlap. RobustScaler for Time & Amount.

---

### Phase 3 — Logistic Regression Baseline
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Implemented `src/train.py`:
  - `build_logistic_regression_pipeline()`: Assembles an end-to-end `Pipeline` incorporating the leakage-safe `RobustScaler` preprocessor and `LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)`.
  - `train_baseline_logistic_regression()`: Trains the pipeline strictly on the 227,845 training samples without touch to test data.
  - `save_pipeline()` and `load_pipeline()`: Persists the unified pipeline artifact containing both fitted preprocessing and model weights to `models/baseline_logistic_regression.joblib`.
- Implemented `src/evaluate.py`:
  - `evaluate_predictions()`: Computes Precision, Recall, F1-Score, ROC-AUC, Average Precision (PR-AUC), Accuracy, Confusion Matrix (TN, FP, FN, TP), operational error rates, and classification report.
  - `evaluate_model()`: End-to-end evaluation on held-out test data.
  - `save_evaluation_report()`: Generates machine-readable JSON (`reports/baseline_logistic_regression.json`) and formatted Markdown (`reports/baseline_logistic_regression.md`).
- Implemented unit test suite in `tests/test_train_evaluate.py` (8 tests covering pipeline building, model fitting, prediction bounds, metric formulas, serialization roundtrips, and report saving).
- Executed full test suite via `pytest` (30 passed in 9.05s, 100% pass rate).
- Executed the baseline training and evaluation on the live dataset (227,845 train rows, 56,962 test rows) and recorded actual verified metrics.

#### 2. Actual Verified Baseline Evaluation Results (Held-Out Test Set: 56,962 Samples)

| Metric | Score | Interpretation / Financial Context |
|---|---|---|
| **Average Precision (PR-AUC)** | **`0.7175`** | Primary benchmark for imbalanced fraud across all thresholds. |
| **Recall (Sensitivity)** | **`0.9184`** (91.84%) | Caught **90 out of 98** actual frauds in the test set. Only 8 frauds missed. |
| **Precision** | **`0.0609`** (6.09%) | Low precision due to extreme 578:1 base rate and class weighting. |
| **F1-Score** | **`0.1142`** | Harmonic mean reflecting the trade-off at the default 0.50 threshold. |
| **ROC-AUC** | **`0.9720`** | High ranking capability, but partially optimistic due to large True Negative pool. |
| **Raw Accuracy** | **`0.9755`** | Non-primary metric; lowered from 99.83% naive accuracy to detect 91.8% of fraud. |

#### Confusion Matrix (56,962 Test Transactions)
- **True Negatives (TN)**: **`55,476`** (Legitimate transactions correctly approved)
- **False Positives (FP)**: **`1,388`** (Legitimate transactions flagged as fraud — false alarms)
- **False Negatives (FN)**: **`8`** (Fraudulent transactions missed — unrecovered fraud loss)
- **True Positives (TP)**: **`90`** (Fraudulent transactions successfully intercepted)

#### Operational Error Rates:
- **False Positive Rate (FPR)**: `0.0244` (Flagged 2.44% of legitimate volume)
- **False Negative Rate (Miss Rate)**: `0.0816` (Missed 8.16% of fraudulent transactions)

#### 3. Technical Decisions & Analytical Insights
- **What Logistic Regression Learns**:
  Logistic Regression fits a linear decision hyperplane $\mathbf{w}^T \mathbf{x} + b$ mapped through a sigmoid link function $\sigma(z) = \frac{1}{1 + e^{-z}}$ to estimate the log-odds of a transaction being fraudulent.
- **Impact of `class_weight='balanced'`**:
  In unweighted regression, each sample contributes equally to the log-loss. Because legitimate transactions represent 99.83% of data, an unweighted model is incentivized to ignore the minority class to minimize loss. Setting `class_weight='balanced'` scales the loss gradient for fraud samples by $\approx 577$, forcing the optimization algorithm to shift its decision boundary into the legitimate distribution to avoid missing fraud.
- **The Operational Trade-off**:
  While balanced class weights successfully achieved an impressive **91.84% recall**, the linear boundary flags **1,388 legitimate transactions** as fraud, yielding a precision of **6.09%** (~1 true fraud caught per ~16 alerts). In a live bank, this would produce investigator alert fatigue and cardholder friction.
- **Why This is a Baseline**:
  A single linear hyperplane cannot capture non-linear feature interactions between transaction amounts, time of day, and anonymized PCA components. This sets our performance benchmark: any subsequent resampling technique (Phase 4) or non-linear model (Phase 5: Random Forest, XGBoost) must demonstrate improvement over this PR-AUC of **0.7175**.

#### 4. Files Created / Modified
- `src/train.py`: Pipeline construction, training, and artifact persistence.
- `src/evaluate.py`: Imbalanced metrics computation, confusion matrix extraction, and report persistence.
- `tests/test_train_evaluate.py`: Automated test suite for training, inference, and metrics.
- `reports/baseline_logistic_regression.json`: Machine-readable evaluation report.
- `reports/baseline_logistic_regression.md`: Human-readable summary report.
- `models/baseline_logistic_regression.joblib`: Trained baseline pipeline artifact (git-ignored).
- `PROJECT_PROGRESS.md`: Phase 3 updated to VERIFIED with verified metrics.

#### 5. Automated Tests Run & Results
- Total Tests: 30 (4 config + 9 data validation + 9 preprocessing + 8 train/eval)
- `tests/test_train_evaluate.py` (8 tests) -> **ALL PASSED**:
  - `test_build_logistic_regression_pipeline` -> **PASSED**
  - `test_train_baseline_logistic_regression_produces_fitted_pipeline` -> **PASSED**
  - `test_pipeline_predictions_and_probabilities_validity` -> **PASSED**
  - `test_evaluate_predictions_metrics_calculation` -> **PASSED**
  - `test_evaluate_predictions_raises_on_invalid_bounds` -> **PASSED**
  - `test_evaluate_model_end_to_end` -> **PASSED**
  - `test_save_and_load_pipeline` -> **PASSED**
  - `test_save_evaluation_report` -> **PASSED**
- Result: **30 passed, 0 failed in 9.05s (100% pass rate)**.

#### 6. Phase 3 Acceptance Checklist
- [x] Verified Phase 2 completion and confirmed clean environment state.
- [x] Implemented end-to-end pipeline in `src/train.py` coupling preprocessing and Logistic Regression.
- [x] Model trained exclusively on $X_{\text{train}}$ with `class_weight='balanced'`.
- [x] Evaluated model strictly on held-out test set ($X_{\text{test}}$, $y_{\text{test}}$).
- [x] Computed Precision, Recall, F1, ROC-AUC, PR-AUC, and Confusion Matrix.
- [x] Saved machine-readable report to `reports/baseline_logistic_regression.json`.
- [x] Saved formatted summary report to `reports/baseline_logistic_regression.md`.
- [x] Persisted unified model artifact to `models/baseline_logistic_regression.joblib`.
- [x] Implemented 8 automated unit tests in `tests/test_train_evaluate.py` (30/30 total tests pass).
- [x] Documented operational trade-offs and rationale for Phase 4 experiments.
- [x] Phase 3 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 4.
