"""Model training module for the Fraud Detection system.

Builds and fits end-to-end scikit-learn pipelines combining leakage-free
preprocessing with classification algorithms.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Literal, Optional, Union

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from src import config
from src.preprocessing import build_preprocessor

logger = logging.getLogger(__name__)


def build_logistic_regression_pipeline(
    scaler_type: Literal["robust", "standard"] = "robust",
    class_weight: Optional[Union[str, Dict[Any, float]]] = "balanced",
    max_iter: int = 1000,
    random_state: int = config.RANDOM_STATE,
    C: float = 1.0,
    solver: str = "lbfgs",
) -> Pipeline:
    """Construct an end-to-end Pipeline coupling preprocessing and Logistic Regression.

    By embedding the ColumnTransformer directly inside the Pipeline, all transformations
    are fit strictly on training data during pipeline.fit(), eliminating any risk
    of feature leakage during cross-validation and evaluation.

    Args:
        scaler_type: 'robust' for RobustScaler or 'standard' for StandardScaler.
        class_weight: Weighting strategy ('balanced', None, or custom dict).
        max_iter: Maximum solver convergence iterations.
        random_state: Reproducibility random seed.
        C: Inverse regularization strength parameter.
        solver: Optimization algorithm (default: 'lbfgs').

    Returns:
        Pipeline: Unfitted end-to-end Pipeline.
    """
    preprocessor = build_preprocessor(scaler_type=scaler_type)
    classifier = LogisticRegression(
        class_weight=class_weight,
        max_iter=max_iter,
        random_state=random_state,
        C=C,
        solver=solver,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )
    return pipeline


def build_smote_logistic_regression_pipeline(
    scaler_type: Literal["robust", "standard"] = "robust",
    sampling_strategy: Union[float, str] = "auto",
    max_iter: int = 1000,
    random_state: int = config.RANDOM_STATE,
    C: float = 1.0,
    solver: str = "lbfgs",
) -> ImbPipeline:
    """Construct an imblearn Pipeline applying SMOTE strictly inside training partitions.

    In this pipeline:
    1. Preprocessor scales Time & Amount and passes V1-V28 on training fold.
    2. SMOTE creates synthetic minority fraud samples ONLY on training fold.
    3. Classifier trains on the balanced training fold.
    4. During predict() / transform() on validation/test data, SMOTE is automatically
       skipped by imblearn, strictly preventing synthetic leakage.

    Args:
        scaler_type: 'robust' or 'standard'.
        sampling_strategy: Target ratio of minority to majority samples.
        max_iter: Maximum solver convergence iterations.
        random_state: Reproducibility random seed.
        C: Inverse regularization strength parameter.
        solver: Optimization algorithm.

    Returns:
        ImbPipeline: Unfitted imbalanced-learn Pipeline.
    """
    preprocessor = build_preprocessor(scaler_type=scaler_type)
    smote = SMOTE(
        sampling_strategy=sampling_strategy,
        random_state=random_state,
    )
    classifier = LogisticRegression(
        class_weight=None,  # Unweighted classifier since SMOTE balances training data
        max_iter=max_iter,
        random_state=random_state,
        C=C,
        solver=solver,
    )

    pipeline = ImbPipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("smote", smote),
            ("classifier", classifier),
        ]
    )
    return pipeline


def train_baseline_logistic_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    scaler_type: Literal["robust", "standard"] = "robust",
    class_weight: Optional[Union[str, Dict[Any, float]]] = "balanced",
    max_iter: int = 1000,
    random_state: int = config.RANDOM_STATE,
    C: float = 1.0,
) -> Pipeline:
    """Fit the baseline Logistic Regression pipeline strictly on training data.

    Args:
        X_train: Training feature matrix.
        y_train: Training binary target series.
        scaler_type: Scaler to apply to Time and Amount.
        class_weight: Class reweighting mode (default: 'balanced').
        max_iter: Iteration budget for optimizer convergence.
        random_state: Reproducibility seed.
        C: Inverse regularization parameter.

    Returns:
        Pipeline: Fitted Pipeline ready for prediction.
    """
    if len(X_train) == 0 or len(y_train) == 0:
        raise ValueError("Cannot train on empty training partitions.")

    pipeline = build_logistic_regression_pipeline(
        scaler_type=scaler_type,
        class_weight=class_weight,
        max_iter=max_iter,
        random_state=random_state,
        C=C,
    )

    logger.info("Fitting Logistic Regression pipeline on %d samples...", len(X_train))
    pipeline.fit(X_train, y_train)
    logger.info("Training complete. Solver converged in %s iterations.", pipeline.named_steps["classifier"].n_iter_)

    return pipeline


def save_pipeline(
    pipeline: Pipeline,
    filepath: Optional[Union[Path, str]] = None,
) -> Path:
    """Serialize and save an end-to-end trained pipeline to disk using joblib.

    Args:
        pipeline: Fitted Pipeline.
        filepath: Target filepath. Defaults to config.MODELS_DIR / 'baseline_logistic_regression.joblib'.

    Returns:
        Path: Path to saved artifact.
    """
    if filepath is None:
        filepath = config.MODELS_DIR / "baseline_logistic_regression.joblib"
    else:
        filepath = Path(filepath)

    filepath.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, filepath)
    logger.info("Saved pipeline artifact to: %s", filepath)
    return filepath


def load_pipeline(
    filepath: Optional[Union[Path, str]] = None,
) -> Pipeline:
    """Load a serialized pipeline artifact from disk.

    Args:
        filepath: Path to artifact. Defaults to config.MODELS_DIR / 'baseline_logistic_regression.joblib'.

    Returns:
        Pipeline: Deserialized Pipeline.

    Raises:
        FileNotFoundError: If the artifact does not exist.
    """
    if filepath is None:
        filepath = config.MODELS_DIR / "baseline_logistic_regression.joblib"
    else:
        filepath = Path(filepath)

    if not filepath.exists():
        raise FileNotFoundError(f"Pipeline artifact not found at: '{filepath}'.")

    return joblib.load(filepath)
