"""Unit and integration tests for the Streamlit Fraud Detection Dashboard."""

from __future__ import annotations

import json
from pathlib import Path
import pandas as pd
import pytest
from streamlit.testing.v1 import AppTest

from src import config
from src.predict import FraudPredictor
from src.risk_engine import RiskThresholds

APP_PATH = str(config.PROJECT_ROOT / "app.py")


def test_dashboard_apptest_default_view():
    """Verify that app.py runs without exceptions in its default state."""
    at = AppTest.from_file(APP_PATH, default_timeout=30)
    at.run()
    assert not at.exception
    # Ensure title exists
    assert len(at.title) > 0


def test_dashboard_model_loader():
    """Verify that the model loader loads the champion predictor."""
    predictor = FraudPredictor(config.BEST_MODEL_PATH)
    assert predictor is not None
    assert "RandomForest" in predictor.model_name or "Classifier" in predictor.model_name


def test_dashboard_comparison_report_structure():
    """Verify that the model comparison report exists and contains required keys."""
    report_path = config.REPORTS_DIR / "model_comparison.json"
    assert report_path.exists(), f"Missing report at {report_path}"
    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "models" in data
    assert "selected_model" in data
    assert "random_forest" in data["models"]
    rf_metrics = data["models"]["random_forest"]["metrics"]
    assert "average_precision_pr_auc" in rf_metrics
    assert "recall" in rf_metrics
    assert "precision" in rf_metrics


def test_dashboard_sample_batch_csv_validity():
    """Verify that the bundled sample batch CSV is valid and scores successfully."""
    sample_csv_path = config.DATA_DIR / "sample_batch_transactions.csv"
    assert sample_csv_path.exists()
    df = pd.read_csv(sample_csv_path)
    assert len(df) == 10
    for col in config.FEATURE_COLUMNS:
        assert col in df.columns

    predictor = FraudPredictor(config.BEST_MODEL_PATH)
    results = predictor.predict_batch(df, include_input_features=True)
    assert len(results) == 10
    assert "fraud_probability" in results.columns
    assert "risk_score" in results.columns
    assert "risk_category" in results.columns
    assert set(results["risk_category"].unique()).issubset({"Low Risk", "Medium Risk", "High Risk"})


def test_dashboard_apptest_navigation():
    """Verify that navigating to different sections runs cleanly."""
    at = AppTest.from_file(APP_PATH, default_timeout=30)
    at.run()
    assert not at.exception

    # Test navigating to Governance & Limitations
    at.sidebar.radio[0].set_value("ℹ️ Governance & Limitations").run()
    assert not at.exception
    assert any("Governance" in title.value for title in at.title)

    # Test navigating to Model Performance & Benchmarks
    at.sidebar.radio[0].set_value("📈 Model Performance & Benchmarks").run()
    assert not at.exception
    assert any("Model Performance" in title.value for title in at.title)
