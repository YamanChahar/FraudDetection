import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import RobustScaler

NUMERICAL_COLS = ["Time", "Amount"]
PCA_COLS = [f"V{i}" for i in range(1, 29)]
FEATURE_NAMES = ["Time"] + PCA_COLS + ["Amount"]

class TransactionFeatureValidator(BaseEstimator, TransformerMixin):
    """Validates and ensures consistent column ordering for transaction inference."""
    
    def __init__(self, expected_features=FEATURE_NAMES):
        self.expected_features = expected_features

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, dict):
            X = pd.DataFrame([X])
        elif isinstance(X, list):
            X = pd.DataFrame(X)
        elif not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.expected_features)

        # Impute any missing numerical features with safe defaults
        for col in self.expected_features:
            if col not in X.columns:
                X[col] = 0.0
            else:
                X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0.0)

        return X[self.expected_features]

def build_preprocessor():
    """Builds a scikit-learn ColumnTransformer that scales Time & Amount while preserving exact FEATURE_NAMES order."""
    return ColumnTransformer(
        transformers=[
            ("time_scaler", RobustScaler(), ["Time"]),
            ("pca_pass", "passthrough", PCA_COLS),
            ("amount_scaler", RobustScaler(), ["Amount"]),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
