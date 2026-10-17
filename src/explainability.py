"""Model explainability module using SHAP (SHapley Additive exPlanations).

Provides global and local feature attribution for the trained champion Random Forest
fraud detection pipeline via TreeExplainer, supporting enterprise auditability and
investigator decision-support workflows.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap

from src import config
from src.predict import validate_inference_features


class FraudExplainer:
    """SHAP explainer for the credit card fraud detection champion pipeline.

    Wraps a fitted Scikit-learn Pipeline containing a RobustScaler ColumnTransformer
    preprocessor and a RandomForestClassifier, utilizing TreeExplainer on the positive
    fraudulent transaction class.

    Attributes:
        model_path: Path to the serialized pipeline artifact.
        pipeline: The loaded Scikit-learn Pipeline.
        preprocessor: The fitted ColumnTransformer step.
        classifier: The fitted RandomForestClassifier step.
        explainer: The initialized shap.TreeExplainer.
        feature_names: Canonical list of feature names matching the pipeline schema.
        base_value: Expected value (prior probability) for Class 1 (Fraudulent).
    """

    def __init__(self, model_path: Union[Path, str] = config.BEST_MODEL_PATH) -> None:
        """Initialize the FraudExplainer by loading the trained model artifact.

        Args:
            model_path: Path to serialized joblib model pipeline.

        Raises:
            FileNotFoundError: If model_path does not exist.
            ValueError: If the loaded artifact is not a valid pipeline with required steps.
        """
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {self.model_path}. "
                "Ensure Phase 5 model comparison and selection is complete."
            )

        self.pipeline = joblib.load(self.model_path)

        if not hasattr(self.pipeline, "named_steps"):
            raise ValueError("Loaded model artifact must be a Scikit-learn Pipeline.")

        if "preprocessor" not in self.pipeline.named_steps:
            raise ValueError("Pipeline missing 'preprocessor' step.")
        if "classifier" not in self.pipeline.named_steps:
            raise ValueError("Pipeline missing 'classifier' step.")

        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.classifier = self.pipeline.named_steps["classifier"]

        # Initialize TreeExplainer on the tree ensemble
        self.explainer = shap.TreeExplainer(self.classifier)
        self.feature_names: List[str] = list(config.FEATURE_COLUMNS)

        # Base value for Class 1 (Fraudulent)
        expected_val = self.explainer.expected_value
        if isinstance(expected_val, (list, np.ndarray)):
            # Binary classification [Class 0, Class 1]
            self.base_value: float = float(expected_val[1])
        else:
            self.base_value = float(expected_val)

    def explain_instance(
        self,
        transaction: Union[Dict[str, Any], pd.Series, pd.DataFrame],
        top_n: int = 5,
    ) -> Dict[str, Any]:
        """Generate a local SHAP explanation for a single transaction.

        Args:
            transaction: Input transaction data containing all 30 canonical features.
            top_n: Number of top risk-increasing and risk-decreasing features to return.

        Returns:
            Dictionary containing base value, predicted probability, feature contributions,
            top positive (risk-increasing) and negative (risk-reducing) drivers.

        Raises:
            ValueError: If input validation fails or dimensions are invalid.
        """
        validated_df = validate_inference_features(transaction)
        if len(validated_df) != 1:
            raise ValueError(f"explain_instance expects exactly 1 transaction, got {len(validated_df)}.")

        # Preprocess features through the pipeline's ColumnTransformer
        X_trans = self.preprocessor.transform(validated_df)

        # Compute SHAP explanation
        explanation = self.explainer(X_trans)

        # Extract Class 1 (Fraud) contributions
        # Explanation shape for binary RF is (1, n_features, 2)
        if len(explanation.values.shape) == 3:
            shap_values = explanation.values[0, :, 1]
            inst_base_value = float(explanation.base_values[0, 1])
        else:
            shap_values = explanation.values[0, :]
            inst_base_value = float(explanation.base_values[0])

        # Predicted fraud probability from model pipeline
        proba = float(self.pipeline.predict_proba(validated_df)[0, 1])

        raw_features = validated_df.iloc[0].to_dict()

        # Build detailed contribution list
        contributions: List[Dict[str, Any]] = []
        for i, feat_name in enumerate(self.feature_names):
            s_val = float(shap_values[i])
            r_val = float(raw_features[feat_name])
            contributions.append(
                {
                    "feature": feat_name,
                    "raw_value": r_val,
                    "shap_value": s_val,
                    "direction": "Increases Risk" if s_val > 0 else "Reduces Risk",
                    "abs_impact": abs(s_val),
                }
            )

        # Sort all contributions by absolute impact
        contributions.sort(key=lambda x: x["abs_impact"], reverse=True)

        # Separate top risk-increasing and top risk-reducing features
        pos_drivers = [c for c in contributions if c["shap_value"] > 0][:top_n]
        neg_drivers = [c for c in contributions if c["shap_value"] < 0][:top_n]

        return {
            "base_value": inst_base_value,
            "predicted_probability": proba,
            "sum_shap_values": float(np.sum(shap_values)),
            "contributions": contributions,
            "top_risk_increasing": pos_drivers,
            "top_risk_decreasing": neg_drivers,
            "feature_names": self.feature_names,
            "shap_values": [float(v) for v in shap_values],
            "raw_features": raw_features,
            "explained_class": "Fraudulent (Class = 1)",
            "output_scale": "probability",
        }

    def compute_global_importance(
        self,
        sample_df: pd.DataFrame,
        max_samples: int = 500,
    ) -> pd.DataFrame:
        """Compute global mean absolute SHAP feature importance on a transaction sample.

        Args:
            sample_df: DataFrame containing transaction records with all 30 features.
            max_samples: Maximum number of rows to evaluate for computational efficiency.

        Returns:
            DataFrame sorted by mean absolute SHAP value with columns:
            ['feature', 'mean_abs_shap', 'relative_importance', 'rank'].
        """
        validated_df = validate_inference_features(sample_df)
        if len(validated_df) > max_samples:
            validated_df = validated_df.head(max_samples)

        X_trans = self.preprocessor.transform(validated_df)
        explanation = self.explainer(X_trans)

        if len(explanation.values.shape) == 3:
            shap_vals = explanation.values[:, :, 1]
        else:
            shap_vals = explanation.values

        mean_abs = np.mean(np.abs(shap_vals), axis=0)
        total_abs = np.sum(mean_abs)
        rel_imp = (mean_abs / total_abs) if total_abs > 0 else np.zeros_like(mean_abs)

        df_importance = pd.DataFrame(
            {
                "feature": self.feature_names,
                "mean_abs_shap": mean_abs,
                "relative_importance": rel_imp,
            }
        ).sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)

        df_importance["rank"] = df_importance.index + 1
        return df_importance

    def generate_and_save_global_summary(
        self,
        sample_df: pd.DataFrame,
        output_image_path: Union[Path, str] = config.REPORTS_DIR / "shap_global_summary.png",
        output_json_path: Union[Path, str] = config.REPORTS_DIR / "shap_feature_importance.json",
        max_samples: int = 500,
        random_state: int = config.RANDOM_STATE,
    ) -> pd.DataFrame:
        """Compute and persist global SHAP summary visualizations and machine-readable metrics.

        Args:
            sample_df: DataFrame containing representative transactions.
            output_image_path: Path to save the summary visualization plot.
            output_json_path: Path to save the feature importance JSON.
            max_samples: Max samples to evaluate.
            random_state: Random state for reproducibility if sampling.

        Returns:
            DataFrame of global feature importances.
        """
        output_img = Path(output_image_path)
        output_json = Path(output_json_path)
        output_img.parent.mkdir(parents=True, exist_ok=True)
        output_json.parent.mkdir(parents=True, exist_ok=True)

        validated_df = validate_inference_features(sample_df)
        if len(validated_df) > max_samples:
            validated_df = validated_df.sample(n=max_samples, random_state=random_state)

        X_trans = self.preprocessor.transform(validated_df)
        explanation = self.explainer(X_trans)

        if len(explanation.values.shape) == 3:
            shap_vals = explanation.values[:, :, 1]
        else:
            shap_vals = explanation.values

        # 1. Save importance JSON
        mean_abs = np.mean(np.abs(shap_vals), axis=0)
        total_abs = np.sum(mean_abs)
        rel_imp = (mean_abs / total_abs) if total_abs > 0 else np.zeros_like(mean_abs)

        records = []
        for i, feat in enumerate(self.feature_names):
            records.append(
                {
                    "feature": feat,
                    "mean_abs_shap": float(mean_abs[i]),
                    "relative_importance": float(rel_imp[i]),
                }
            )
        records.sort(key=lambda x: x["mean_abs_shap"], reverse=True)
        for idx, rec in enumerate(records):
            rec["rank"] = idx + 1

        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "sample_size": len(validated_df),
                    "model": "RandomForestClassifier",
                    "explained_class": "Fraudulent (Class = 1)",
                    "output_scale": "probability",
                    "feature_importance": records,
                },
                f,
                indent=2,
            )

        # 2. Render and save high-contrast beeswarm summary plot
        fig, ax = plt.subplots(figsize=(10, 8), dpi=150)
        fig.patch.set_facecolor("#0F172A")
        ax.set_facecolor("#1E293B")

        # Create SHAP Explanation object for beeswarm plot
        shap_exp = shap.Explanation(
            values=shap_vals,
            base_values=explanation.base_values[:, 1] if len(explanation.base_values.shape) > 1 else explanation.base_values,
            data=validated_df.values,
            feature_names=self.feature_names,
        )

        plt.sca(ax)
        shap.plots.beeswarm(shap_exp, max_display=15, show=False)

        ax.set_title(
            f"Global Feature Attribution (SHAP Beeswarm Summary — {len(validated_df)} Samples)",
            fontsize=12,
            fontweight="bold",
            color="#F8FAFC",
            pad=15,
        )
        ax.set_xlabel("SHAP Value (Impact on Estimated Fraud Probability)", fontsize=10, color="#94A3B8")
        ax.tick_params(colors="#94A3B8")
        for spine in ax.spines.values():
            spine.set_color("#334155")

        plt.tight_layout()
        plt.savefig(output_img, facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)

        return pd.DataFrame(records)

    def plot_local_contributions(
        self,
        local_explanation: Dict[str, Any],
        max_display: int = 10,
    ) -> plt.Figure:
        """Create a clean, publication-grade horizontal bar plot of local feature contributions.

        Features pushing probability UP (higher risk) are colored Crimson (#EF4444);
        features pushing probability DOWN (lower risk) are colored Emerald (#10B981).

        Args:
            local_explanation: Dictionary returned by explain_instance().
            max_display: Maximum number of top features to display.

        Returns:
            Matplotlib Figure object ready for display in Streamlit or report export.
        """
        contributions = local_explanation["contributions"][:max_display]
        contributions = list(reversed(contributions))  # Top feature at the top

        feat_names = [f"{c['feature']} ({c['raw_value']:.2f})" for c in contributions]
        shap_values = [c["shap_value"] for c in contributions]
        colors = ["#EF4444" if val > 0 else "#10B981" for val in shap_values]

        fig, ax = plt.subplots(figsize=(9, 5.5), dpi=150)
        fig.patch.set_facecolor("#0F172A")
        ax.set_facecolor("#1E293B")

        y_pos = np.arange(len(feat_names))
        bars = ax.barh(y_pos, shap_values, color=colors, height=0.6, edgecolor="#334155", linewidth=0.8)

        # Baseline reference line at zero
        ax.axvline(0, color="#94A3B8", linestyle="--", linewidth=1.0, alpha=0.7)

        ax.set_yticks(y_pos)
        ax.set_yticklabels(feat_names, fontsize=9, color="#F8FAFC", fontweight="500")
        ax.set_xlabel("SHAP Value (Δ in Predicted Fraud Probability)", fontsize=10, color="#94A3B8")

        base_val = local_explanation["base_value"]
        pred_prob = local_explanation["predicted_probability"]
        ax.set_title(
            f"Local Attribution Breakdown: Base Prior = {base_val*100:.1f}% → Final Prob = {pred_prob*100:.2f}%",
            fontsize=11,
            fontweight="bold",
            color="#F8FAFC",
            pad=12,
        )

        ax.tick_params(colors="#94A3B8")
        for spine in ax.spines.values():
            spine.set_color("#334155")
        ax.grid(axis="x", linestyle=":", alpha=0.3, color="#64748B")

        # Value annotations on bars
        for bar, val in zip(bars, shap_values):
            x_offset = 0.003 if val >= 0 else -0.003
            ha = "left" if val >= 0 else "right"
            ax.text(
                val + x_offset,
                bar.get_y() + bar.get_height() / 2,
                f"{val:+.3f}",
                va="center",
                ha=ha,
                fontsize=8,
                color="#F8FAFC",
                fontweight="bold",
            )

        plt.tight_layout()
        return fig
