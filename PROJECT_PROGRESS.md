# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 1 Complete & Verified — Awaiting Approval for Phase 2

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Awaiting Approval to proceed to Phase 2 |
| **Phase 2** | Preprocessing and Experimental Design | NOT STARTED | Pending |
| **Phase 3** | Logistic Regression Baseline | NOT STARTED | Pending |
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
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17
- **Approval Received**: Explicit approval received from user.
- **Summary**: Environment initialized, Git repository setup with strict `.gitignore`, portable `src/config.py`, and baseline test suite passing.

---

### Phase 1 — Data Validation and Exploratory Data Analysis
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Dataset placed in `data/creditcard.csv` (150,828,752 bytes).
- Implemented defensive validation module `src/data_validation.py` for schema verification, missing/inf detection, non-destructive duplicate auditing, binary domain checks, and class distribution calculation.
- Automated unit test suite `tests/test_data_validation.py` passing (13/13 unit tests passed in 1.81s).
- Created `notebooks/01_eda.ipynb` containing 16 cells for deep exploratory data analysis, class imbalance math, outlier inspection, amount/time distributions, and PCA correlation analysis.
- Executed `notebooks/01_eda.ipynb` inplace with `nbconvert` on the live dataset; all charts and statistical outputs rendered successfully without unhandled errors.
- Extracted and recorded actual, non-fabricated dataset statistics directly from execution.

#### 2. Actual Verified Dataset Statistics
- **Dataset Dimensions**: 284,807 rows x 31 columns.
- **Missing / Infinite Values**: 0 nulls, 0 NaNs, 0 infinities across all columns.
- **Target Domain (`Class`)**: Strictly binary `{0, 1}`.
- **Legitimate Transactions (Class 0)**: 284,315 records (**99.8273%**).
- **Fraudulent Transactions (Class 1)**: 492 records (**0.1727%**).
- **Class Imbalance Ratio**: **577.88 : 1** (1 fraudulent transaction per ~578 legitimate transactions).
- **Duplicate Records Audited**:
  - Total Duplicates: 1,081 rows (0.3796% of dataset).
  - Class 0 (Legitimate) Duplicates: 1,062 rows.
  - Class 1 (Fraudulent) Duplicates: 19 rows.
  - *Decision*: Preserved in raw dataset without deletion (avoiding data loss and reflecting realistic transaction retry streams).
- **Transaction Amount ($) Distribution**:
  - Legitimate (Class 0): Mean = $88.29 | Median = $22.00 | 25% = $5.65 | 75% = $77.05 | Max = $25,691.16 | Std = $250.11
  - Fraudulent (Class 1): Mean = $122.21 | Median = $9.25 | 25% = $1.00 | 75% = $105.89 | Max = $2,125.87 | Std = $256.68
  - *Insight*: Fraudulent transactions have a **lower median** ($9.25) than legitimate transactions ($22.00). Fraud is not merely high-dollar purchases; micro-testing amounts ($1.00) are common.
- **Time Distribution**:
  - Range: 0.0 to 172,792.0 seconds (~47.99 hours / 2 days).
  - Temporal cyclical density observed over the 48-hour recording window.
- **Top Correlations with Class**:
  - Negative: `V17` (-0.3265), `V14` (-0.3025), `V12` (-0.2606), `V10` (-0.2169), `V16` (-0.1965)
  - Positive: `V11` (+0.1549), `V4` (+0.1334), `V2` (+0.0913), `V21` (+0.0404), `V19` (+0.0348)

#### 3. Files Created / Modified
- `src/data_validation.py`: Schema validation, missing value checking, duplicate audit, and class distribution utilities.
- `tests/test_data_validation.py`: 9 unit tests for schema, types, missing values, duplicates, and distributions.
- `notebooks/01_eda.ipynb`: Fully executed exploratory analysis notebook with rendered visualizations.
- `requirements.txt`: Pinned versions for `pandas`, `numpy`, `matplotlib`, `seaborn`, `ipykernel`, `nbconvert`, and dependencies.
- `PROJECT_PROGRESS.md`: Authoritative progress tracking updated with verified statistics.

#### 4. Automated Tests Run & Results
- Command: `.\.venv\Scripts\python.exe -m pytest tests/ -v`
- Results: 13 passed, 0 failed in 1.81s (100% pass rate).

#### 5. Technical Decisions & Architectural Takeaways for Phase 2
- **Why Accuracy Fails**: A trivial baseline predicting Class 0 achieves 99.83% accuracy but 0.0% recall, missing all $60,000+ of fraud. Optimization must prioritize **PR-AUC, Recall, and Precision**.
- **Preprocessing Protocol**: `Amount` and `Time` have wide scales and heavy outliers, requiring robust scaling (`RobustScaler`), whereas PCA features `V1`–`V28` are already zero-centered.
- **Leakage Prevention**: All transformations must be fit strictly on training splits. Stratified train/test splitting is required to prevent fold-to-fold class skew.

#### 6. Phase 1 Acceptance Checklist
- [x] Verified Phase 0 completion and confirmed clean environment state.
- [x] Dataset `data/creditcard.csv` validated (284,807 rows, 31 columns, 0 nulls).
- [x] Actual dataset statistics calculated from execution without fabrication.
- [x] Duplicate records audited and documented without mutating raw data.
- [x] Defensive validation module implemented in `src/data_validation.py`.
- [x] Unit test suite implemented in `tests/test_data_validation.py` (13/13 passed).
- [x] `notebooks/01_eda.ipynb` executed end-to-end inplace with complete visualizations.
- [x] Why accuracy is deceptive in fraud detection fully documented.
- [x] Phase 1 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 2.
