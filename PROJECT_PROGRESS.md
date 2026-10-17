# Project Progress: Fraud Detection & Risk Assessment System

Authoritative single source of truth for project execution status, technical decisions, verified metrics, and phase milestones.

---

## Executive Summary
- **Project Name**: Fraud Detection & Risk Assessment System Using Machine Learning
- **Target Role/Domain**: Portfolio ML / Software Engineering Project (Fintech Fraud & Risk)
- **Active Environment**: Windows (PowerShell), Python 3.13.1, Git 2.55.0.windows.2
- **Virtual Environment**: `.venv` (Active and isolated)
- **Overall Status**: Phase 2 Complete & Verified — Awaiting Approval for Phase 3

---

## Phase Status Overview

| Phase | Description | Status | Approval Received |
|---|---|---|---|
| **Phase 0** | Workspace, Environment, and Repository Setup | **VERIFIED** | Yes (Approved) |
| **Phase 1** | Data Validation and Exploratory Data Analysis | **VERIFIED** | Yes (Approved) |
| **Phase 2** | Preprocessing and Experimental Design | **VERIFIED** | Awaiting Approval to proceed to Phase 3 |
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
- **Approval Received**: Explicit approval received from user.
- **Summary**: Real dataset validated (284,807 rows, 31 columns, 0 nulls). Class imbalance (0.1727% fraud, 577.88:1 ratio) verified. Duplicate records (1,081 rows) audited without mutation. `notebooks/01_eda.ipynb` executed inplace with complete charts and statistical analysis.

---

### Phase 2 — Preprocessing and Experimental Design
- **Status**: **VERIFIED**
- **Date Completed**: 2026-10-17

#### 1. Tasks Completed
- Implemented `src/preprocessing.py`:
  - `prepare_features_and_target()`: Validates input schema, rejects invalid targets/features, separates `X` (30 features) and `y` (`Class`), and preserves canonical feature ordering.
  - `create_stratified_split()`: Generates reproducible 80/20 train/test split with stratification on `y` and seed 42. Validates disjoint indices and class representation.
  - `get_split_summary()`: Generates detailed partition metrics and audit reports.
  - `build_preprocessor()`: Constructs `ColumnTransformer` with `RobustScaler` for `Time` and `Amount` while passing through `V1`–`V28` in exact canonical column order.
  - `fit_preprocessor()`: Fits transformations **only** on training features to prevent data leakage.
  - `transform_features()`: Applies fitted transformations returning a DataFrame with preserved canonical column names and original indices.
  - `verify_leakage_protection()`: Formally verifies that fitted scaler parameters match `X_train` and were not influenced by `X_test`.
  - `save_preprocessor()` and `load_preprocessor()`: Serializes and deserializes the fitted preprocessor artifact using `joblib`.
- Installed Phase 2 dependencies (`scikit-learn==1.9.1`, `scipy==1.18.1`, `joblib==1.6.0`, and dependencies) in `.venv`.
- Updated `requirements.txt` with exact pinned versions.
- Implemented comprehensive unit test suite in `tests/test_preprocessing.py` (9 tests covering schema extraction, invalid target handling, disjoint index verification, stratified proportions, seed reproducibility, canonical column order preservation, leakage protection, and serialization).
- Executed full test suite via `pytest` (22 passed in 24.93s, 100% pass rate).
- Executed preprocessing workflow on the real 284,807-row dataset and verified exact dimensions, class counts, scaling parameters, and leakage protection.

#### 2. Actual Verified Partition & Preprocessing Statistics
- **Total Dataset**: 284,807 rows, 30 features + 1 target
- **Training Set (80%)**:
  - Dimensions: **227,845 rows x 30 columns**
  - Legitimate (Class 0): **227,451** records
  - Fraudulent (Class 1): **394** records
  - Fraud Percentage: **0.1729%**
  - Imbalance Ratio: **577.29 : 1**
- **Test Set (20% - Isolated)**:
  - Dimensions: **56,962 rows x 30 columns**
  - Legitimate (Class 0): **56,864** records
  - Fraudulent (Class 1): **98** records
  - Fraud Percentage: **0.1720%**
  - Imbalance Ratio: **580.24 : 1**
- **Disjoint Index Verification**: `True` (0 overlapping rows between train and test).
- **Stratification Integrity**: Verified. Both partitions exhibit identical fraud rates (~0.172%).
- **Fitted RobustScaler Parameters (from X_train only)**:
  - `Time` Median Center: **84,805.0 seconds** (matches `X_train.median()`; not test data).
  - `Amount` Median Center: **$22.00** (matches `X_train.median()`).
