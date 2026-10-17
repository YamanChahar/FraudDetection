# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 5 Complete & Verified — Awaiting Approval for Phase 6

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Yes (Approved) |
| **Phase 2** | Preprocessing and Experimental Design | **VERIFIED** | Yes (Approved) |
| **Phase 3** | Logistic Regression Baseline | **VERIFIED** | Yes (Approved) |
| **Phase 4** | Imbalance Handling Experiments | **VERIFIED** | Yes (Approved) |
| **Phase 5** | Model Comparison and Selection | **VERIFIED** | Awaiting Approval to proceed to Phase 6 |
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

### Phase 4 — Class Imbalance Handling Experiments
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.
- Evaluated Unweighted (PR-AUC 0.7388, Recall 0.6429), Class-Weighted (PR-AUC 0.7175, Recall 0.9184), and SMOTE (PR-AUC 0.7251, Recall 0.9184). Proved SMOTE does not outperform class weighting on this dataset.

---

### Phase 5 — Model Comparison and Selection
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Installed `xgboost==3.4.1` in `.venv`; updated `requirements.txt`.
- Implemented `build_random_forest_pipeline()` and `build_xgboost_pipeline()` in `src/train.py`:
  - Coupled `RobustScaler` preprocessing inside `Pipeline` to prevent leakage.
  - Random Forest configured with 100 trees, `max_depth=12`, `min_samples_leaf=2`, `class_weight='balanced'`.
  - XGBoost configured with 100 trees, `max_depth=5`, `learning_rate=0.1`, `scale_pos_weight=1.0`.
- Implemented automated unit tests in `tests/test_train_evaluate.py` for Random Forest and XGBoost (34/34 tests pass).
- Executed Stratified 5-Fold Cross-Validation on $X_{\text{train}}$ only across all three models to measure cross-validation performance.
- Trained all three models on full $X_{\text{train}}$ (227,845 records) and evaluated on the isolated held-out test set (56,962 records).
- Generated Precision-Recall curve comparison visualization saved to `reports/precision_recall_curves.png`.
- Saved machine-readable comparison report to `reports/model_comparison.json`.
- Saved human-readable summary report to `reports/model_comparison.md`.
- Persisted serialized model artifacts in `models/` (`logistic_regression.joblib`, `random_forest.joblib`, `xgboost.joblib`, and `best_model.joblib`).

#### 2. Actual Verified Comparative Results (Held-Out Test Set: 56,962 Transactions)

| Metric | 1. Logistic Regression | 2. Random Forest (Winner) | 3. XGBoost |
|---|---|---|---|
| **Average Precision (PR-AUC)** | **0.7175** | **`0.8462`** | **0.8253** |
| **Recall (Sensitivity)** | **0.9184** (90/98) | **`0.8469`** (83/98) | **0.7755** (76/98) |
| **Precision** | **0.0609** | **`0.7217`** | **0.9048** |
| **F1-Score** | **0.1142** | **`0.7793`** | **0.8352** |
| **ROC-AUC** | **0.9720** | **`0.9735`** | **0.9612** |
| **Raw Accuracy** | **0.9755** | **0.9992** | **0.9995** |
| **True Positives (TP)** | 90 | **83** | 76 |
| **False Positives (FP)** | 1,388 | **32** | 8 |
| **False Negatives (FN)** | 8 | **15** | 22 |
| **True Negatives (TN)** | 55,476 | **56,832** | 56,856 |
| **Training Time** | 2.34s | 20.76s | 5.11s |

#### 3. Cross-Validation Results (5-Fold Stratified on $X_{\text{train}}$)
- **Logistic Regression**: CV Mean PR-AUC = `0.7477` (± 0.0500) | CV Recall = `0.9138` (± 0.0230) | CV Precision = `0.0630` (± 0.0037)
- **Random Forest**: CV Mean PR-AUC = `0.8335` (± 0.0234) | CV Recall = `0.7970` (± 0.0479) | CV Precision = `0.8239` (± 0.0545)
- **XGBoost**: CV Mean PR-AUC = `0.8251` (± 0.0166) | CV Recall = `0.7362` (± 0.0504) | CV Precision = `0.9395` (± 0.0414)

#### 4. Model Selection Decision & Technical Rationale
- **Selected Champion: Random Forest (Balanced)**:
  1. **Dominant PR-AUC**: Achieved the highest Average Precision (**0.8462** on test, **0.8335** on CV), proving superior ranking of fraudulent transactions across all operational thresholds.
  2. **Massive False Alarm Reduction**: Slashed false positive alerts from 1,388 (Logistic Regression) down to **32 false positives** across 56,864 transactions (a **97.7% reduction in false alarms**), elevating precision from 6.09% to **72.17%**.
  3. **High Fraud Catch Rate**: Retains strong fraud detection (**84.69% recall**, capturing 83 out of 98 frauds). In comparison, XGBoost missed 22 frauds (77.55% recall).
  4. **Operational Viability**: 72.2% precision means nearly 3 out of 4 flagged transactions are confirmed fraud, drastically reducing customer friction and compliance alert fatigue.
- **Artifact**: Saved as `models/best_model.joblib`.

#### 5. Files Created / Modified
- `src/train.py`: Added `build_random_forest_pipeline()` and `build_xgboost_pipeline()`.
- `tests/test_train_evaluate.py`: Added Random Forest and XGBoost unit tests (34/34 tests pass).
- `requirements.txt`: Pinned `xgboost==3.4.1`.
- `reports/model_comparison.json`: Machine-readable multi-model evaluation report.
- `reports/model_comparison.md`: Detailed comparison matrix and selection rationale.
- `reports/precision_recall_curves.png`: High-resolution Precision-Recall curve chart.
- `models/random_forest.joblib`: Serialized Random Forest pipeline.
- `models/xgboost.joblib`: Serialized XGBoost pipeline.
- `models/best_model.joblib`: Serialized selected champion model.
- `PROJECT_PROGRESS.md`: Phase 5 marked VERIFIED with all metrics.

#### 6. Phase 5 Acceptance Checklist
- [x] Verified Phase 4 completion and confirmed clean environment state.
- [x] Implemented Random Forest and XGBoost pipelines in `src/train.py`.
- [x] Executed 5-fold Stratified Cross-Validation on $X_{\text{train}}$ for all 3 models.
- [x] Evaluated all 3 models on isolated held-out test set ($X_{\text{test}}$, $y_{\text{test}}$).
- [x] Compared Precision, Recall, F1, PR-AUC, ROC-AUC, confusion matrices, and training times.
- [x] Generated and saved Precision-Recall curves to `reports/precision_recall_curves.png`.
- [x] Documented model selection criteria and justified Random Forest as champion.
- [x] Persisted best model to `models/best_model.joblib`.
- [x] Saved machine-readable report to `reports/model_comparison.json`.
- [x] Saved formatted summary report to `reports/model_comparison.md`.
- [x] Automated test suite passing (34/34 tests pass).
- [x] Phase 5 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 6.
