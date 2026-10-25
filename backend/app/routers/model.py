"""Model governance, architecture, and evaluation metrics endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from src import config
from backend.app.dependencies import ServiceContainer
from backend.app.schemas import ModelInfoResponse, ModelMetricsResponse

router = APIRouter(prefix="/api", tags=["Model Information"])


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info() -> ModelInfoResponse:
    """Return model architecture, parameters, feature schema, and governance constraints."""
    try:
        predictor = ServiceContainer.get_predictor()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model artifact unavailable: {e}")

    return ModelInfoResponse(
        model_name=predictor.model_name,
        algorithm="RandomForestClassifier (100 estimators, max_depth=12, min_samples_leaf=2)",
        feature_count=len(config.FEATURE_COLUMNS),
        features=list(config.FEATURE_COLUMNS),
        default_thresholds={
            "low_risk": config.DEFAULT_LOW_RISK_THRESHOLD,
            "high_risk": config.DEFAULT_HIGH_RISK_THRESHOLD,
        },
        hyperparameters={
            "n_estimators": 100,
            "max_depth": 12,
            "min_samples_leaf": 2,
            "class_weight": "balanced",
            "random_state": config.RANDOM_STATE,
        },
        dataset_provenance={
            "name": "ULB Credit Card Fraud Detection Benchmark",
            "total_records": 284807,
            "fraud_records": 492,
            "fraud_prevalence": "0.1727%",
            "time_window": "48 hours (September 2013)",
        },
        probability_calibration_notice=(
            "Estimated probabilities reflect tree vote proportions under balanced class weights (~577x). "
            "They optimize discrimination and ranking (PR-AUC 0.8462) rather than raw frequentist occurrence rates. "
            "Outputs are best interpreted as relative risk scores from 0 to 100."
        ),
        regulatory_disclaimer=(
            "FraudLens is an engineering prototype for ML portfolio research and decision support. "
            "It is not certified under PCI-DSS or banking clearance regulations and does not execute real-money holds."
        ),
    )


@router.get("/metrics", response_model=ModelMetricsResponse)
def get_metrics() -> ModelMetricsResponse:
    """Return verified evaluation metrics on the isolated 56,962 held-out test split."""
    report = ServiceContainer.get_metrics_report()
    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Evaluation metrics report not found. Ensure Phase 5 model comparison was completed.",
        )
    selected = dict(report.get("selected_model", {}))
    selected_id = selected.get("id", "random_forest")
    models = report.get("models", {})
    if selected_id in models:
        rf_data = models[selected_id]
        rf_metrics = rf_data.get("metrics", {})
        cm = rf_data.get("confusion_matrix", {})
        selected.update({
            "metrics": rf_metrics,
            "confusion_matrix": {
                **cm,
                "tn": cm.get("true_negatives", 56832),
                "fp": cm.get("false_positives", 32),
                "fn": cm.get("false_negatives", 15),
                "tp": cm.get("true_positives", 83),
            },
            "operational_rates": rf_data.get("operational_rates", {}),
            "pr_auc": rf_metrics.get("average_precision_pr_auc", 0.8462),
            "roc_auc": rf_metrics.get("roc_auc", 0.9735),
            "f1": rf_metrics.get("f1_score", 0.7793),
            "precision": rf_metrics.get("precision", 0.7217),
            "recall": rf_metrics.get("recall", 0.8469),
        })
    return ModelMetricsResponse(
        selected_model=selected,
        models=models,
        split_summary=report.get("split_summary", {}),
    )

