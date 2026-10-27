import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.core.preprocessing import FEATURE_NAMES

class FraudShapExplainer:
    def __init__(self, model, background_data: np.ndarray, feature_names: List[str] = None):
        self.model = model
        self.feature_names = feature_names or FEATURE_NAMES
        self.background_data = background_data
        
        # Instantiate TreeExplainer for tree models, or generic Explainer
        try:
            self.explainer = shap.TreeExplainer(model)
        except Exception:
            self.explainer = shap.LinearExplainer(model, background_data)

    def explain_instance(self, transformed_row: np.ndarray, raw_features: Dict[str, float], predicted_prob: float) -> Dict[str, Any]:
        """Calculates SHAP feature contributions for a single transaction instance."""
        if transformed_row.ndim == 1:
            transformed_row = transformed_row.reshape(1, -1)

        raw_shap = self.explainer(transformed_row)
        shap_values = raw_shap.values
        if shap_values.ndim == 3:
            # Multi-class or binary probability [sample, feature, class] -> class 1 (fraud)
            instance_shap = shap_values[0, :, 1]
            base_val = float(raw_shap.base_values[0, 1]) if raw_shap.base_values.ndim > 1 else float(raw_shap.base_values[0])
        else:
            instance_shap = shap_values[0]
            base_val = float(raw_shap.base_values[0])

        contributions = []
        for idx, feat in enumerate(self.feature_names):
            phi = float(instance_shap[idx])
            raw_val = float(raw_features.get(feat, 0.0))
            direction = "INCREASES_RISK" if phi > 0 else "DECREASES_RISK"
            
            contributions.append({
                "feature": feat,
                "raw_value": round(raw_val, 4),
                "shap_value": round(phi, 4),
                "absolute_impact": round(abs(phi), 4),
                "direction": direction,
            })

        # Sort by absolute impact
        contributions.sort(key=lambda x: x["absolute_impact"], reverse=True)
        top_factors = contributions[:8]

        # Generate human-readable narrative explanation
        top_positive = [f"{c['feature']} ({c['raw_value']:.2f}, impact +{c['shap_value']:.3f})" for c in top_factors if c['direction'] == 'INCREASES_RISK'][:3]
        top_negative = [f"{c['feature']} ({c['raw_value']:.2f}, impact {c['shap_value']:.3f})" for c in top_factors if c['direction'] == 'DECREASES_RISK'][:2]

        narrative_parts = []
        if top_positive:
            narrative_parts.append(f"Elevated risk driven primarily by anomalies in: {', '.join(top_positive)}.")
        if top_negative:
            narrative_parts.append(f"Risk mitigated by typical baseline patterns in: {', '.join(top_negative)}.")
        if not narrative_parts:
            narrative_parts.append("Transaction characteristics conform closely to standard baseline transaction behaviour.")

        summary_text = " ".join(narrative_parts)

        return {
            "base_value": round(base_val, 4),
            "predicted_probability": round(predicted_prob, 4),
            "top_contributing_features": top_factors,
            "all_contributions": contributions,
            "explanation_summary": summary_text,
            "disclaimer": "SHAP values represent statistical attribution estimates from the trained risk model and do not constitute proof of fraud.",
        }
