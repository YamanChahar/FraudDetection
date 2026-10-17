"""Unit tests for model training, pipeline persistence, and evaluation metrics."""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src import config
from src.evaluate import evaluate_model, evaluate_predictions, save_evaluation_report
from src.preprocessing import prepare_features_and_target
from src.train import (
    build_logistic_regression_pipeline,
    load_pipeline,
    save_pipeline,
    train_baseline_logistic_regression,
)


def _make_dummy_dataset(num_rows: int = 100, fraud_count: int = 10) -> pd.DataFrame:
    """Helper to create a deterministic synthetic dataset for isolated unit testing."""
    rng = np.random.RandomState(42)
    data = {"Time": rng.uniform(0, 172800, size=num_rows)}
    for col in config.PCA_FEATURES:
        data[col] = rng.randn(num_rows)
    data["Amount"] = rng.exponential(scale=50.0, size=num_rows)
    classes = np.zeros(num_rows, dtype=int)
    classes[:fraud_count] = 1
    rng.shuffle(classes)
    data["Class"] = classes
    return pd.DataFrame(data)


def test_build_logistic_regression_pipeline():
    """Verify that build_logistic_regression_pipeline returns an unfitted Pipeline."""
    pipeline = build_logistic_regression_pipeline()
    assert "preprocessor" in pipeline.named_steps
    assert "classifier" in pipeline.named_steps
    assert pipeline.named_steps["classifier"].class_weight == "balanced"


def test_train_baseline_logistic_regression_produces_fitted_pipeline():
    """Verify pipeline fits on training data without errors."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    pipeline = train_baseline_logistic_regression(X, y, max_iter=200)

    # Verify fitted attributes exist
    assert hasattr(pipeline.named_steps["classifier"], "coef_")
    assert pipeline.named_steps["classifier"].coef_.shape == (1, 30)


def test_pipeline_predictions_and_probabilities_validity():
    """Verify predictions and probabilities match expected domains, bounds, and lengths."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    pipeline = train_baseline_logistic_regression(X, y, max_iter=200)

    y_pred = pipeline.predict(X)
    y_prob = pipeline.predict_proba(X)

    assert len(y_pred) == 100
    assert set(y_pred).issubset({0, 1})
    assert y_prob.shape == (100, 2)
    assert np.all(y_prob >= 0.0) and np.all(y_prob <= 1.0)
    np.testing.assert_allclose(y_prob.sum(axis=1), np.ones(100))


def test_evaluate_predictions_metrics_calculation():
    """Verify metric calculations against known ground-truth and predictions."""
    y_true = np.array([0, 0, 0, 1, 1])
    y_pred = np.array([0, 0, 1, 1, 1])  # 1 false positive on sample 2
    y_prob = np.array([0.1, 0.2, 0.8, 0.9, 0.95])

    results = evaluate_predictions(y_true, y_pred, y_prob)

    cm = results["confusion_matrix"]
    assert cm["true_negatives"] == 2
    assert cm["false_positives"] == 1
    assert cm["false_negatives"] == 0
    assert cm["true_positives"] == 2

    m = results["metrics"]
    # Precision = 2 TP / (2 TP + 1 FP) = 2/3 = 0.6667
    assert m["precision"] == round(2 / 3, 4)
    # Recall = 2 TP / (2 TP + 0 FN) = 1.0
    assert m["recall"] == 1.0
    assert m["roc_auc"] == 1.0


def test_evaluate_predictions_raises_on_invalid_bounds():
    """Verify error on invalid probabilities (NaN or out-of-bounds)."""
    y_true = np.array([0, 1])
    y_pred = np.array([0, 1])
    y_prob_nan = np.array([0.1, np.nan])
    with pytest.raises(ValueError) as exc:
        evaluate_predictions(y_true, y_pred, y_prob_nan)
    assert "NaN or Infinite" in str(exc.value)

    y_prob_oob = np.array([0.1, 1.5])
    with pytest.raises(ValueError) as exc:
        evaluate_predictions(y_true, y_pred, y_prob_oob)
    assert "outside valid range" in str(exc.value)


