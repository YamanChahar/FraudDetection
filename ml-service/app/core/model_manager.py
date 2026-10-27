import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
from app.core.preprocessing import FEATURE_NAMES, TransactionFeatureValidator
from app.core.shap_explainer import FraudShapExplainer

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
ARTIFACT_PATH = MODELS_DIR / "champion_model.joblib"

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.loaded = False
            cls._instance.artifact = None
            cls._instance.model = None
            cls._instance.preprocessor = None
            cls._instance.explainer = None
            cls._instance.validator = TransactionFeatureValidator(FEATURE_NAMES)
        return cls._instance

    def load_model(self):
        """Loads champion pipeline artifact and warms up SHAP explainer."""
        if self.loaded:
            return

        if not ARTIFACT_PATH.exists():
            raise FileNotFoundError(f"Model artifact not found at {ARTIFACT_PATH}. Run trainer first.")

        print(f"[TRACE ML] Loading champion artifact from {ARTIFACT_PATH}...")
        self.artifact = joblib.load(ARTIFACT_PATH)
        self.model = self.artifact["model"]
        self.preprocessor = self.artifact["preprocessor"]
        self.background_data = self.artifact["background_data"]

        print("[TRACE ML] Initializing SHAP explainer...")
        self.explainer = FraudShapExplainer(
            model=self.model,
            background_data=self.background_data,
            feature_names=FEATURE_NAMES,
        )
        self.loaded = True
        print("[TRACE ML] Champion model and SHAP explainer ready.")

    def calculate_risk_category(self, score: int) -> str:
        """Centralized risk classification threshold logic."""
        if score <= 30:
            return "LOW"
        elif score <= 70:
            return "MEDIUM"
        elif score <= 89:
            return "HIGH"
        else:
            return "CRITICAL"

    def predict_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Runs single-transaction feature validation, inference, and SHAP attribution."""
        self.load_model()
        t0 = time.perf_counter()

        # 1. Feature normalization and ordering
        df = self.validator.transform(features)
        
        # 2. Scaling
        X_trans = self.preprocessor.transform(df)

        # 3. Model inference
        prob = float(self.model.predict_proba(X_trans)[0, 1])
        label = int(self.model.predict(X_trans)[0])

        # 4. Normalized Risk Score (0 - 100)
        # Scaled smoothly to ensure meaningful spread across risk bands
        risk_score = int(round(prob * 100))
        risk_score = max(0, min(100, risk_score))
        risk_level = self.calculate_risk_category(risk_score)

        # 5. True SHAP explainability
        raw_feat_dict = {col: float(df[col].iloc[0]) for col in FEATURE_NAMES}
        shap_res = self.explainer.explain_instance(
            transformed_row=X_trans[0],
            raw_features=raw_feat_dict,
            predicted_prob=prob,
        )

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "fraud_probability": round(prob, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "prediction_label": label,
            "model_version": self.artifact.get("model_version", "v1.2.0-champion"),
            "model_name": self.artifact.get("model_name", "Champion Model"),
            "latency_ms": latency_ms,
            "shap_explanation": shap_res,
        }

    def predict_batch(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch inference for dataset testing."""
        self.load_model()
        t0 = time.perf_counter()

        df = self.validator.transform(records)
        X_trans = self.preprocessor.transform(df)

        probs = self.model.predict_proba(X_trans)[:, 1]
        labels = self.model.predict(X_trans)

        results = []
        for i in range(len(records)):
            p = float(probs[i])
            score = int(round(p * 100))
            score = max(0, min(100, score))
            level = self.calculate_risk_category(score)
            results.append({
                "record_index": i,
                "fraud_probability": round(p, 4),
                "risk_score": score,
                "risk_level": level,
                "prediction_label": int(labels[i]),
            })

        total_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "predictions": results,
            "total_records": len(records),
            "total_latency_ms": total_latency_ms,
            "avg_latency_ms": round(total_latency_ms / max(len(records), 1), 3),
            "model_version": self.artifact.get("model_version", "v1.2.0-champion"),
        }

    def get_metadata(self) -> Dict[str, Any]:
        self.load_model()
        return {
            "model_name": self.artifact.get("model_name"),
            "model_version": self.artifact.get("model_version"),
            "algorithm": self.artifact.get("algorithm"),
            "metrics": self.artifact.get("metrics"),
            "all_candidates": self.artifact.get("all_candidates", []),
            "feature_names": FEATURE_NAMES,
            "created_at": self.artifact.get("created_at"),
            "status": "ACTIVE_PRODUCTION",
        }

model_manager = ModelManager()
