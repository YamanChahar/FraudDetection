"""Model evaluation and metrics reporting module for the Fraud Detection system.

Calculates fraud-specific evaluation metrics, confusion matrices, and generates
standardized JSON and Markdown reports.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline

from src import config

logger = logging.getLogger(__name__)


def evaluate_predictions(
    y_true: Union[pd.Series, np.ndarray],
    y_pred: Union[pd.Series, np.ndarray],
    y_prob: Union[pd.Series, np.ndarray],
) -> Dict[str, Any]:
    """Compute comprehensive imbalanced classification metrics for binary fraud detection.

    Positive class is strictly defined as fraudulent transactions (Class = 1).

    Args:
        y_true: Ground-truth binary labels ({0, 1}).
        y_pred: Predicted discrete binary labels ({0, 1}).
        y_prob: Predicted probability for the positive class (fraud).

    Returns:
        Dict[str, Any]: Detailed metrics dictionary.
    """
    y_true_arr = np.asarray(y_true).astype(int)
    y_pred_arr = np.asarray(y_pred).astype(int)
    y_prob_arr = np.asarray(y_prob).astype(float)

    if len(y_true_arr) != len(y_pred_arr) or len(y_true_arr) != len(y_prob_arr):
        raise ValueError(
            f"Input dimension mismatch: y_true={len(y_true_arr)}, "
            f"y_pred={len(y_pred_arr)}, y_prob={len(y_prob_arr)}"
        )

    # Validate probabilities
    if np.any(np.isnan(y_prob_arr)) or np.any(np.isinf(y_prob_arr)):
        raise ValueError("Predicted probabilities contain NaN or Infinite values.")
    if np.any(y_prob_arr < 0.0) or np.any(y_prob_arr > 1.0):
        raise ValueError("Predicted probabilities outside valid range [0.0, 1.0].")

    # Confusion matrix breakdown
    cm = confusion_matrix(y_true_arr, y_pred_arr, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    # Core performance metrics (pos_label=1)
    precision = float(precision_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0))
    recall = float(recall_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0))
    f1 = float(f1_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0))
    roc_auc = float(roc_auc_score(y_true_arr, y_prob_arr))
    avg_precision = float(average_precision_score(y_true_arr, y_prob_arr))
    accuracy = float((tp + tn) / len(y_true_arr))

    # Full classification report dictionary
    class_report = classification_report(
        y_true_arr,
        y_pred_arr,
        labels=[0, 1],
        target_names=["Legitimate (0)", "Fraudulent (1)"],
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "positive_class": "Fraudulent (Class = 1)",
        "total_test_samples": int(len(y_true_arr)),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
        "metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "average_precision_pr_auc": round(avg_precision, 4),
            "accuracy": round(accuracy, 4),
        },
        "operational_rates": {
            "false_positive_rate": round(float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0, 6),
            "false_negative_rate": round(float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0, 6),
        },
        "classification_report": class_report,
    }
    return metrics


def evaluate_model(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Dict[str, Any]:
    """Generate predictions on held-out test data and compute full evaluation report.

    Args:
        pipeline: Fitted Pipeline.
        X_test: Held-out test feature DataFrame.
        y_test: Held-out test ground-truth labels.

    Returns:
        Dict[str, Any]: Full evaluation metrics dictionary.
    """
    y_pred = pipeline.predict(X_test)
    # Extract probability of class 1 (Fraud)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    return evaluate_predictions(y_test, y_pred, y_prob)


def save_evaluation_report(
    evaluation_results: Dict[str, Any],
    model_metadata: Dict[str, Any],
    report_name: str = "baseline_logistic_regression",
) -> Tuple[Path, Path]:
    """Persist evaluation results to disk in machine-readable JSON and human-readable Markdown.

    Args:
        evaluation_results: Metrics and confusion matrix dictionary.
        model_metadata: Experiment configuration, model parameters, and split info.
        report_name: Base filename prefix for reports.

    Returns:
        Tuple[Path, Path]: File paths to (json_report_path, markdown_report_path).
    """
    config.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    json_path = config.REPORTS_DIR / f"{report_name}.json"
    md_path = config.REPORTS_DIR / f"{report_name}.md"

    full_payload = {
        "model_metadata": model_metadata,
        "evaluation_results": evaluation_results,
    }

    # 1. Save JSON report
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, indent=2)

    # 2. Save Markdown summary report
    m = evaluation_results["metrics"]
    cm = evaluation_results["confusion_matrix"]
    ops = evaluation_results["operational_rates"]

    md_content = f"""# Model Evaluation Report: {model_metadata.get('model_name', 'Baseline Model')}

