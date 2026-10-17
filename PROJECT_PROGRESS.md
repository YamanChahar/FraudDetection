# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 7 Complete & Verified — Awaiting Approval for Phase 8

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Yes (Approved) |
| **Phase 2** | Preprocessing and Experimental Design | **VERIFIED** | Yes (Approved) |
| **Phase 3** | Logistic Regression Baseline | **VERIFIED** | Yes (Approved) |
| **Phase 4** | Imbalance Handling Experiments | **VERIFIED** | Yes (Approved) |
| **Phase 5** | Model Comparison and Selection | **VERIFIED** | Yes (Approved) |
| **Phase 6** | Risk Scoring and Prediction Interface | **VERIFIED** | Yes (Approved) |
| **Phase 7** | Streamlit Dashboard | **VERIFIED** | Awaiting Approval to proceed to Phase 8 |
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

### Phase 5 — Model Comparison and Selection
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicitly received.
- Evaluated Logistic Regression (PR-AUC 0.7175), Random Forest (PR-AUC 0.8462), and XGBoost (PR-AUC 0.8253).
- Selected **Random Forest (Balanced)** as champion: 97.7% reduction in false alarms (32 FP vs 1,388 FP) and strong 84.69% recall. Saved to `models/best_model.joblib`.

---

### Phase 6 — Risk Scoring and Prediction Interface
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Implemented `src/risk_engine.py`:
  - `RiskThresholds`: Centralized, immutable dataclass configuring decision boundaries (Low < 0.30, Medium 0.30–0.69, High >= 0.70).
  - `validate_probability()`: Strict validation ensuring probabilities are finite, numeric, and reside in [0.0, 1.0].
  - `calculate_risk_score()`: Converts probability into a 0–100 integer score using standard rounding: `round(prob * 100)`.
  - `determine_risk_category()`: Classifies transactions into "Low Risk", "Medium Risk", or "High Risk".
  - `get_operational_recommendation()`: Generates policy recommendations (Automated Approval, Step-Up Verification, or Immediate Interception).
  - `assess_risk()`: Complete standardized risk payload with audit metadata.
- Implemented `src/predict.py`:
  - `validate_inference_features()`: Defensive validation for inference data (dict, Series, DataFrame). Reorders shuffled columns into canonical order, rejects missing columns, and rejects non-numeric/null/infinite values without silent zero-imputation.
  - `FraudPredictor`: Production inference engine with cached model loading (`models/best_model.joblib`), avoiding repeated model deserialization.
  - `predict_single()`: Predicts single transaction with full structured risk response.
  - `predict_batch()`: Predicts batches of transactions preserving exact DataFrame row alignment and index labels.
- Implemented unit test suites:
  - `tests/test_risk_engine.py`: 7 tests covering valid probabilities, boundary cases (0.0, 0.299, 0.30, 0.699, 0.70, 1.0), invalid ranges, non-finite values, custom thresholds, and payload schemas.
  - `tests/test_predictions.py`: 10 tests covering dict/Series/DataFrame inference inputs, column realignment, missing feature rejection, null/inf rejection, missing model handling, batch alignment, and index preservation.
- Executed full test suite via `pytest` (51 passed in 9.81s, 100% pass rate).
- Verified live predictions on sample transactions from the real dataset:
  - Known legitimate transaction: prob = 0.0176, score = 2, "Low Risk", recommendation: "Automated Approval".
  - Known fraudulent transaction: prob = 0.8396, score = 84, "High Risk", recommendation: "Immediate Interception".

#### 2. Prediction Output Contract & Schema
```json
{
  "fraud_probability": 0.8396,
  "risk_score": 84,
  "risk_category": "High Risk",
  "operational_recommendation": "Immediate Interception: Severe fraud risk. Hold/decline transaction and alert cardholder.",
  "model_name": "RandomForestClassifier",
  "threshold_configuration": {
    "low_threshold": 0.3,
    "high_threshold": 0.7
  },
  "transaction_summary": {
    "Time": 406.0,
    "Amount": 0.0
  },
  "regulatory_disclaimer": "Educational portfolio demonstration score. Not a certified banking decision engine."
}
```

#### 3. Threshold Configuration & Behavior
- **Low Risk Tier ($p < 0.30$)**: Score 0–29. Standard transaction approval.
- **Medium Risk Tier ($0.30 \le p < 0.70$)**: Score 30–69. Step-up authentication / secondary fraud analyst review.
- **High Risk Tier ($p \ge 0.70$)**: Score 70–100. Immediate hold or block on card activity.
- *Rounding Rule*: $S = \text{int}(\text{round}(P \times 100))$, bounded in $[0, 100]$.

#### 4. Files Created / Modified
- `src/risk_engine.py`: Risk scoring and threshold classification module.
- `src/predict.py`: Inference engine for single and batch predictions.
- `src/config.py`: Added `BEST_MODEL_PATH` constant.
- `tests/test_risk_engine.py`: 7 unit tests for risk engine.
- `tests/test_predictions.py`: 10 unit tests for prediction interface.
- `PROJECT_PROGRESS.md`: Phase 6 marked VERIFIED.