def test_evaluate_model_end_to_end():
    """Verify evaluate_model runs against a fitted pipeline and held-out data."""
    df_train = _make_dummy_dataset(100, fraud_count=10)
    df_test = _make_dummy_dataset(50, fraud_count=5)
    X_train, y_train = prepare_features_and_target(df_train)
    X_test, y_test = prepare_features_and_target(df_test)

    pipeline = train_baseline_logistic_regression(X_train, y_train, max_iter=200)
    eval_results = evaluate_model(pipeline, X_test, y_test)

    assert "confusion_matrix" in eval_results
    assert "metrics" in eval_results
    assert eval_results["total_test_samples"] == 50


def test_save_and_load_pipeline(tmp_path):
    """Verify that saving and reloading pipeline yields identical predictions."""
    df = _make_dummy_dataset(80, fraud_count=8)
    X, y = prepare_features_and_target(df)
    pipeline = train_baseline_logistic_regression(X, y, max_iter=200)

    save_path = tmp_path / "model_test.joblib"
    save_pipeline(pipeline, filepath=save_path)
    assert save_path.exists()

    loaded = load_pipeline(filepath=save_path)
    pred_orig = pipeline.predict(X)
    pred_loaded = loaded.predict(X)
    np.testing.assert_array_equal(pred_orig, pred_loaded)


def test_save_evaluation_report(tmp_path, monkeypatch):
    """Verify report generation creates both valid JSON and Markdown files."""
    monkeypatch.setattr(config, "REPORTS_DIR", tmp_path)

    eval_results = {
        "evaluation_timestamp": "2026-10-17T12:00:00Z",
        "positive_class": "Fraudulent (Class = 1)",
        "total_test_samples": 100,
        "confusion_matrix": {"true_negatives": 90, "false_positives": 5, "false_negatives": 1, "true_positives": 4},
        "metrics": {
            "precision": 0.4444,
            "recall": 0.8,
            "f1_score": 0.5714,
            "roc_auc": 0.95,
            "average_precision_pr_auc": 0.72,
            "accuracy": 0.94,
        },
        "operational_rates": {"false_positive_rate": 0.052632, "false_negative_rate": 0.2},
    }
    metadata = {"model_name": "TestModel", "model_type": "LogisticRegression"}

    json_path, md_path = save_evaluation_report(eval_results, metadata, report_name="test_report")

    assert json_path.exists()
    assert md_path.exists()

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        assert data["model_metadata"]["model_name"] == "TestModel"

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()
        assert "# Model Evaluation Report: TestModel" in md_text


def test_build_and_train_smote_pipeline():
    """Verify that build_smote_logistic_regression_pipeline fits with SMOTE on training data only."""
    from src.train import build_smote_logistic_regression_pipeline

    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)

    smote_pipeline = build_smote_logistic_regression_pipeline(max_iter=200)
    assert "preprocessor" in smote_pipeline.named_steps
    assert "smote" in smote_pipeline.named_steps
    assert "classifier" in smote_pipeline.named_steps

    # Fit pipeline
    smote_pipeline.fit(X, y)
    assert hasattr(smote_pipeline.named_steps["classifier"], "coef_")

    # Predict on test features - verify SMOTE does not alter test dimensions
    y_pred = smote_pipeline.predict(X)
    y_prob = smote_pipeline.predict_proba(X)
    assert len(y_pred) == 100
    assert y_prob.shape == (100, 2)
    assert np.all(y_prob >= 0.0) and np.all(y_prob <= 1.0)


def test_unweighted_logistic_regression_pipeline():
    """Verify unweighted logistic regression operates with class_weight=None."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)

    unweighted_pipeline = build_logistic_regression_pipeline(class_weight=None, max_iter=200)
    assert unweighted_pipeline.named_steps["classifier"].class_weight is None

    unweighted_pipeline.fit(X, y)
    preds = unweighted_pipeline.predict(X)
    assert len(preds) == 100
