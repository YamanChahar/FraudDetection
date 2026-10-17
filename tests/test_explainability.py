"""Unit tests for model explainability with SHAP (Phase 8)."""

from __future__ import annotations

import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import pytest

from src import config
from src.explainability import FraudExplainer


@pytest.fixture(scope="module")
def explainer() -> FraudExplainer:
    """Fixture providing an initialized FraudExplainer instance."""
    return FraudExplainer(config.BEST_MODEL_PATH)


@pytest.fixture
def sample_tx() -> pd.DataFrame:
    """Fixture providing a valid 1-row transaction DataFrame."""
    sample_path = config.DATA_DIR / "sample_batch_transactions.csv"
    if sample_path.exists():
        df = pd.read_csv(sample_path)
        return df.iloc[[0]]
    # Fallback synthetic row with all 30 features
    data = {"Time": 100.0, **{f"V{i}": 0.0 for i in range(1, 29)}, "Amount": 50.0}
    return pd.DataFrame([data])


def test_explainer_initialization(explainer: FraudExplainer):
    """Verify explainer initializes with correct steps, model, and base value."""
    assert explainer.pipeline is not None
    assert explainer.preprocessor is not None
    assert explainer.classifier is not None
    assert explainer.feature_names == config.FEATURE_COLUMNS
    assert 0.0 <= explainer.base_value <= 1.0


def test_explainer_raises_on_missing_model():
    """Verify explainer raises FileNotFoundError when model path is missing."""
    with pytest.raises(FileNotFoundError):
        FraudExplainer(Path("models/nonexistent_model.joblib"))


def test_explain_instance_payload_contract(explainer: FraudExplainer, sample_tx: pd.DataFrame):
    """Verify contract and keys returned by explain_instance."""
    res = explainer.explain_instance(sample_tx)

    expected_keys = {
        "base_value",
        "predicted_probability",
        "sum_shap_values",
        "contributions",
        "top_risk_increasing",
        "top_risk_decreasing",
        "feature_names",
        "shap_values",
        "raw_features",
        "explained_class",
        "output_scale",
    }
    assert expected_keys.issubset(res.keys())
    assert res["explained_class"] == "Fraudulent (Class = 1)"
    assert res["output_scale"] == "probability"
    assert len(res["shap_values"]) == len(config.FEATURE_COLUMNS)
    assert len(res["contributions"]) == len(config.FEATURE_COLUMNS)


def test_explain_instance_efficiency_identity(explainer: FraudExplainer, sample_tx: pd.DataFrame):
    """Verify SHAP additive efficiency property: base_value + sum(shap) == predicted_proba."""
    res = explainer.explain_instance(sample_tx)
    base_val = res["base_value"]
    sum_shap = res["sum_shap_values"]
    pred_prob = res["predicted_probability"]

    assert np.isclose(base_val + sum_shap, pred_prob, atol=1e-5)


def test_top_risk_drivers_direction(explainer: FraudExplainer, sample_tx: pd.DataFrame):
    """Verify positive and negative contributors are partitioned correctly."""
    res = explainer.explain_instance(sample_tx)

    for item in res["top_risk_increasing"]:
        assert item["shap_value"] > 0
        assert item["direction"] == "Increases Risk"

    for item in res["top_risk_decreasing"]:
        assert item["shap_value"] < 0
        assert item["direction"] == "Reduces Risk"


def test_explain_instance_raises_on_multiple_rows(explainer: FraudExplainer):
    """Verify explain_instance raises ValueError if passed multiple rows."""
    multi_df = pd.DataFrame([
        {"Time": 1.0, **{f"V{i}": 0.0 for i in range(1, 29)}, "Amount": 10.0},
        {"Time": 2.0, **{f"V{i}": 0.0 for i in range(1, 29)}, "Amount": 20.0},
    ])
    with pytest.raises(ValueError, match="expects exactly 1 transaction"):
        explainer.explain_instance(multi_df)


def test_plot_local_contributions_returns_figure(explainer: FraudExplainer, sample_tx: pd.DataFrame):
    """Verify plot_local_contributions produces a valid matplotlib Figure."""
    res = explainer.explain_instance(sample_tx)
    fig = explainer.plot_local_contributions(res, max_display=8)

    assert isinstance(fig, plt.Figure)
    plt.close(fig)


def test_compute_global_importance(explainer: FraudExplainer):
    """Verify global importance calculation produces valid ranking on sample."""
    sample_path = config.DATA_DIR / "sample_batch_transactions.csv"
    assert sample_path.exists()
    sample_df = pd.read_csv(sample_path)

    df_imp = explainer.compute_global_importance(sample_df, max_samples=10)
    assert len(df_imp) == len(config.FEATURE_COLUMNS)
    assert set(df_imp.columns) == {"feature", "mean_abs_shap", "relative_importance", "rank"}
    assert (df_imp["mean_abs_shap"] >= 0).all()
    # Check sorted descending
    assert df_imp["mean_abs_shap"].is_monotonic_decreasing