- **Execution Date**: {evaluation_results['evaluation_timestamp']}
- **Model Type**: {model_metadata.get('model_type', 'LogisticRegression')}
- **Class Weighting**: `{model_metadata.get('class_weight', 'balanced')}`
- **Random Seed**: `{model_metadata.get('random_state', config.RANDOM_STATE)}`
- **Total Test Samples**: {evaluation_results['total_test_samples']:,}

---

## 1. Primary Fraud Metrics (Positive Class = Fraud)

| Metric | Score | Financial & Operational Meaning |
|---|---|---|
| **Average Precision (PR-AUC)** | **{m['average_precision_pr_auc']}** | Precision integrated across all decision thresholds. Primary benchmark for imbalanced fraud. |
| **Recall (Sensitivity)** | **{m['recall']}** | Fraction of actual fraud caught. High recall minimizes unrecovered financial losses. |
| **Precision** | **{m['precision']}** | Fraction of fraud alerts that are actual fraud. Low precision creates investigator burnout and cardholder friction. |
| **F1-Score** | **{m['f1_score']}** | Harmonic balance between Precision and Recall at default 0.50 threshold. |
| **ROC-AUC** | **{m['roc_auc']}** | Ability to rank fraud above legitimate. Can be deceptively optimistic in high imbalance. |
| **Raw Accuracy** | **{m['accuracy']}** | Non-informative for imbalanced data (predicting all 0 gives 99.83%). |

---

## 2. Confusion Matrix

| | Predicted Legitimate (0) | Predicted Fraudulent (1) | Total Actual |
|---|---|---|---|
| **Actual Legitimate (0)** | **{cm['true_negatives']:,}** (TN) | **{cm['false_positives']:,}** (FP) | {cm['true_negatives'] + cm['false_positives']:,} |
| **Actual Fraudulent (1)** | **{cm['false_negatives']:,}** (FN) | **{cm['true_positives']:,}** (TP) | {cm['false_negatives'] + cm['true_positives']:,} |
| **Total Predicted** | {cm['true_negatives'] + cm['false_negatives']:,} | {cm['false_positives'] + cm['true_positives']:,} | {evaluation_results['total_test_samples']:,} |

### Operational Rates:
- **False Positive Rate (FPR)**: `{ops['false_positive_rate']}` ({cm['false_positives']:,} false alarms)
- **False Negative Rate (Miss Rate)**: `{ops['false_negative_rate']}` ({cm['false_negatives']:,} missed frauds)

---

## 3. Analysis & Key Takeaways

1. **Trade-off with Class Weighting**:
   By assigning balanced class weights inversely proportional to class frequencies, Logistic Regression penalizes missed frauds heavily. This successfully boosts **Recall to {m['recall']}** (catching {cm['true_positives']} of {cm['false_negatives'] + cm['true_positives']} frauds).
2. **The Cost of False Positives**:
   Because legitimate transactions outnumber frauds by ~578:1, the linear decision boundary flags **{cm['false_positives']:,} legitimate transactions** as fraud, depressing **Precision to {m['precision']}**.
3. **Phase 4 Investigation**:
   In Phase 4, we will compare this class-weighting baseline against non-weighted configurations and SMOTE oversampling within training folds to see if resampling or non-linear tree models improve the Precision-Recall frontier.
"""

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info("Saved evaluation reports to %s and %s", json_path, md_path)
    return json_path, md_path
