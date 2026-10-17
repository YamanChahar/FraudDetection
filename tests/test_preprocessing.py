"""Unit tests for preprocessing, stratified splitting, scaling, and leakage prevention."""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src import config
from src.data_validation import DatasetValidationError
from src.preprocessing import (
    build_preprocessor,
    create_stratified_split,
    fit_preprocessor,
    get_split_summary,
    load_preprocessor,
    prepare_features_and_target,
    save_preprocessor,
    transform_features,
    verify_leakage_protection,
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


def test_prepare_features_and_target_success():
    """Verify clean separation of features X and target y with canonical ordering."""
    df = _make_dummy_dataset(50, fraud_count=5)
    X, y = prepare_features_and_target(df)

    assert isinstance(X, pd.DataFrame)
    assert isinstance(y, pd.Series)
    assert X.shape == (50, 30)
    assert len(y) == 50
    assert list(X.columns) == config.FEATURE_COLUMNS
    assert y.name == "Class"
    assert set(y.unique()) == {0, 1}


def test_prepare_features_and_target_raises_on_invalid_target():
    """Verify that non-binary target raises DatasetValidationError."""
    df = _make_dummy_dataset(50, fraud_count=5)
    df.loc[0, "Class"] = 99
    with pytest.raises(DatasetValidationError) as exc_info:
        prepare_features_and_target(df)
    assert "contains invalid values" in str(exc_info.value)


def test_create_stratified_split_disjoint_indices():
    """Verify that train and test indices have zero overlap."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    X_train, X_test, y_train, y_test = create_stratified_split(X, y, test_size=0.20, random_state=42)

    assert len(X_train) == 80
    assert len(X_test) == 20
    assert set(X_train.index).isdisjoint(set(X_test.index))
    assert len(set(X_train.index).union(set(X_test.index))) == 100


def test_create_stratified_split_preserves_stratification():
    """Verify that class proportions are preserved in both partitions."""
    df = _make_dummy_dataset(100, fraud_count=10)  # 10% fraud
    X, y = prepare_features_and_target(df)
    X_train, X_test, y_train, y_test = create_stratified_split(X, y, test_size=0.20, random_state=42)

    # 10 frauds total: 8 in train (8/80 = 10%), 2 in test (2/20 = 10%)
    assert (y_train == 1).sum() == 8
    assert (y_test == 1).sum() == 2
    assert (y_train == 0).sum() == 72
    assert (y_test == 0).sum() == 18


def test_create_stratified_split_reproducibility():
    """Verify that identical random seeds produce identical partitions."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    X_tr1, X_te1, y_tr1, y_te1 = create_stratified_split(X, y, random_state=123)
    X_tr2, X_te2, y_tr2, y_te2 = create_stratified_split(X, y, random_state=123)

    pd.testing.assert_frame_equal(X_tr1, X_tr2)
    pd.testing.assert_frame_equal(X_te1, X_te2)
    pd.testing.assert_series_equal(y_tr1, y_tr2)
    pd.testing.assert_series_equal(y_te1, y_te2)


def test_get_split_summary():
    """Verify audit dictionary accurately reflects partition statistics."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    X_train, X_test, y_train, y_test = create_stratified_split(X, y, test_size=0.20, random_state=42)
    summary = get_split_summary(X_train, X_test, y_train, y_test)

    assert summary["total_samples"] == 100
    assert summary["train"]["rows"] == 80
    assert summary["train"]["fraudulent_count"] == 8
    assert summary["train"]["fraudulent_percentage"] == 10.0
    assert summary["test"]["rows"] == 20
    assert summary["test"]["fraudulent_count"] == 2
    assert summary["test"]["fraudulent_percentage"] == 10.0
    assert summary["disjoint_index_verified"] is True


def test_scaling_preserves_canonical_columns_and_passthrough():
    """Verify that ColumnTransformer scales Time & Amount and passes V1-V28 unchanged."""
    df = _make_dummy_dataset(50, fraud_count=5)
    X, y = prepare_features_and_target(df)
    X_train, X_test, _, _ = create_stratified_split(X, y, test_size=0.20, random_state=42)

    preprocessor = build_preprocessor(scaler_type="robust")
    fitted = fit_preprocessor(preprocessor, X_train)
    X_train_trans = transform_features(fitted, X_train)
    X_test_trans = transform_features(fitted, X_test)

    # Column ordering must match canonical order exactly
    assert list(X_train_trans.columns) == config.FEATURE_COLUMNS
    assert list(X_test_trans.columns) == config.FEATURE_COLUMNS

    # PCA features must be completely unchanged by passthrough
    for pca_col in config.PCA_FEATURES:
        np.testing.assert_allclose(X_train[pca_col].values, X_train_trans[pca_col].values)
        np.testing.assert_allclose(X_test[pca_col].values, X_test_trans[pca_col].values)


def test_leakage_protection_verification():
    """Verify that scaler parameters reflect ONLY training data and not test data."""
    df = _make_dummy_dataset(100, fraud_count=10)
    X, y = prepare_features_and_target(df)
    X_train, X_test, _, _ = create_stratified_split(X, y, test_size=0.20, random_state=42)

    preprocessor = build_preprocessor(scaler_type="robust")
    fitted = fit_preprocessor(preprocessor, X_train)

    leakage_report = verify_leakage_protection(fitted, X_train, X_test)
    assert leakage_report["leakage_free"] is True
    assert leakage_report["time_center_matches_train"] is True
    assert leakage_report["time_center_matches_test"] is False
    assert leakage_report["amount_center_matches_train"] is True
    assert leakage_report["amount_center_matches_test"] is False


def test_preprocessor_serialization(tmp_path):
    """Verify that saving and loading preprocessor preserves exact transformation outputs."""
    df = _make_dummy_dataset(50, fraud_count=5)
    X, y = prepare_features_and_target(df)
    X_train, X_test, _, _ = create_stratified_split(X, y, test_size=0.20, random_state=42)

    preprocessor = build_preprocessor(scaler_type="robust")
    fitted = fit_preprocessor(preprocessor, X_train)

    save_path = tmp_path / "test_preprocessor.joblib"
    save_preprocessor(fitted, filepath=save_path)
    assert save_path.exists()

    loaded = load_preprocessor(filepath=save_path)
    trans_original = transform_features(fitted, X_test)
    trans_loaded = transform_features(loaded, X_test)

    pd.testing.assert_frame_equal(trans_original, trans_loaded)