#### 5. Automated Tests Run & Results
- Total Tests: 51 (4 config + 9 validation + 9 preprocessing + 12 training + 7 risk engine + 10 prediction)
- `tests/test_risk_engine.py` (7 tests) -> **ALL PASSED**
- `tests/test_predictions.py` (10 tests) -> **ALL PASSED**
- Result: **51 passed, 0 failed in 9.81s (100% pass rate)**.

#### 6. Phase 6 Acceptance Checklist
- [x] Verified Phase 5 champion model artifact `models/best_model.joblib` exists and loads cleanly.
- [x] Implemented `src/risk_engine.py` with probability validation and 0–100 risk scoring.
- [x] Implemented configurable decision thresholds (Low < 0.30, Medium 0.30–0.69, High >= 0.70).
- [x] Implemented `src/predict.py` supporting single and batch inference with schema validation.
- [x] Verified row-to-prediction alignment and index preservation in batch predictions.
- [x] Prohibited silent default imputation for missing transaction features.
- [x] Included regulatory disclaimer in all prediction responses.
- [x] Implemented 17 automated unit tests across `tests/test_risk_engine.py` and `tests/test_predictions.py` (51/51 total tests pass).
- [x] Verified live prediction behavior on real transactions from the dataset.
- [x] Phase 6 status marked **VERIFIED**.
- [x] Explicit user approval received to proceed to Phase 7.

### Phase 7 — Streamlit Fraud Detection Dashboard
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicit user prompt received to implement Phase 7.

#### 1. Key Technical Accomplishments
- **Professional Fintech Design**: Implemented modern dark slate surface aesthetics (`#0F172A`, `#1E293B`, `#334155`), blue accent palette (`#0284C7`), accessible risk badges (Green/Emerald for Low, Amber for Medium, Crimson for High), and responsive 4-column metric layouts.
- **Full Model & Engine Integration**: Safely integrated with cached `FraudPredictor` and `RiskThresholds` without redundant retraining or artifact reloading on Streamlit script reruns (`@st.cache_resource`, `@st.cache_data`).
- **6 Core Dashboard Sections**:
  1. **Executive Overview**: Verified benchmark stats from `reports/model_comparison.json`, test volume (56,962), fraud catch rate (84.7%), precision (72.2%), PR-AUC (0.8462), test set confusion matrix table, and operational action distribution bar chart.
  2. **Single Transaction Scoring**: Form capturing all 30 canonical features (`Time`, `V1`–`V28`, `Amount`) in strict pipeline order, quick-fill presets for verified real legitimate and fraudulent transactions, real-time risk score, probability, risk category, and operational recommendation.
  3. **Batch CSV Analysis**: File uploader with strict column schema validation, high-throughput scoring preserving row index alignment, risk tier filtering, and downloadable enriched CSV output.
  4. **Model Performance & Benchmarks**: Matrix comparing Logistic Regression, Random Forest, and XGBoost, Precision-Recall curves from `reports/precision_recall_curves.png`, and architectural trade-off narrative.
  5. **Transaction Explorer**: Interactive browsing of historical dataset transactions with Class filtering, amount range filtering, and real-time model scoring.
  6. **Governance & Limitations**: Model card details, dataset provenance, probability calibration explanation (tree vote proportions under class balancing), and banking regulatory disclaimer.
- **Sample Batch Dataset**: Provided verified 10-row CSV in `data/sample_batch_transactions.csv` for zero-friction user testing.

#### 2. Artifacts Created & Modified
- `app.py`: Production-grade Streamlit application (718 lines).
- `data/sample_batch_transactions.csv`: Valid 10-row batch test file with all 30 features.
- `requirements.txt`: Added pinned `streamlit==1.66.0` and dependencies.
- `tests/test_dashboard.py`: 5 unit and AppTest verification tests.
- `README.md`: Documented dashboard launch commands, supported CSV format, and feature descriptions.
- `PROJECT_PROGRESS.md`: Phase 7 marked VERIFIED.

#### 3. Automated Tests Run & Results
- Total Tests: 56 (4 config + 9 validation + 9 preprocessing + 12 training + 7 risk engine + 10 prediction + 5 dashboard)
- `tests/test_dashboard.py` (5 tests) -> **ALL PASSED**
- Result: **56 passed, 0 failed in 11.66s (100% pass rate)**.

#### 4. Phase 7 Acceptance Checklist
- [x] Verified Phase 6 prediction engine and champion model artifacts load safely.
- [x] Implemented polished, fintech dark-slate themed Streamlit dashboard in `app.py`.
- [x] Implemented Executive Overview with real test metrics and confusion matrix from reports.
- [x] Implemented Single Transaction Scoring with quick-fill real presets and manual 30-feature inputs.
- [x] Implemented Batch CSV Analysis with schema validation, filtering, and enriched CSV export.
- [x] Implemented Model Performance & Benchmarks section with PR curve artifacts and comparison matrix.
- [x] Implemented Transaction Explorer with ground truth filtering and live model scoring.
- [x] Implemented Governance & Limitations section with probability calibration notice and banking disclaimer.
- [x] Implemented automated dashboard tests via Streamlit `AppTest` (56/56 total tests pass).
- [x] Verified zero regressions across all previous phase test suites.
- [x] Phase 7 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 8.

