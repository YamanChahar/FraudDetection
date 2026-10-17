"""SHAP explainability endpoints for global and local feature attribution."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response
from src import config
from backend.app.dependencies import ServiceContainer
from backend.app.schemas import (
    GlobalExplanationResponse,
    LocalExplanationRequest,
    LocalExplanationResponse,
)

router = APIRouter(prefix="/api/explanations", tags=["Explainability"])


@router.get("/global", response_model=GlobalExplanationResponse)
def get_global_explanations() -> GlobalExplanationResponse:
    """Return precomputed global SHAP feature importance rankings and relative shares."""
    report = ServiceContainer.get_global_shap_report()
    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Global SHAP report not found. Ensure Phase 8 explainability was run.",
        )

    return GlobalExplanationResponse(
        sample_size=report.get("sample_size", 0),
        model=report.get("model", "RandomForestClassifier"),
        explained_class=report.get("explained_class", "Fraudulent (Class = 1)"),
        output_scale=report.get("output_scale", "probability"),
        feature_importance=report.get("feature_importance", []),
    )


@router.get("/summary-plot")
def get_global_summary_plot() -> Response:
    """Serve the precomputed global SHAP beeswarm summary plot image."""
    img_path = config.REPORTS_DIR / "shap_global_summary.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Global SHAP plot image not found.")

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    return Response(content=img_bytes, media_type="image/png")


@router.post("/local", response_model=LocalExplanationResponse)
def explain_local_instance(payload: LocalExplanationRequest) -> LocalExplanationResponse:
    """Compute local SHAP attribution values and top drivers for an individual transaction."""
    try:
        explainer = ServiceContainer.get_explainer()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Explainer unavailable: {e}")

    try:
        res = explainer.explain_instance(payload.features, top_n=payload.top_n)
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Explanation computation error: {err}")

    return LocalExplanationResponse(
        base_value=res["base_value"],
        predicted_probability=res["predicted_probability"],
        sum_shap_values=res["sum_shap_values"],
        top_risk_increasing=res["top_risk_increasing"],
        top_risk_decreasing=res["top_risk_decreasing"],
        contributions=res["contributions"],
        explained_class=res["explained_class"],
        output_scale=res["output_scale"],
    )
