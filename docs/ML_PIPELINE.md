# TRACE — Machine Learning Pipeline & Explainability Architecture

TRACE uses an end-to-end Python machine learning pipeline that scales transaction signals, computes statistical fraud probabilities, assigns normalized risk scores, and calculates exact SHAP feature attributions.

---

## 1. Feature Space & Preprocessing

The model operates on a standard 30-feature transactional representation matching the European credit card benchmark structure:

- **Time:** Elapsed seconds relative to initial transaction in epoch.
- **V1 through V28:** Numerical principal components extracted via PCA to preserve cardholder privacy.
- **Amount:** Transaction monetary magnitude.

### Feature Order Integrity
```
FEATURE_NAMES = ["Time", "V1", "V2", ..., "V28", "Amount"]  (Total: 30 features)
```

The scikit-learn `ColumnTransformer` applies `RobustScaler` to `Time` and `Amount` while passing through `V1`–`V28` without disturbing column order:

```python
ColumnTransformer(
    transformers=[
        ("time_scaler", RobustScaler(), ["Time"]),
        ("pca_pass", "passthrough", [f"V{i}" for i in range(1, 29)]),
        ("amount_scaler", RobustScaler(), ["Amount"]),
    ],
    remainder="drop",
    verbose_feature_names_out=False,
)
```

This guarantees 1-to-1 index alignment with SHAP feature explainers.

---

## 2. Model Training & Evaluation Methodology

### Class Imbalance Handling
Credit card fraud typically accounts for <1% of transactions. The TRACE pipeline handles severe class imbalance via:
1. **Class-Weighted Objective:** Logistic Regression (`class_weight="balanced"`) and Random Forest (`class_weight="balanced"`).
2. **Scale Pos Weight:** XGBoost scales gradient updates proportionally (`scale_pos_weight = N_legit / N_fraud`).
3. **Stratified Split:** 75% train / 25% test stratified by class.

### Evaluation Metrics on Held-Out Test Set (1,250 samples, 37 fraud cases)

| Candidate Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | False Positives | False Negatives |
|---|---|---|---|---|---|---|---|
| **Logistic Regression (Champion)** | `0.5968` | `1.0000` | `0.7475` | `0.9995` | **`0.9880`** | `25` | `0` |
| **Random Forest** | `1.0000` | `0.8378` | `0.9118` | `0.9996` | `0.9869` | `0` | `6` |
| **XGBoost Classifier** | `0.8718` | `0.9189` | `0.8947` | `0.9986` | `0.9678` | `5` | `3` |

### Champion Model Selection Criterion
In fraud risk detection, false negatives (missed fraud) carry severe financial and legal liabilities compared to false positives (temporary step-up verification). Logistic Regression was selected as the champion due to highest PR-AUC (`0.9880`) and **zero false negatives** on held-out test data.

---

## 3. Probability vs. Risk Score Distinction

- **Fraud Probability ($p \in [0.0, 1.0]$):** Raw output of `model.predict_proba(X)[:, 1]`.
- **Risk Score ($S \in [0, 100]$):** Scaled, clamped integer risk rating:
  $$S = \max(0, \min(100, \text{round}(p \times 100)))$$
- **Risk Levels:**
  - `LOW`: $0 \le S \le 30$ (Auto-approve)
  - `MEDIUM`: $31 \le S \le 70$ (Step-up authentication)
  - `HIGH`: $71 \le S \le 89$ (Analyst queue hold)
  - `CRITICAL`: $90 \le S \le 100$ (Immediate payment block)

---

## 4. True SHAP Explainability Engine

TRACE implements true Shapley additive explanations via the `shap` Python library.

### Explainer Selection
- For tree-based models: `shap.TreeExplainer(model)`
- For linear models: `shap.LinearExplainer(model, background_data)`

### Directional Factor Interpretation
For each feature $i$ with SHAP value $\phi_i$:
- $\phi_i > 0 \implies \text{INCREASES\_RISK}$ (pushes score toward fraud)
- $\phi_i \le 0 \implies \text{DECREASES\_RISK}$ (pushes score toward legitimate baseline)

### Legal Attribution Principle
Every inference payload includes the explicit compliance disclaimer:
> *"SHAP values represent statistical attribution estimates from the trained risk model and do not constitute proof of fraud."*

Human determinations are independently recorded in `InvestigationRecord` models by authorized investigators.
