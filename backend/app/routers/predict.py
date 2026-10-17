"""Single and batch transaction risk scoring endpoints."""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
import pandas as pd

from src import config
from src.risk_engine import RiskThresholds
from backend.app.dependencies import ServiceContainer
from backend.app.schemas import (
    BatchPredictionResponse,
    BatchPredictionSummary,
    SinglePredictionRequest,
    SinglePredictionResponse,
)

router = APIRouter(prefix="/api", tags=["Predictions"])


@router.post("/predict", response_model=SinglePredictionResponse)
def predict_single(payload: SinglePredictionRequest) -> SinglePredictionResponse:
    """Score an individual transaction across all 30 canonical features."""
    try:
        predictor = ServiceContainer.get_predictor()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {e}")

    # Build thresholds if custom passed
    thresholds = None
    if payload.thresholds:
        thresholds = RiskThresholds(
            low_threshold=payload.thresholds.low_threshold,
            high_threshold=payload.thresholds.high_threshold,
        )

    try:
        result = predictor.predict_single(payload.features, thresholds=thresholds)
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Inference error: {err}")

    return SinglePredictionResponse(
        fraud_probability=result["fraud_probability"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        operational_recommendation=result["operational_recommendation"],
        model_name=result["model_name"],
        threshold_configuration=result["threshold_configuration"],
        disclaimer=result["regulatory_disclaimer"],
    )


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    file: UploadFile = File(..., description="CSV file with 30 required columns: Time, V1-V28, Amount"),
    low_threshold: Optional[float] = None,
    high_threshold: Optional[float] = None,
) -> BatchPredictionResponse:
    """Execute high-throughput batch risk assessment from an uploaded CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    try:
        contents = await file.read()
        # Limit batch size to 5MB to avoid memory exhaustion
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum supported batch size is 5MB.")

        batch_df = pd.read_csv(io.BytesIO(contents))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Malformed CSV file: {e}")

    if batch_df.empty:
        raise HTTPException(status_code=422, detail="Uploaded CSV file contains no rows.")

    # Validate required columns
    missing_cols = [c for c in config.FEATURE_COLUMNS if c not in batch_df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=422,
            detail=f"Schema validation failed. Missing required column(s): {missing_cols}",
        )

    try:
        predictor = ServiceContainer.get_predictor()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {e}")

    thresholds = None
    if low_threshold is not None and high_threshold is not None:
        thresholds = RiskThresholds(low_threshold=low_threshold, high_threshold=high_threshold)

    try:
        scored_df = predictor.predict_batch(
            batch_df,
            thresholds=thresholds,
            include_input_features=True,
        )
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Batch inference error: {err}")

    total = len(scored_df)
    low_count = int((scored_df["risk_category"] == "Low Risk").sum())
    med_count = int((scored_df["risk_category"] == "Medium Risk").sum())
    high_count = int((scored_df["risk_category"] == "High Risk").sum())

    summary = BatchPredictionSummary(
        total=total,
        low_risk_count=low_count,
        medium_risk_count=med_count,
        high_risk_count=high_count,
        low_risk_pct=round(low_count / total * 100, 2) if total > 0 else 0.0,
        medium_risk_pct=round(med_count / total * 100, 2) if total > 0 else 0.0,
        high_risk_pct=round(high_count / total * 100, 2) if total > 0 else 0.0,
    )

    # Convert DataFrame to JSON-safe dictionary records
    results = scored_df.to_dict(orient="records")
    columns = list(scored_df.columns)

    return BatchPredictionResponse(
        summary=summary,
        results=results,
        columns=columns,
    )


@router.get("/sample-batch")
def download_sample_batch() -> Response:
    """Download a verified 10-row sample CSV containing all 30 canonical features."""
    sample_path = config.DATA_DIR / "sample_batch_transactions.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="Sample batch CSV file not found on server.")

    with open(sample_path, "rb") as f:
        data = f.read()

    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_batch_transactions.csv"},
    )
