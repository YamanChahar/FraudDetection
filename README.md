# Fraud Detection & Risk Assessment System Using Machine Learning

A production-grade, portfolio-ready Machine Learning system for real-time transaction fraud probability estimation and configurable risk assessment on highly imbalanced financial data.

---

## 1. Project Overview & Motivation
Financial fraud is a critical challenge where fraudulent transactions represent a minute fraction of overall activity (< 0.2%). Standard classification algorithms optimizing for raw accuracy fail catastrophically in this scenario by classifying all transactions as legitimate, achieving 99.8% accuracy while missing 100% of fraud.

This system demonstrates:
- **Strict Data Leakage Prevention**: Pipeline-isolated transformations, stratified train/test partitioning, and training-fold-only resampling.
- **Imbalanced Learning Protocols**: Precision-Recall AUC (PR-AUC) optimization, cost-sensitive class weighting, and SMOTE evaluation.
- **Configurable Risk Scoring**: Transforming raw model probabilities into business-interpretable 0–100 risk scores with configurable decision boundaries.
- **Interactive Fintech Dashboard**: Multi-page Streamlit application supporting single transaction scoring, batch CSV processing, and model performance metrics.
- **Software Engineering Standards**: Automated unit tests (`pytest`), strict schema validation, type hinting, and modular architecture.

---

## 2. Architecture & Directory Layout

```
Fraud_Detection/
├── .streamlit/
│   └── config.toml             # Streamlit server & fintech dark theme settings
├── data/
│   ├── .gitkeep
│   ├── README.md               # Dataset download instructions
│   └── creditcard.csv          # Ignored by git; placed by user
├── models/
│   └── .gitkeep                # Serialized pipelines & models
├── notebooks/
│   └── 01_eda.ipynb            # Exploratory Data Analysis & findings
├── reports/
│   └── .gitkeep                # Metrics, confusion matrices & PR curves
├── src/
│   ├── __init__.py
│   ├── config.py               # Single source of truth for paths & schemas
│   ├── data_validation.py      # Schema and data integrity verification
│   ├── preprocessing.py        # Leakage-free preprocessing pipelines
│   ├── train.py                # Model training routines
│   ├── evaluate.py             # Evaluation metrics & report generation
│   ├── predict.py              # Single & batch inference interface
│   ├── risk_engine.py          # Probability-to-risk scoring engine
│   └── explainability.py       # SHAP TreeExplainer & attribution engine
├── tests/
│   ├── __init__.py
│   ├── test_config.py          # Configuration and path validation tests
│   ├── test_dashboard.py       # Streamlit AppTest and dashboard verification
│   ├── test_data_validation.py # Data validation tests
│   ├── test_explainability.py  # SHAP explainer & attribution tests
│   ├── test_preprocessing.py   # Leakage prevention & pipeline tests
│   ├── test_risk_engine.py     # Threshold and risk score boundary tests
│   └── test_predictions.py     # End-to-end inference verification
├── app.py                      # Interactive Streamlit dashboard
├── PROJECT_PROGRESS.md         # Authoritative progress and execution log
├── README.md                   # System documentation & setup guide
├── requirements.txt            # Pinned dependency manifest
└── .gitignore                  # Git protection rules
```

---

## 3. Setup & Installation Guide

### Prerequisites
- Python 3.10+ (Verified on Python 3.13.1)
- Git 2.20+

### Step 1: Clone and Enter the Repository
```bash
git clone <your-repository-url>
cd Fraud_Detection
```

### Step 2: Set Up Local Virtual Environment
```bash
# On Windows PowerShell:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# On macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Pinned Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Run Automated Tests
```bash
pytest tests/ -v
```

---

## 4. Dataset Contract & Obtaining the Data
This project is built on the **ULB Credit Card Fraud Detection** dataset (284,807 transactions with 492 frauds).

1. Download `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud).
2. Save the file to:
   ```
   data/creditcard.csv
   ```
3. To point to an alternative dataset location without modifying source code, set the environment variable:
   ```bash
   # Windows PowerShell:
   $env:FRAUD_DATASET_PATH="C:\path\to\your\creditcard.csv"
   ```

---

## 5. Launching the Interactive Streamlit Dashboard

Launch the fintech risk assessment dashboard:
```bash
# Using Python runner or Streamlit CLI:
streamlit run app.py
```
Or via virtual environment Python:
```bash
.\.venv\Scripts\python.exe -m streamlit run app.py
```

### Dashboard Sections
1. **Executive Overview**: Real-time KPI cards (test volume, recall, precision, PR-AUC), test confusion matrix, and operational tier breakdown.
2. **Single Transaction Scoring**: Real-time form with quick-fill presets from real dataset samples (legitimate vs. fraud), manual parameter inputs across all 30 canonical features (`Time`, `V1`–`V28`, `Amount`), threshold-driven risk scoring, and inline local SHAP attribution expander.
3. **Batch CSV Analysis**: High-throughput file upload, strict schema validation, batch risk scoring, category filtering, and exportable CSV download. A 10-row sample CSV is provided in `data/sample_batch_transactions.csv`.
4. **Model Performance & Benchmarks**: Test set evaluation matrix across Logistic Regression, Random Forest, and XGBoost, Precision-Recall curves, and architectural trade-off analysis.
5. **Model Explainability (SHAP)**: Global feature importance rankings, beeswarm summary visualization, and interactive local transaction attribution plots displaying positive/negative probability contributions.
6. **Transaction Explorer**: Interactive browsing of historical transactions filtered by ground truth label, amount ranges, and real-time model scoring.
7. **Governance & Limitations**: Model card, dataset constraints, probability calibration notes, and financial regulatory disclaimer.

---

## 6. Development Phases

- **Phase 0**: Workspace, Environment, and Repository Setup — **[VERIFIED]**
- **Phase 1**: Data Validation and Exploratory Data Analysis — **[VERIFIED]**
- **Phase 2**: Preprocessing and Experimental Design — **[VERIFIED]**
- **Phase 3**: Logistic Regression Baseline — **[VERIFIED]**
- **Phase 4**: Imbalance Handling Experiments (Class Weighting vs. SMOTE) — **[VERIFIED]**
- **Phase 5**: Model Comparison and Selection (Champion: Random Forest, PR-AUC 0.8462) — **[VERIFIED]**
- **Phase 6**: Risk Scoring Engine & Prediction Interface — **[VERIFIED]**
- **Phase 7**: Interactive Streamlit Dashboard — **[VERIFIED]**
- **Phase 8**: Model Explainability (SHAP) — **[VERIFIED]**
- **Phase 9**: Comprehensive Quality Assurance & Reliability Tests — *[Pending]*
- **Phase 10**: Deployment and Portfolio Preparation — *[Pending]*
- **Phase 11**: Final Review and Interview Readiness — *[Pending]*

Consult `PROJECT_PROGRESS.md` for real-time phase execution logs and verified metrics.

