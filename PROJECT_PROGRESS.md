# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 8 Complete & Verified — Awaiting Approval for Phase 9

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
| **Phase 7** | Streamlit Dashboard | **VERIFIED** | Yes (Approved) |
| **Phase 8** | Explainability (SHAP) | **VERIFIED** | Awaiting Approval to proceed to Phase 9 |
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
- [x] Explicit user approval received to proceed to Phase 8.

### Phase 8 — Model Explainability with SHAP
- **Status**: **VERIFIED** | Date: 2026-10-17 | Approval: Explicit user prompt received to implement Phase 8.

#### 1. Key Technical Accomplishments
- **SHAP Integration & Explainer Selection**: Installed `shap==0.54.1` on Python 3.13.1. Wrapped the fitted champion pipeline (`RobustScaler` + `RandomForestClassifier`) using `shap.TreeExplainer`.
- **Output Scale & Mathematical Efficiency**:
  - Explanations are computed on the **probability scale** for Class 1 (Fraudulent).
  - Verified exact additive efficiency property: $\text{Base Prior} + \sum_{j=1}^{30} \phi_j = \hat{P}(\text{Fraud} = 1)$ down to machine precision ($\max |\Delta| < 10^{-15}$).
  - Positive SHAP contributions ($\phi_j > 0$) directly shift predicted fraud probability upward (increasing risk).
  - Negative SHAP contributions ($\phi_j < 0$) directly shift predicted fraud probability downward (reducing risk toward benign).
- **Global Feature Importance**:
  - Evaluated on a representative 498-sample test cohort (including 98 confirmed frauds).
  - Derived mean absolute SHAP value $|\phi_j|$ per feature:
    1. `V14` (mean $|\phi| = 0.0866$, 15.9% relative share)
    2. `V12` (mean $|\phi| = 0.0699$, 12.8% relative share)
    3. `V4` (mean $|\phi| = 0.0609$, 11.1% relative share)
    4. `V10` (mean $|\phi| = 0.0563$, 10.3% relative share)
    5. `V17` (mean $|\phi| = 0.0440$, 8.1% relative share)
  - Results perfectly corroborate findings from Phase 1 EDA and tree splits from Phase 5.
  - Generated and persisted `reports/shap_global_summary.png` (high-contrast beeswarm plot) and `reports/shap_feature_importance.json`.
- **Local Transaction Attribution & Visualization**:
  - Implemented `explain_instance()` in `src/explainability.py` returning base value, predicted probability, full ranked contributions, and top positive/negative drivers.
  - Implemented `plot_local_contributions()` generating fintech dark-themed horizontal contribution bar charts (Crimson `#EF4444` for risk increases, Emerald `#10B981` for risk decreases).
- **Streamlit Dashboard Integration**:
  - Added dedicated `"🔬 Explainability (SHAP)"` section in `app.py`.
  - Added in-context SHAP feature attribution expander inside Single Transaction Scoring for real-time decision inspection.
  - Set thread-safe headless Matplotlib backend (`matplotlib.use("Agg")`) to avoid GUI thread warnings.
- **Auditing & Governance Boundaries**: Explicitly documented that anonymized PCA features `V1`–`V28` reflect statistical correlation within model decision boundaries, not physical causation, merchant semantics, or cardholder intent.

#### 2. Artifacts Created & Modified
- `src/explainability.py`: Complete `FraudExplainer` class with `TreeExplainer`, local & global attribution, and plotting utilities.
- `reports/shap_global_summary.png`: Beeswarm summary plot over 498 representative transactions.
- `reports/shap_feature_importance.json`: Machine-readable ranked feature importances.
- `tests/test_explainability.py`: 8 unit tests covering explainer initialization, dimension checks, efficiency identity, positive/negative partitioning, and plotting.
- `app.py`: Integrated dedicated SHAP explainability section and inline single-transaction attribution expander.
- `tests/test_dashboard.py`: Updated AppTest navigation to verify SHAP section rendering.
- `requirements.txt`: Added pinned `shap==0.54.1`, `slicer==0.0.8`, `tqdm>=4.27.0`.
- `README.md`: Added explainability section documentation.
- `PROJECT_PROGRESS.md`: Phase 8 marked VERIFIED.

#### 3. Automated Tests Run & Results
- Total Tests: 64 (4 config + 9 validation + 9 preprocessing + 12 training + 7 risk engine + 10 prediction + 5 dashboard + 8 explainability)
- `tests/test_explainability.py` (8 tests) -> **ALL PASSED**
- Result: **64 passed, 0 failed in 27.52s (100% pass rate)**.

#### 4. Phase 8 Acceptance Checklist
- [x] Verified selected model artifact `models/best_model.joblib` exists and is compatible with `TreeExplainer`.
- [x] Installed and pinned `shap==0.54.1` without breaking dependencies.
- [x] Implemented `src/explainability.py` supporting global and local SHAP explanations.
- [x] Verified explanation dimensions, feature ordering preservation, and mathematical efficiency identity.
- [x] Generated and saved global summary plot and machine-readable feature importance report.
- [x] Integrated dedicated Explainability tab and inline single-transaction attribution into Streamlit.
- [x] Added non-causal interpretability and PCA anonymization governance notices.
- [x] Implemented 8 automated unit tests in `tests/test_explainability.py` (64/64 total tests pass).
- [x] Verified zero regressions across all previous phase test suites.
- [x] Phase 8 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 9.


