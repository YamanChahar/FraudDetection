"""Unit tests for the Prediction Interface (src/predict.py)."""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src import config
from src.predict import (
    FraudPredictor,
    predict_batch_transactions,
    predict_single_transaction,
    validate_inference_features,
)


def _make_dummy_transaction_dict() -> dict:
    """Helper creating a single valid transaction dictionary."""
    t = {"Time": 1000.0, "Amount": 45.50}
    for col in config.PCA_FEATURES:
        t[col] = 0.05
    return t


def _make_dummy_batch_df(n_rows: int = 5) -> pd.DataFrame:
    """Helper creating a batch of valid transactions."""
    data = []
    for i in range(n_rows):
        t = {"Time": float(i * 100), "Amount": float(10.0 + i * 5.0)}
        for col in config.PCA_FEATURES:
            t[col] = float(0.01 * i)
        data.append(t)
    # Assign custom index to verify index preservation
    custom_indices = [f"tx_{i}" for i in range(n_rows)]
    return pd.DataFrame(data, index=custom_indices)


def test_validate_inference_features_dict_and_series():
    """Verify dict and Series inputs are converted to canonical DataFrames."""
    tx_dict = _make_dummy_transaction_dict()
    df_dict = validate_inference_features(tx_dict)
    assert isinstance(df_dict, pd.DataFrame)
    assert df_dict.shape == (1, 30)
    assert list(df_dict.columns) == config.FEATURE_COLUMNS

    tx_series = pd.Series(tx_dict)
    df_series = validate_inference_features(tx_series)
    assert isinstance(df_series, pd.DataFrame)
    assert df_series.shape == (1, 30)
    assert list(df_series.columns) == config.FEATURE_COLUMNS


def test_validate_inference_features_realigns_shuffled_columns():
    """Verify that columns provided out of order are realigned to canonical order."""
    tx_dict = _make_dummy_transaction_dict()
    # Reverse column order
    reversed_keys = list(reversed(list(tx_dict.keys())))
    shuffled_dict = {k: tx_dict[k] for k in reversed_keys}
    df = validate_inference_features(shuffled_dict)

    # Must match canonical order strictly
    assert list(df.columns) == config.FEATURE_COLUMNS


def test_validate_inference_features_raises_on_missing_columns():
    """Verify ValueError is raised when required features are omitted."""
    tx_dict = _make_dummy_transaction_dict()
    del tx_dict["Amount"]
    del tx_dict["V12"]
    with pytest.raises(ValueError) as exc:
        validate_inference_features(tx_dict)
    assert "Missing required feature column(s)" in str(exc.value)
    assert "Amount" in str(exc.value)
    assert "V12" in str(exc.value)


def test_validate_inference_features_raises_on_null_and_nan():
    """Verify defensive rejection of null/NaN values."""
    tx_dict = _make_dummy_transaction_dict()
    tx_dict["V5"] = np.nan
    with pytest.raises(ValueError) as exc:
        validate_inference_features(tx_dict)
    assert "contains missing/null values" in str(exc.value)


def test_validate_inference_features_raises_on_infinite_values():
    """Verify defensive rejection of infinite values."""
    tx_dict = _make_dummy_transaction_dict()
    tx_dict["Amount"] = np.inf
    with pytest.raises(ValueError) as exc:
        validate_inference_features(tx_dict)
    assert "contain infinite values" in str(exc.value)


def test_validate_inference_features_raises_on_non_numeric():
    """Verify rejection of unparseable non-numeric values."""
    tx_dict = _make_dummy_transaction_dict()
    tx_dict["V1"] = "invalid_string"
    with pytest.raises(ValueError) as exc:
        validate_inference_features(tx_dict)
    assert "contains non-numeric values" in str(exc.value)


def test_fraud_predictor_missing_model_raises_filenotfound(tmp_path):
    """Verify FileNotFoundError if model artifact does not exist."""
    missing_path = tmp_path / "non_existent_model.joblib"
    with pytest.raises(FileNotFoundError) as exc:
        FraudPredictor(model_path=missing_path)
    assert "Model artifact not found" in str(exc.value)


def test_predict_single_transaction_contract():
    """Verify output contract and schema for a single transaction scoring."""
    tx = _make_dummy_transaction_dict()
    result = predict_single_transaction(tx)

    assert "fraud_probability" in result
    assert "risk_score" in result
    assert "risk_category" in result
    assert "operational_recommendation" in result
    assert "model_name" in result
    assert "threshold_configuration" in result
    assert "regulatory_disclaimer" in result

    assert 0.0 <= result["fraud_probability"] <= 1.0
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_category"] in {"Low Risk", "Medium Risk", "High Risk"}


def test_predict_batch_transactions_alignment_and_index():
    """Verify batch predictions preserve exact row count, index alignment, and output bounds."""
    batch_df = _make_dummy_batch_df(7)
    results_df = predict_batch_transactions(batch_df)

    assert len(results_df) == 7
    # Index alignment check
    assert list(results_df.index) == list(batch_df.index)

    expected_cols = [
        "fraud_probability",
        "risk_score",
        "risk_category",
        "operational_recommendation",
    ]
    assert list(results_df.columns) == expected_cols

    assert results_df["fraud_probability"].between(0.0, 1.0).all()
    assert results_df["risk_score"].between(0, 100).all()
    assert results_df["risk_category"].isin({"Low Risk", "Medium Risk", "High Risk"}).all()


def test_predict_batch_with_input_features_included():
    """Verify include_input_features prepends the original 30 features."""
    batch_df = _make_dummy_batch_df(3)
    merged_df = predict_batch_transactions(batch_df, include_input_features=True)

    assert len(merged_df) == 3
    assert merged_df.shape[1] == 34  # 30 features + 4 prediction columns
    assert list(merged_df.index) == list(batch_df.index)
    assert "Amount" in merged_df.columns
    assert "risk_score" in merged_df.columns
