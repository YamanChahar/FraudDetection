"""Project configuration and path management.

Provides a single source of truth for directory paths, file locations,
dataset schemas, and experiment parameters across the application.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Final, List

# Project root directory
PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parent.parent

# Core Directory Paths
DATA_DIR: Final[Path] = PROJECT_ROOT / "data"
MODELS_DIR: Final[Path] = PROJECT_ROOT / "models"
REPORTS_DIR: Final[Path] = PROJECT_ROOT / "reports"
NOTEBOOKS_DIR: Final[Path] = PROJECT_ROOT / "notebooks"
TESTS_DIR: Final[Path] = PROJECT_ROOT / "tests"

# Model Artifact Locations
BEST_MODEL_PATH: Final[Path] = MODELS_DIR / "best_model.joblib"

# Dataset Configuration (configurable via FRAUD_DATASET_PATH environment variable)
DEFAULT_DATASET_FILENAME: Final[str] = "creditcard.csv"
DATASET_PATH: Final[Path] = Path(
    os.getenv("FRAUD_DATASET_PATH", str(DATA_DIR / DEFAULT_DATASET_FILENAME))
)

# Feature Schema Definitions
TIME_FEATURE: Final[str] = "Time"
AMOUNT_FEATURE: Final[str] = "Amount"
PCA_FEATURES: Final[List[str]] = [f"V{i}" for i in range(1, 29)]
FEATURE_COLUMNS: Final[List[str]] = [TIME_FEATURE] + PCA_FEATURES + [AMOUNT_FEATURE]
TARGET_COLUMN: Final[str] = "Class"
ALL_COLUMNS: Final[List[str]] = FEATURE_COLUMNS + [TARGET_COLUMN]

# Demonstration Risk Scoring Thresholds
# Note: These are initial demonstration defaults, not validated banking decision rules.
DEFAULT_LOW_RISK_THRESHOLD: Final[float] = 0.30
DEFAULT_HIGH_RISK_THRESHOLD: Final[float] = 0.70

# Reproducibility Settings
RANDOM_STATE: Final[int] = 42
TEST_SPLIT_SIZE: Final[float] = 0.20
STRATIFIED_SPLIT: Final[bool] = True
