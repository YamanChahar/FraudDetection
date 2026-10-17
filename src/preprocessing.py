"""Data preprocessing and experimental design module.

Provides leakage-free preprocessing utilities for the Fraud Detection system:
- Input feature and target separation with schema validation.
- Reproducible, stratified train/test partitioning.
- Pipeline-safe feature scaling (RobustScaler for Time/Amount, passthrough for PCA features).
- Preservation of canonical feature names and ordering.
- Persistence of fitted preprocessors for inference consistency.
- Explicit verification against data leakage.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, StandardScaler

from src import config
from src.data_validation import (
    DatasetValidationError,
    load_and_validate_dataset,
    validate_data_types_and_values,
    validate_schema,
)

logger = logging.getLogger(__name__)


def prepare_features_and_target(
    df: pd.DataFrame,
    feature_columns: Optional[List[str]] = None,
    target_column: Optional[str] = None,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Validate DataFrame and separate into feature matrix X and target vector y.

    Args:
        df: Input pandas DataFrame.
        feature_columns: List of expected feature names in canonical order.
            Defaults to config.FEATURE_COLUMNS.
        target_column: Name of target column. Defaults to config.TARGET_COLUMN.

    Returns:
        Tuple[pd.DataFrame, pd.Series]: Feature DataFrame X and target Series y.

    Raises:
        DatasetValidationError: If schema, data types, or target labels are invalid.
    """
    if feature_columns is None:
        feature_columns = config.FEATURE_COLUMNS
    if target_column is None:
        target_column = config.TARGET_COLUMN

    expected_all = feature_columns + [target_column]
    validate_schema(df, expected_columns=expected_all)
    validate_data_types_and_values(df, target_column=target_column)

    X = df[feature_columns].copy()
    y = df[target_column].copy()

    return X, y


