"""Prediction interface module for the Fraud Detection system.

Provides robust, defensive inference pipelines for single transactions and batch CSV feeds:
- Cached loading of serialized model artifacts.
- Strict input schema and finite value validation.
- Preservation of canonical feature order without redundant preprocessing.
- Row-to-prediction alignment preservation in batch processing.
- Integration with the centralized Risk Scoring Engine.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from src import config
from src.risk_engine import (
    DEFAULT_THRESHOLDS,
    RiskThresholds,
    assess_risk,
    calculate_risk_score,
    determine_risk_category,
    get_operational_recommendation,
)
from src.train import load_pipeline

logger = logging.getLogger(__name__)


def validate_inference_features(
    data: Union[Dict[str, Any], pd.Series, pd.DataFrame],
    required_features: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Validate and align raw transaction data into a canonical feature DataFrame.

    Enforces:
    1. Presence of all 30 canonical features (`Time`, `V1`–`V28`, `Amount`).
    2. Exact canonical column ordering.
    3. Strictly numeric, finite, non-null values.

    Args:
        data: Transaction input (dict, Series, or DataFrame).
        required_features: Expected feature names. Defaults to config.FEATURE_COLUMNS.

    Returns:
        pd.DataFrame: Formatted, canonical feature DataFrame ready for pipeline input.

    Raises:
        TypeError: If data is not a dict, Series, or DataFrame.
        ValueError: If required columns are missing, values are non-numeric, or NaNs/Infs exist.
    """
    if required_features is None:
        required_features = config.FEATURE_COLUMNS

    # 1. Standardize into DataFrame format
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, pd.Series):
        df = pd.DataFrame([data.to_dict()])
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise TypeError(
            f"Invalid input type: {type(data).__name__}. Expected dict, pd.Series, or pd.DataFrame."
        )

    if df.empty:
        raise ValueError("Input transaction data is empty (0 rows).")

    # 2. Check for missing required features
    present_cols = set(df.columns)
    missing_cols = [c for c in required_features if c not in present_cols]
    if missing_cols:
        raise ValueError(
            f"Missing required feature column(s): {missing_cols}. "
            f"Expected all 30 features: {required_features}"
        )

    # 3. Extract and order strictly by canonical specification
    df_canonical = df[required_features].copy()

    # 4. Validate numeric types
    for col in required_features:
        if not pd.api.types.is_numeric_dtype(df_canonical[col]):
            try:
                df_canonical[col] = pd.to_numeric(df_canonical[col], errors="raise")
            except Exception as e:
                raise ValueError(
                    f"Feature '{col}' contains non-numeric values that cannot be parsed: {e}"
                )

    # 5. Check for null / NaN / infinite values
    null_counts = df_canonical.isnull().sum()
    cols_with_null = null_counts[null_counts > 0].to_dict()
    if cols_with_null:
        raise ValueError(
            f"Transaction contains missing/null values in columns: {cols_with_null}. "
            "Defensive policy prohibits silent imputation."
        )

    inf_mask = np.isinf(df_canonical.values)
    if np.any(inf_mask):
        raise ValueError("Transaction features contain infinite values (inf or -inf).")

    return df_canonical


