# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 4 Complete & Verified — Awaiting Approval for Phase 5

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Yes (Approved) |
| **Phase 2** | Preprocessing and Experimental Design | **VERIFIED** | Yes (Approved) |
| **Phase 3** | Logistic Regression Baseline | **VERIFIED** | Yes (Approved) |
| **Phase 4** | Imbalance Handling Experiments | **VERIFIED** | Awaiting Approval to proceed to Phase 5 |
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

### Phase 3 — Logistic Regression Baseline
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.
- Baseline Balanced Logistic Regression: PR-AUC = 0.7175, Recall = 0.9184 (90/98 frauds caught), Precision = 0.0609, F1 = 0.1142, ROC-AUC = 0.9720.

---

### Phase 4 — Class Imbalance Handling Experiments
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Installed `imbalanced-learn==0.14.2` and `sklearn-compat==0.1.6` in `.venv`; updated `requirements.txt`.
- Implemented `build_smote_logistic_regression_pipeline()` in `src/train.py` using `imblearn.pipeline.Pipeline`:
  - `RobustScaler` preprocessing on training folds.
  - `SMOTE` oversampling applied strictly on training folds.
  - Unweighted classifier fitted on resampled training data.
  - `SMOTE` automatically skipped during inference on validation/test folds to guarantee zero data leakage.
- Executed Stratified 5-Fold Cross-Validation on $X_{\text{train}}$ only across all three strategies:
  1. Logistic Regression (Unweighted: `class_weight=None`)
  2. Logistic Regression (Class-Weighted: `class_weight='balanced'`)
  3. Logistic Regression with SMOTE (inside `imblearn.pipeline.Pipeline`)
- Evaluated all three strategies on the isolated held-out test set (56,962 samples).
- Generated machine-readable and human-readable comparative reports:
  - `reports/imbalance_experiments.json`
  - `reports/imbalance_experiments.md`
- Implemented unit tests in `tests/test_train_evaluate.py` for SMOTE pipeline execution and unweighted pipeline options (32/32 tests pass).

#### 2. Actual Verified Comparative Results (Held-Out Test Set: 56,962 Samples)

| Metric | 1. Unweighted Baseline | 2. Class-Weighted ('balanced') | 3. SMOTE Pipeline |
|---|---|---|---|
| **Average Precision (PR-AUC)** | **0.7388** | **0.7175** | **0.7251** |
| **Recall (Sensitivity)** | **0.6429** (63/98) | **0.9184** (90/98) | **0.9184** (90/98) |
| **Precision** | **0.8289** | **0.0609** | **0.0589** |
| **F1-Score** | **0.7241** | **0.1142** | **0.1106** |
| **ROC-AUC** | **0.9572** | **0.9720** | **0.9712** |
| **Raw Accuracy** | **0.9992** | **0.9755** | **0.9746** |
| **True Positives (TP)** | 63 | 90 | 90 |
| **False Positives (FP)** | 13 | 1,388 | 1,439 |
| **False Negatives (FN)** | 35 | 8 | 8 |
| **True Negatives (TN)** | 56,851 | 55,476 | 55,425 |
| **Training Time** | 1.23s | 2.42s | 4.08s |

#### 3. Cross-Validation Results (5-Fold Stratified on $X_{\text{train}}$)
- **Unweighted**: CV PR-AUC = 0.7622 (± 0.0425) | CV Recall = 0.6421 (± 0.0293) | CV Precision = 0.8835 (± 0.0287)
- **Class-Weighted**: CV PR-AUC = 0.7477 (± 0.0500) | CV Recall = 0.9138 (± 0.0230) | CV Precision = 0.0630 (± 0.0037)
- **SMOTE Pipeline**: CV PR-AUC = 0.7464 (± 0.0448) | CV Recall = 0.9188 (± 0.0188) | CV Precision = 0.0600 (± 0.0038)

#### 4. Analytical Findings & Operational Trade-offs
- **Fraud Capture vs. False Alarms**:
  - The Unweighted model achieves high precision (82.9%) by severely minimizing false positives (13 FP), but at the unacceptable cost of **missing 35 out of 98 frauds (35.7% missed fraud rate)**.
  - Class-Weighted and SMOTE both prioritize catching fraud, achieving **91.84% recall (catching 90 of 98 frauds)**, but generating ~1,400 false positives due to the linear decision boundary operating in an extreme 578:1 imbalance space.
- **Does SMOTE Outperform Class Weighting?**:
  - **No**. SMOTE achieves virtually identical recall (91.84% vs 91.84%) and slightly lower precision (5.89% vs 6.09%, with 1,439 FP vs 1,388 FP) compared to class weighting, while taking **~1.7x longer** to train (4.08s vs 2.42s).
  - In linear models on PCA-anonymized features, synthetic linear interpolation between minority points does not uncover non-linear decision regions; class weighting achieves equivalent loss penalization without synthetic sampling artifacts.
- **Architectural Implication for Phase 5**:
  - Linear models on this dataset have an empirical PR-AUC ceiling around ~0.72–0.74. In Phase 5, we will evaluate non-linear tree ensembles (**Random Forest** and **XGBoost**) which can carve out localized high-risk decision regions to simultaneously achieve high recall and dramatically lower false alarm rates.

#### 5. Files Created / Modified
- `src/train.py`: Added `build_smote_logistic_regression_pipeline()` and unweighted options.
- `tests/test_train_evaluate.py`: Added tests for SMOTE pipeline execution and unweighted pipeline options (32/32 tests pass).
- `requirements.txt`: Pinned `imbalanced-learn==0.14.2` and `sklearn-compat==0.1.6`.
- `reports/imbalance_experiments.json`: Machine-readable comparison results.
- `reports/imbalance_experiments.md`: Comprehensive Markdown comparison matrix.
- `PROJECT_PROGRESS.md`: Phase 4 marked VERIFIED with actual metrics.

#### 6. Phase 4 Acceptance Checklist
- [x] Verified Phase 3 baseline completion and confirmed clean environment state.
- [x] Implemented SMOTE pipeline inside `imblearn.pipeline.Pipeline` with zero test leakage.
- [x] Executed 5-fold Stratified Cross-Validation on $X_{\text{train}}$ across all three strategies.
- [x] Evaluated Unweighted, Class-Weighted, and SMOTE on held-out test set ($X_{\text{test}}$, $y_{\text{test}}$).
- [x] Compared Precision, Recall, F1, PR-AUC, ROC-AUC, confusion matrices, and training times.
- [x] Saved machine-readable report to `reports/imbalance_experiments.json`.
- [x] Saved formatted comparison report to `reports/imbalance_experiments.md`.
- [x] Unit test suite updated and passing (32/32 tests pass).
- [x] Documented operational trade-offs and rationale for Phase 5 model comparison.
- [x] Phase 4 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 5.