def create_stratified_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = config.TEST_SPLIT_SIZE,
    random_state: int = config.RANDOM_STATE,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Create a reproducible, stratified train/test split.

    Args:
        X: Feature matrix.
        y: Target series.
        test_size: Proportion of dataset allocated to test set (default 0.20).
        random_state: Seed for reproducible pseudo-random partitioning.

    Returns:
        Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
            X_train, X_test, y_train, y_test.

    Raises:
        ValueError: If split boundaries are invalid or partitions fail validation.
    """
    if not (0.0 < test_size < 1.0):
        raise ValueError(f"test_size must be strictly between 0.0 and 1.0, got {test_size}")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
        shuffle=True,
    )

    # Integrity verification: Assert disjoint index sets
    train_indices = set(X_train.index)
    test_indices = set(X_test.index)
    if not train_indices.isdisjoint(test_indices):
        overlap = train_indices.intersection(test_indices)
        raise ValueError(f"Data leakage detected! Train and test indices overlap: {len(overlap)} rows.")

    # Integrity verification: Ensure both partitions contain both classes
    train_classes = set(y_train.unique())
    test_classes = set(y_test.unique())
    expected_classes = {0, 1}
    if train_classes != expected_classes or test_classes != expected_classes:
        raise ValueError(
            f"Class representation failure. Train classes: {train_classes}, Test classes: {test_classes}"
        )

    return X_train, X_test, y_train, y_test


def get_split_summary(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> Dict[str, Any]:
    """Generate detailed audit report for train and test partitions.

    Args:
        X_train: Training features.
        X_test: Test features.
        y_train: Training targets.
        y_test: Test targets.

    Returns:
        Dict[str, Any]: Partition dimensions, class counts, and percentage distributions.
    """
    total_samples = len(y_train) + len(y_test)
    train_legit = int((y_train == 0).sum())
    train_fraud = int((y_train == 1).sum())
    test_legit = int((y_test == 0).sum())
    test_fraud = int((y_test == 1).sum())

    train_fraud_pct = (train_fraud / len(y_train) * 100.0) if len(y_train) > 0 else 0.0
    test_fraud_pct = (test_fraud / len(y_test) * 100.0) if len(y_test) > 0 else 0.0

    return {
        "total_samples": total_samples,
        "train": {
            "rows": len(X_train),
            "columns": X_train.shape[1],
            "legitimate_count": train_legit,
            "fraudulent_count": train_fraud,
            "fraudulent_percentage": round(train_fraud_pct, 4),
            "imbalance_ratio": round(train_legit / train_fraud, 2) if train_fraud > 0 else float("inf"),
        },
        "test": {
            "rows": len(X_test),
            "columns": X_test.shape[1],
            "legitimate_count": test_legit,
            "fraudulent_count": test_fraud,
            "fraudulent_percentage": round(test_fraud_pct, 4),
            "imbalance_ratio": round(test_legit / test_fraud, 2) if test_fraud > 0 else float("inf"),
        },
        "disjoint_index_verified": set(X_train.index).isdisjoint(set(X_test.index)),
    }


def build_preprocessor(
    scaler_type: Literal["robust", "standard"] = "robust",
) -> ColumnTransformer:
    """Build a ColumnTransformer that scales Time and Amount while preserving PCA features.

    Maintains exact canonical column ordering:
    [Time, V1, V2, ..., V28, Amount]

    Args:
        scaler_type: 'robust' for RobustScaler (resists outliers) or 'standard' for StandardScaler.

    Returns:
        ColumnTransformer: Unfitted preprocessor pipeline component.
    """
    if scaler_type == "robust":
        time_scaler = RobustScaler()
        amount_scaler = RobustScaler()
    elif scaler_type == "standard":
        time_scaler = StandardScaler()
        amount_scaler = StandardScaler()
    else:
        raise ValueError(f"Unsupported scaler_type '{scaler_type}'. Choose 'robust' or 'standard'.")

    # Construct ColumnTransformer in canonical column order:
    # 1. Time (scaled)
    # 2. V1 through V28 (passthrough)
    # 3. Amount (scaled)
    preprocessor = ColumnTransformer(
        transformers=[
            ("time_scaler", time_scaler, [config.TIME_FEATURE]),
            ("pca_passthrough", "passthrough", config.PCA_FEATURES),
            ("amount_scaler", amount_scaler, [config.AMOUNT_FEATURE]),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preprocessor


def fit_preprocessor(
    preprocessor: ColumnTransformer,
    X_train: pd.DataFrame,
) -> ColumnTransformer:
    """Fit preprocessor exclusively on training features to prevent data leakage.

    Args:
        preprocessor: Unfitted ColumnTransformer.
        X_train: Training feature DataFrame.

    Returns:
        ColumnTransformer: Fitted ColumnTransformer instance.
    """
    preprocessor.fit(X_train)
    return preprocessor


def transform_features(
    preprocessor: ColumnTransformer,
    X: pd.DataFrame,
) -> pd.DataFrame:
    """Transform features using an already-fitted preprocessor, returning a DataFrame.

    Preserves exact canonical column names and original DataFrame indices.

    Args:
        preprocessor: Fitted ColumnTransformer.
        X: Feature DataFrame to transform.

    Returns:
        pd.DataFrame: Transformed features with canonical column names.
    """
    transformed_array = preprocessor.transform(X)
    return pd.DataFrame(
        transformed_array,
        columns=config.FEATURE_COLUMNS,
        index=X.index,
    )


def verify_leakage_protection(
    preprocessor: ColumnTransformer,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
) -> Dict[str, Any]:
    """Formally verify that the preprocessor was fitted on X_train and not influenced by X_test.

    Inspects fitted scaler center/scale parameters and compares them to actual training statistics.

    Args:
        preprocessor: Fitted ColumnTransformer.
        X_train: Training features used during fitting.
        X_test: Unseen test features.

    Returns:
        Dict[str, Any]: Audit report validating parameters match X_train exactly.
    """
    time_scaler = preprocessor.named_transformers_["time_scaler"]
    amount_scaler = preprocessor.named_transformers_["amount_scaler"]

    # Verify time scaler parameters match training data
    if isinstance(time_scaler, RobustScaler):
        fitted_time_center = float(time_scaler.center_[0])
        actual_train_time_median = float(X_train[config.TIME_FEATURE].median())
        actual_test_time_median = float(X_test[config.TIME_FEATURE].median())
        time_matches_train = np.isclose(fitted_time_center, actual_train_time_median)
        time_matches_test = np.isclose(fitted_time_center, actual_test_time_median)

        fitted_amt_center = float(amount_scaler.center_[0])
        actual_train_amt_median = float(X_train[config.AMOUNT_FEATURE].median())
        actual_test_amt_median = float(X_test[config.AMOUNT_FEATURE].median())
        amt_matches_train = np.isclose(fitted_amt_center, actual_train_amt_median)
        amt_matches_test = np.isclose(fitted_amt_center, actual_test_amt_median)
    else:
        fitted_time_center = float(time_scaler.mean_[0])
        actual_train_time_median = float(X_train[config.TIME_FEATURE].mean())
        actual_test_time_median = float(X_test[config.TIME_FEATURE].mean())
        time_matches_train = np.isclose(fitted_time_center, actual_train_time_median)
        time_matches_test = np.isclose(fitted_time_center, actual_test_time_median)

        fitted_amt_center = float(amount_scaler.mean_[0])
        actual_train_amt_median = float(X_train[config.AMOUNT_FEATURE].mean())
        actual_test_amt_median = float(X_test[config.AMOUNT_FEATURE].mean())
        amt_matches_train = np.isclose(fitted_amt_center, actual_train_amt_median)
        amt_matches_test = np.isclose(fitted_amt_center, actual_test_amt_median)

    is_leakage_free = bool(time_matches_train and amt_matches_train and not time_matches_test)

    return {
        "leakage_free": is_leakage_free,
        "time_center_matches_train": bool(time_matches_train),
        "time_center_matches_test": bool(time_matches_test),
        "amount_center_matches_train": bool(amt_matches_train),
        "amount_center_matches_test": bool(amt_matches_test),
        "fitted_time_center": fitted_time_center,
        "actual_train_time_median": actual_train_time_median,
        "fitted_amount_center": fitted_amt_center,
        "actual_train_amount_median": actual_train_amt_median,
    }


def save_preprocessor(
    preprocessor: ColumnTransformer,
    filepath: Optional[Union[Path, str]] = None,
) -> Path:
    """Serialize and save fitted preprocessor to disk using joblib.

    Args:
        preprocessor: Fitted ColumnTransformer.
        filepath: Target file path. Defaults to config.MODELS_DIR / 'preprocessor.joblib'.

    Returns:
        Path: Path to saved artifact.
    """
    if filepath is None:
        filepath = config.MODELS_DIR / "preprocessor.joblib"
    else:
        filepath = Path(filepath)

    filepath.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, filepath)
    logger.info("Saved preprocessor artifact to %s", filepath)
    return filepath


def load_preprocessor(
    filepath: Optional[Union[Path, str]] = None,
) -> ColumnTransformer:
    """Load serialized preprocessor artifact from disk.

    Args:
        filepath: Target file path. Defaults to config.MODELS_DIR / 'preprocessor.joblib'.

    Returns:
        ColumnTransformer: Deserialized preprocessor.

    Raises:
        FileNotFoundError: If the preprocessor artifact does not exist.
    """
    if filepath is None:
        filepath = config.MODELS_DIR / "preprocessor.joblib"
    else:
        filepath = Path(filepath)

    if not filepath.exists():
        raise FileNotFoundError(f"Preprocessor artifact not found at '{filepath}'.")

    return joblib.load(filepath)
