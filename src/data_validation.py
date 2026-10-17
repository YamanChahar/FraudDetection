"""Data validation and schema integrity module.

Provides defensive validation for the credit card fraud dataset, including:
- Dataset file existence and accessibility checks
- Column schema and naming verification
- Data type and non-null/finite value integrity
- Target column binary domain verification ({0, 1})
- Duplicate record detection and reporting
- Actual class distribution and imbalance ratio calculations
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from src import config

logger = logging.getLogger(__name__)


class DatasetValidationError(ValueError):
    """Raised when the dataset fails schema or integrity validation."""
    pass


def check_dataset_exists(filepath: Optional[Path | str] = None) -> Path:
    """Verify that the dataset file exists and is not empty.

    Args:
        filepath: Optional path to the CSV file. If None, defaults to config.DATASET_PATH.

    Returns:
        Path: Resolved Path object to the existing file.

    Raises:
        FileNotFoundError: If the dataset file does not exist.
        DatasetValidationError: If the file exists but is empty (0 bytes).
    """
    path = Path(filepath) if filepath is not None else config.DATASET_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at: '{path}'.\n"
            "Please download 'creditcard.csv' from Kaggle: "
            "https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud\n"
            f"and place it at '{config.DATA_DIR / config.DEFAULT_DATASET_FILENAME}'."
        )
    if path.stat().st_size == 0:
        raise DatasetValidationError(f"Dataset file at '{path}' is empty (0 bytes).")
    return path


def validate_schema(df: pd.DataFrame, expected_columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """Validate DataFrame column names, counts, and ordering.

    Args:
        df: Input pandas DataFrame.
        expected_columns: Expected column list. Defaults to config.ALL_COLUMNS.

    Returns:
        Dict[str, Any]: Validation summary.

    Raises:
        DatasetValidationError: If required columns are missing.
    """
    if expected_columns is None:
        expected_columns = config.ALL_COLUMNS

    actual_columns = list(df.columns)
    missing_columns = [col for col in expected_columns if col not in actual_columns]
    unexpected_columns = [col for col in actual_columns if col not in expected_columns]

    if missing_columns:
        raise DatasetValidationError(
            f"Dataset schema error: Missing required column(s): {missing_columns}"
        )

    # Check whether column ordering matches canonical specification
    is_canonical_order = actual_columns == expected_columns

    return {
        "valid": True,
        "total_columns": len(actual_columns),
        "expected_columns_count": len(expected_columns),
        "missing_columns": missing_columns,
        "unexpected_columns": unexpected_columns,
        "is_canonical_order": is_canonical_order,
    }


def validate_data_types_and_values(
    df: pd.DataFrame, target_column: Optional[str] = None
) -> Dict[str, Any]:
    """Verify numeric data types, check for null/NaN/inf values, and validate target domain.

    Args:
        df: Input pandas DataFrame.
        target_column: Target column name. Defaults to config.TARGET_COLUMN.

    Returns:
        Dict[str, Any]: Summary of nulls, infinities, and target integrity.

    Raises:
        DatasetValidationError: If non-numeric columns, nulls, or invalid targets exist.
    """
    if target_column is None:
        target_column = config.TARGET_COLUMN

    # Check that all columns are numeric
    non_numeric_cols = [
        col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])
    ]
    if non_numeric_cols:
        raise DatasetValidationError(
            f"Dataset contains non-numeric columns: {non_numeric_cols}"
        )

    # Check for missing/null values
    null_counts = df.isnull().sum()
    columns_with_nulls = null_counts[null_counts > 0].to_dict()
    total_nulls = int(null_counts.sum())

    # Check for infinite values across numeric columns
    numeric_df = df.select_dtypes(include=[np.number])
    inf_mask = np.isinf(numeric_df.values)
    total_infs = int(np.sum(inf_mask))
    columns_with_infs = {}
    if total_infs > 0:
        for col in numeric_df.columns:
            cnt = int(np.isinf(df[col]).sum())
            if cnt > 0:
                columns_with_infs[col] = cnt

    # Validate target values if target column exists in DataFrame
    target_summary: Dict[str, Any] = {}
    if target_column in df.columns:
        raw_uniques = df[target_column].dropna().unique()
        # Convert numpy types to standard python types for clean formatting and comparison
        unique_targets = {x.item() if hasattr(x, "item") else x for x in raw_uniques}
        valid_targets = {0, 1}
        invalid_values = unique_targets - valid_targets
        if invalid_values:
            raise DatasetValidationError(
                f"Target column '{target_column}' contains invalid values: {invalid_values}. "
                f"Expected binary values in {valid_targets}."
            )
        target_summary = {
            "unique_values": sorted(list(unique_targets)),
            "is_binary": unique_targets.issubset(valid_targets),
        }

    return {
        "valid": total_nulls == 0 and total_infs == 0,
        "total_nulls": total_nulls,
        "columns_with_nulls": columns_with_nulls,
        "total_infinities": total_infs,
        "columns_with_infs": columns_with_infs,
        "target_summary": target_summary,
    }


def inspect_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    """Inspect duplicate rows in the DataFrame without modifying the dataset.

    Args:
        df: Input pandas DataFrame.

    Returns:
        Dict[str, Any]: Duplicate record counts, percentage, and class breakdown.
    """
    duplicate_mask = df.duplicated(keep=False)
    duplicate_first_occurrence_mask = df.duplicated(keep="first")
    num_duplicate_rows = int(duplicate_first_occurrence_mask.sum())
    total_rows = len(df)
    duplicate_percentage = (num_duplicate_rows / total_rows * 100.0) if total_rows > 0 else 0.0

    duplicate_class_distribution: Dict[int, int] = {}
    if config.TARGET_COLUMN in df.columns and num_duplicate_rows > 0:
        dup_subset = df[duplicate_first_occurrence_mask]
        duplicate_class_distribution = (
            dup_subset[config.TARGET_COLUMN].value_counts().to_dict()
        )

    return {
        "total_rows": total_rows,
        "num_duplicate_rows": num_duplicate_rows,
        "duplicate_percentage": round(duplicate_percentage, 4),
        "duplicate_class_distribution": duplicate_class_distribution,
    }


def calculate_class_distribution(
    df: pd.DataFrame, target_column: Optional[str] = None
) -> Dict[str, Any]:
    """Calculate exact class counts, percentages, and imbalance ratio from actual data.

    Args:
        df: Input pandas DataFrame containing the target column.
        target_column: Target column name. Defaults to config.TARGET_COLUMN.

    Returns:
        Dict[str, Any]: Class distribution statistics.

    Raises:
        DatasetValidationError: If target column is not in df.
    """
    if target_column is None:
        target_column = config.TARGET_COLUMN

    if target_column not in df.columns:
        raise DatasetValidationError(
            f"Target column '{target_column}' not found in DataFrame."
        )

    counts = df[target_column].value_counts().to_dict()
    total = len(df)

    legit_count = int(counts.get(0, 0))
    fraud_count = int(counts.get(1, 0))

    legit_pct = (legit_count / total * 100.0) if total > 0 else 0.0
    fraud_pct = (fraud_count / total * 100.0) if total > 0 else 0.0
    imbalance_ratio = (legit_count / fraud_count) if fraud_count > 0 else float("inf")

    return {
        "total_transactions": total,
        "legitimate_count": legit_count,
        "fraudulent_count": fraud_count,
        "legitimate_percentage": round(legit_pct, 4),
        "fraudulent_percentage": round(fraud_pct, 4),
        "imbalance_ratio": round(imbalance_ratio, 2),
    }


def load_and_validate_dataset(
    filepath: Optional[Path | str] = None,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Defensive entrypoint: load CSV and execute all validation checks.

    Args:
        filepath: Optional path to dataset CSV. Defaults to config.DATASET_PATH.

    Returns:
        Tuple[pd.DataFrame, Dict[str, Any]]: Validated DataFrame and validation metadata.
    """
    path = check_dataset_exists(filepath)
    df = pd.read_csv(path)

    schema_report = validate_schema(df)
    integrity_report = validate_data_types_and_values(df)
    duplicate_report = inspect_duplicates(df)
    distribution_report = calculate_class_distribution(df)

    validation_summary = {
        "filepath": str(path),
        "schema": schema_report,
        "integrity": integrity_report,
        "duplicates": duplicate_report,
        "class_distribution": distribution_report,
    }

    return df, validation_summary
