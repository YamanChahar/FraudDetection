import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)
from app.core.preprocessing import (
    FEATURE_NAMES,
    NUMERICAL_COLS,
    PCA_COLS,
    build_preprocessor,
)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

def generate_benchmark_dataset(n_samples=5000, fraud_ratio=0.03, random_state=42):
    """Generates realistic synthetic credit card transactions with non-linear fraud interactions."""
    np.random.seed(random_state)
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    # Legitimate transactions: normal baseline distributions with slight variance
    time_legit = np.random.uniform(0, 172800, n_legit)
    amount_legit = np.random.exponential(scale=65.0, size=n_legit) + 1.0
    pca_legit = np.random.normal(0, 1.0, size=(n_legit, 28))

    # Fraudulent transactions: non-linear interaction vectors in V14, V12, V10, V4, V17
    time_fraud = np.random.uniform(0, 172800, n_fraud)
    amount_fraud = np.random.exponential(scale=160.0, size=n_fraud) + 15.0
    pca_fraud = np.random.normal(0, 1.15, size=(n_fraud, 28))

    # Characteristic non-linear multi-factor fraud signatures with realistic noise
    pca_fraud[:, 13] -= np.random.normal(2.4, 0.8, size=n_fraud)  # V14
    pca_fraud[:, 11] -= np.random.normal(2.1, 0.7, size=n_fraud)  # V12
    pca_fraud[:, 9] -= np.random.normal(1.9, 0.7, size=n_fraud)   # V10
    pca_fraud[:, 3] += np.random.normal(2.0, 0.8, size=n_fraud)   # V4
    pca_fraud[:, 16] -= np.random.normal(1.8, 0.8, size=n_fraud)  # V17

    X_legit = np.hstack([time_legit.reshape(-1, 1), pca_legit, amount_legit.reshape(-1, 1)])
    X_fraud = np.hstack([time_fraud.reshape(-1, 1), pca_fraud, amount_fraud.reshape(-1, 1)])

    X_all = np.vstack([X_legit, X_fraud])
    y_all = np.hstack([np.zeros(n_legit, dtype=int), np.ones(n_fraud, dtype=int)])

    # Shuffle
    indices = np.arange(len(y_all))
    np.random.shuffle(indices)

    df = pd.DataFrame(X_all[indices], columns=FEATURE_NAMES)
    return df, pd.Series(y_all[indices], name="Class")

def evaluate_model(model, X_test_trans, y_test):
    """Computes comprehensive imbalanced classification metrics."""
    y_pred = model.predict(X_test_trans)
    y_prob = model.predict_proba(X_test_trans)[:, 1]

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    pr_auc = float(average_precision_score(y_test, y_prob))

    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
    }

def train_and_select_champion():
    """Trains Logistic Regression, Random Forest, and XGBoost; benchmarks and serializes the champion."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print("[TRACE ML] Generating benchmark fraud dataset (5,000 samples)...")
    X, y = generate_benchmark_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"[TRACE ML] Train set: {len(X_train)} samples, Test set: {len(X_test)} samples (Fraud: {y_test.sum()})")

    preprocessor = build_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # 1. Baseline Logistic Regression
    print("[TRACE ML] Training Candidate 1: Logistic Regression...")
    lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    lr.fit(X_train_trans, y_train)
    lr_metrics = evaluate_model(lr, X_test_trans, y_test)
    print(f"  -> Logistic Regression PR-AUC: {lr_metrics['pr_auc']}, Recall: {lr_metrics['recall']}")

    # 2. Candidate 2: Random Forest
    print("[TRACE ML] Training Candidate 2: Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=12, class_weight="balanced", random_state=42, n_jobs=-1)
    rf.fit(X_train_trans, y_train)
    rf_metrics = evaluate_model(rf, X_test_trans, y_test)
    print(f"  -> Random Forest PR-AUC: {rf_metrics['pr_auc']}, Recall: {rf_metrics['recall']}")

    # 3. Candidate 3: XGBoost
    print("[TRACE ML] Training Candidate 3: XGBoost...")
    scale_pos = (len(y_train) - y_train.sum()) / max(y_train.sum(), 1)
    xgb = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=scale_pos,
        random_state=42,
        eval_metric="logloss",
        n_jobs=-1,
    )
    xgb.fit(X_train_trans, y_train)
    xgb_metrics = evaluate_model(xgb, X_test_trans, y_test)
    print(f"  -> XGBoost PR-AUC: {xgb_metrics['pr_auc']}, Recall: {xgb_metrics['recall']}")

    # Selection logic based on PR-AUC & F1-score for rare fraud events
    candidates = [
        {"name": "Logistic Regression", "model": lr, "metrics": lr_metrics, "algorithm": "LOGISTIC_REGRESSION"},
        {"name": "Random Forest", "model": rf, "metrics": rf_metrics, "algorithm": "RANDOM_FOREST"},
        {"name": "XGBoost Classifier", "model": xgb, "metrics": xgb_metrics, "algorithm": "XGBOOST"},
    ]

    candidates.sort(key=lambda c: (c["metrics"]["pr_auc"], c["metrics"]["f1_score"]), reverse=True)
    champion = candidates[0]
    print(f"\n[TRACE ML] Champion Model Selected: {champion['name']} (PR-AUC: {champion['metrics']['pr_auc']})")

    # Serialize Preprocessor, Champion Model & Background Data for SHAP
    artifact = {
        "model_name": champion["name"],
        "model_version": "v1.2.0-champion",
        "algorithm": champion["algorithm"],
        "preprocessor": preprocessor,
        "model": champion["model"],
        "background_data": X_train_trans[:100],  # 100 samples for fast SHAP baseline
        "feature_names": FEATURE_NAMES,
        "metrics": champion["metrics"],
        "all_candidates": [
            {"name": c["name"], "algorithm": c["algorithm"], "metrics": c["metrics"]}
            for c in candidates
        ],
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    artifact_path = MODELS_DIR / "champion_model.joblib"
    joblib.dump(artifact, artifact_path)
    print(f"[TRACE ML] Champion artifact saved to: {artifact_path}")

    # Save readable JSON metadata
    metadata_path = MODELS_DIR / "champion_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "model_name": champion["name"],
                "model_version": "v1.2.0-champion",
                "algorithm": champion["algorithm"],
                "metrics": champion["metrics"],
                "all_candidates": artifact["all_candidates"],
                "created_at": artifact["created_at"],
            },
            f,
            indent=2,
        )
    print(f"[TRACE ML] Metadata saved to: {metadata_path}")
    return artifact

if __name__ == "__main__":
    train_and_select_champion()