class FraudPredictor:
    """Production-style inference wrapper with cached model artifact loading."""

    def __init__(
        self,
        model_path: Optional[Union[Path, str]] = None,
        thresholds: Optional[RiskThresholds] = None,
    ) -> None:
        """Initialize the predictor and load the model pipeline.

        Args:
            model_path: Path to serialized Pipeline artifact. Defaults to config.BEST_MODEL_PATH.
            thresholds: Optional risk threshold configuration. Defaults to DEFAULT_THRESHOLDS.

        Raises:
            FileNotFoundError: If the model artifact cannot be found.
        """
        self.model_path = Path(model_path) if model_path is not None else config.BEST_MODEL_PATH
        self.thresholds = thresholds or DEFAULT_THRESHOLDS
        self.pipeline: Pipeline = self._load_model()
        self.model_name = self._extract_model_name()

    def _load_model(self) -> Pipeline:
        """Load and verify serialized pipeline artifact."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at '{self.model_path}'.\n"
                "Please run model training (Phase 5) before executing predictions."
            )
        pipeline = load_pipeline(self.model_path)
        if not hasattr(pipeline, "predict_proba"):
            raise ValueError(f"Loaded artifact at '{self.model_path}' does not support predict_proba().")
        return pipeline

    def _extract_model_name(self) -> str:
        """Extract human-readable name of the underlying classifier."""
        if "classifier" in self.pipeline.named_steps:
            return type(self.pipeline.named_steps["classifier"]).__name__
        return "Trained Pipeline"

    def predict_single(
        self,
        transaction: Union[Dict[str, Any], pd.Series, pd.DataFrame],
        thresholds: Optional[RiskThresholds] = None,
    ) -> Dict[str, Any]:
        """Predict fraud probability and risk score for a single transaction.

        Args:
            transaction: Input feature data (dict, Series, or 1-row DataFrame).
            thresholds: Optional custom thresholds overriding default instance settings.

        Returns:
            Dict[str, Any]: Structured prediction payload.
        """
        df_valid = validate_inference_features(transaction)
        if len(df_valid) != 1:
            raise ValueError(f"predict_single expected exactly 1 row, received {len(df_valid)} rows.")

        cfg = thresholds or self.thresholds

        # Pipeline handles preprocessing and classification in a single call
        prob = float(self.pipeline.predict_proba(df_valid)[0, 1])
        assessment = assess_risk(prob, thresholds=cfg)

        return {
            "fraud_probability": assessment["fraud_probability"],
            "risk_score": assessment["risk_score"],
            "risk_category": assessment["risk_category"],
            "operational_recommendation": assessment["operational_recommendation"],
            "model_name": self.model_name,
            "threshold_configuration": assessment["threshold_configuration"],
            "transaction_summary": {
                "Time": float(df_valid.iloc[0]["Time"]),
                "Amount": float(df_valid.iloc[0]["Amount"]),
            },
            "regulatory_disclaimer": assessment["regulatory_disclaimer"],
        }

    def predict_batch(
        self,
        transactions: pd.DataFrame,
        thresholds: Optional[RiskThresholds] = None,
        include_input_features: bool = False,
    ) -> pd.DataFrame:
        """Predict fraud risk for a batch of transactions, preserving row alignment and index.

        Args:
            transactions: Input feature DataFrame.
            thresholds: Optional custom thresholds.
            include_input_features: If True, prepends original input columns to output.

        Returns:
            pd.DataFrame: DataFrame containing aligned predictions and scores.
        """
        df_valid = validate_inference_features(transactions)
        cfg = thresholds or self.thresholds

        # Generate predicted probabilities for Class 1 (Fraud)
        probabilities = self.pipeline.predict_proba(df_valid)[:, 1]

        scores = [calculate_risk_score(p) for p in probabilities]
        categories = [determine_risk_category(p, thresholds=cfg) for p in probabilities]
        recommendations = [get_operational_recommendation(c) for c in categories]

        results_df = pd.DataFrame(
            {
                "fraud_probability": np.round(probabilities, 4),
                "risk_score": scores,
                "risk_category": categories,
                "operational_recommendation": recommendations,
            },
            index=df_valid.index,  # Preserves exact original row index alignment
        )

        if include_input_features:
            return pd.concat([df_valid, results_df], axis=1)

        return results_df


# Module-level convenience functions
_DEFAULT_PREDICTOR: Optional[FraudPredictor] = None


def get_default_predictor() -> FraudPredictor:
    """Retrieve or lazily initialize the default singleton FraudPredictor."""
    global _DEFAULT_PREDICTOR
    if _DEFAULT_PREDICTOR is None:
        _DEFAULT_PREDICTOR = FraudPredictor()
    return _DEFAULT_PREDICTOR


def predict_single_transaction(
    transaction: Union[Dict[str, Any], pd.Series, pd.DataFrame],
    thresholds: Optional[RiskThresholds] = None,
) -> Dict[str, Any]:
    """Convenience function: score a single transaction using the champion model."""
    predictor = get_default_predictor()
    return predictor.predict_single(transaction, thresholds=thresholds)


def predict_batch_transactions(
    transactions: pd.DataFrame,
    thresholds: Optional[RiskThresholds] = None,
    include_input_features: bool = False,
) -> pd.DataFrame:
    """Convenience function: score a batch of transactions using the champion model."""
    predictor = get_default_predictor()
    return predictor.predict_batch(
        transactions, thresholds=thresholds, include_input_features=include_input_features
    )
