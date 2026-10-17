"""Unit tests for dataset schema validation and integrity checks."""

import numpy as np
import pandas as pd
import pytest

from src import config
from src.data_validation import (
    DatasetValidationError,
    calculate_class_distribution,
    check_dataset_exists,
    inspect_duplicates,
    validate_data_types_and_values,
    validate_schema,
)


def _make_dummy_valid_dataframe(num_rows: int = 20) -> pd.DataFrame:
    """Helper to create a small valid DataFrame conforming to the credit card schema."""
    data = {"Time": np.arange(num_rows, dtype=float)}
    for col in config.PCA_FEATURES:
        data[col] = np.random.randn(num_rows)
    data["Amount"] = np.random.exponential(scale=50.0, size=num_rows)
    # Binary class: 1 fraud, remainder legitimate
    classes = np.zeros(num_rows, dtype=int)
    classes[0] = 1
    data["Class"] = classes
    return pd.DataFrame(data)


def test_check_dataset_exists_raises_on_missing_file(tmp_path):
    """Verify FileNotFoundError is raised when file does not exist."""
    missing_path = tmp_path / "non_existent.csv"
    with pytest.raises(FileNotFoundError) as exc_info:
        check_dataset_exists(missing_path)
    assert "Dataset not found" in str(exc_info.value)
    assert "https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud" in str(exc_info.value)


def test_check_dataset_exists_raises_on_empty_file(tmp_path):
    """Verify DatasetValidationError is raised when file exists but is 0 bytes."""
    empty_file = tmp_path / "empty.csv"
    empty_file.touch()
    with pytest.raises(DatasetValidationError) as exc_info:
        check_dataset_exists(empty_file)
    assert "is empty (0 bytes)" in str(exc_info.value)


def test_validate_schema_success():
    """Verify schema validation passes when all 31 columns are present."""
    df = _make_dummy_valid_dataframe(10)
    report = validate_schema(df)
    assert report["valid"] is True
    assert report["total_columns"] == 31
    assert len(report["missing_columns"]) == 0
    assert report["is_canonical_order"] is True


def test_validate_schema_raises_on_missing_column():
    """Verify DatasetValidationError is raised if required columns are absent."""
    df = _make_dummy_valid_dataframe(10).drop(columns=["V12", "Amount"])
    with pytest.raises(DatasetValidationError) as exc_info:
        validate_schema(df)
    assert "Missing required column(s)" in str(exc_info.value)
    assert "V12" in str(exc_info.value)
    assert "Amount" in str(exc_info.value)


def test_validate_data_types_raises_on_non_numeric():
    """Verify validation fails if string/object columns are present."""
    df = _make_dummy_valid_dataframe(10)
    df["V1"] = "invalid_string_value"
    with pytest.raises(DatasetValidationError) as exc_info:
        validate_data_types_and_values(df)
    assert "contains non-numeric columns" in str(exc_info.value)


def test_validate_data_types_detects_nulls_and_infs():
    """Verify detection of missing values and infinities."""
    df = _make_dummy_valid_dataframe(10)
    df.loc[0, "V3"] = np.nan
    df.loc[1, "Amount"] = np.inf
    report = validate_data_types_and_values(df)
    assert report["valid"] is False
    assert report["total_nulls"] == 1
    assert report["columns_with_nulls"] == {"V3": 1}
    assert report["total_infinities"] == 1
    assert report["columns_with_infs"] == {"Amount": 1}


def test_validate_data_types_raises_on_non_binary_target():
    """Verify error when Class contains invalid non-binary labels."""
    df = _make_dummy_valid_dataframe(10)
    df.loc[0, "Class"] = 2
    with pytest.raises(DatasetValidationError) as exc_info:
        validate_data_types_and_values(df)
    assert "contains invalid values: {2}" in str(exc_info.value)


def test_inspect_duplicates():
    """Verify duplicate row identification without dataset mutation."""
    df = _make_dummy_valid_dataframe(10)
    # Duplicate row 0
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    report = inspect_duplicates(df)
    assert report["total_rows"] == 11
    assert report["num_duplicate_rows"] == 1
    assert report["duplicate_percentage"] == round(1 / 11 * 100.0, 4)


def test_calculate_class_distribution():
    """Verify exact calculation of counts, percentages, and imbalance ratio."""
    df = _make_dummy_valid_dataframe(100)
    # Force 98 legit and 2 fraud
    df["Class"] = 0
    df.loc[0:1, "Class"] = 1
    dist = calculate_class_distribution(df)
    assert dist["total_transactions"] == 100
    assert dist["legitimate_count"] == 98
    assert dist["fraudulent_count"] == 2
    assert dist["legitimate_percentage"] == 98.0
    assert dist["fraudulent_percentage"] == 2.0
    assert dist["imbalance_ratio"] == 49.0