- **Feature Column Order Preservation**: `True` (`[Time, V1, V2, ..., V28, Amount]`).
- **Artifact Persistence**: Saved fitted preprocessor to `models/preprocessor.joblib` (ignored by git).

#### 3. Technical Decisions & Rationale
- **Why Preprocessing is Fitted on Training Data Only (Leakage Prevention)**:
  Fitting a scaler on the entire dataset calculates global statistics (median, IQR, mean, std) that incorporate information from the test set into the training representations. This artificially inflates validation metrics and causes performance collapse in production when truly unseen transactions arrive.
- **Why RobustScaler for Time and Amount**:
  Phase 1 EDA revealed that transaction amount has extreme outliers (max $25,691 vs median $22) and high skewness. `StandardScaler` uses mean and standard deviation, which are heavily distorted by extreme values. `RobustScaler` uses the median and Interquartile Range (IQR = 75th - 25th percentile), ensuring scale robustness without clipping or discarding real transactions.
- **Why Passthrough for V1–V28**:
  Features `V1` through `V28` are outputs of PCA performed by the original data collectors, which means they are already centered around zero with comparable unit variances. Applying a second standardization would be redundant and could distort PCA coordinate relationships.
- **Why Stratified 80/20 Partitioning**:
  Because fraud represents only ~0.17% of the dataset, random unstratified splitting could result in test sets with significantly varying fraud rates, leading to unreliable performance estimates. Stratification guarantees that the test set evaluates models against the exact operational base rate.

#### 4. Files Created / Modified
- `src/preprocessing.py`: Complete leakage-free preprocessing and splitting module.
- `tests/test_preprocessing.py`: 9 unit tests for splitting, scaling, leakage protection, and persistence.
- `requirements.txt`: Updated with `scikit-learn` and `joblib` dependencies.
- `models/preprocessor.joblib`: Serialized preprocessor artifact (git-ignored).
- `PROJECT_PROGRESS.md`: Phase 2 status updated to VERIFIED with real partition statistics.

#### 5. Commands Executed & Verified Outcomes
- `.\.venv\Scripts\python.exe -m pip install scikit-learn`
  - Output: Successfully installed scikit-learn 1.9.1, scipy 1.18.1, joblib 1.6.0 (Verified).
- `.\.venv\Scripts\python.exe -m pytest tests/ -v`
  - Output: 22 passed in 24.93s (Verified).
- Execution script on real `data/creditcard.csv`:
  - Output: Verified 227,845 train rows, 56,962 test rows, disjoint indices, exact 0.172% stratification, and leakage-free scaling (Verified).

#### 6. Automated Tests Run & Results
- Total Tests: 22 (4 config + 9 data validation + 9 preprocessing)
- `tests/test_config.py` (4 tests) -> **ALL PASSED**
- `tests/test_data_validation.py` (9 tests) -> **ALL PASSED**
- `tests/test_preprocessing.py` (9 tests) -> **ALL PASSED**:
  - `test_prepare_features_and_target_success` -> **PASSED**
  - `test_prepare_features_and_target_raises_on_invalid_target` -> **PASSED**
  - `test_create_stratified_split_disjoint_indices` -> **PASSED**
  - `test_create_stratified_split_preserves_stratification` -> **PASSED**
  - `test_create_stratified_split_reproducibility` -> **PASSED**
  - `test_get_split_summary` -> **PASSED**
  - `test_scaling_preserves_canonical_columns_and_passthrough` -> **PASSED**
  - `test_leakage_protection_verification` -> **PASSED**
  - `test_preprocessor_serialization` -> **PASSED**
- Result: **22 passed, 0 failed in 24.93s (100% pass rate)**.

#### 7. Phase 2 Acceptance Checklist
- [x] Verified Phase 1 completion and confirmed real dataset availability.
- [x] Implemented schema-safe feature and target separation in `src/preprocessing.py`.
- [x] Implemented reproducible stratified splitting with seed 42 and 80/20 ratio.
- [x] Verified zero index overlap between train and test partitions (`disjoint_index_verified = True`).
- [x] Verified class stratification preserved (train: 394 frauds / 0.1729%; test: 98 frauds / 0.1720%).
- [x] Implemented `RobustScaler` for `Time` and `Amount` with passthrough for `V1`–`V28`.
- [x] Verified fitted scaler parameters derived exclusively from `X_train` without leakage.
- [x] Preserved canonical feature ordering and output dimensions across transformations.
- [x] Serialized fitted preprocessor to `models/preprocessor.joblib`.
- [x] Implemented 9 automated unit tests in `tests/test_preprocessing.py` (100% pass rate).
- [x] Phase 2 status marked **VERIFIED**.
- [ ] Explicit user approval received to proceed to Phase 3.
