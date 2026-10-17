"""Dependency injection and cached resource managers for the FraudLens backend."""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Any, Dict, Optional
import pandas as pd

from src import config
from src.explainability import FraudExplainer
from src.predict import FraudPredictor


class ServiceContainer:
    """Singleton container holding references to heavy ML assets."""

    _predictor: Optional[FraudPredictor] = None
    _explainer: Optional[FraudExplainer] = None
    _metrics_report: Optional[Dict[str, Any]] = None
    _global_shap_report: Optional[Dict[str, Any]] = None

    @classmethod
    def get_predictor(cls) -> FraudPredictor:
        """Get or initialize the cached FraudPredictor instance."""
        if cls._predictor is None:
            cls._predictor = FraudPredictor(config.BEST_MODEL_PATH)
        return cls._predictor

    @classmethod
    def get_explainer(cls) -> FraudExplainer:
        """Get or initialize the cached FraudExplainer instance."""
        if cls._explainer is None:
            cls._explainer = FraudExplainer(config.BEST_MODEL_PATH)
        return cls._explainer

    @classmethod
    def get_metrics_report(cls) -> Optional[Dict[str, Any]]:
        """Load and cache Phase 5 model comparison report."""
        if cls._metrics_report is None:
            path = config.REPORTS_DIR / "model_comparison.json"
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    cls._metrics_report = json.load(f)
        return cls._metrics_report

    @classmethod
    def get_global_shap_report(cls) -> Optional[Dict[str, Any]]:
        """Load and cache Phase 8 global SHAP report."""
        if cls._global_shap_report is None:
            path = config.REPORTS_DIR / "shap_feature_importance.json"
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    cls._global_shap_report = json.load(f)
        return cls._global_shap_report


@lru_cache(maxsize=1)
def load_cached_dataset_sample(n_rows: int = 500) -> Optional[pd.DataFrame]:
    """Cache a slice of the real dataset for transaction browsing."""
    if config.DATASET_PATH.exists():
        return pd.read_csv(config.DATASET_PATH, nrows=n_rows)
    return None
