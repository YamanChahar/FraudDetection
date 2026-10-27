from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional, Dict, Any
from app.schemas.inference import (
    TransactionFeatures,
    PredictionResponse,
    BatchPredictRequest,
    BatchPredictResponse,
)
from app.core.model_manager import model_manager
from app.core.config import settings

router = APIRouter()

def verify_internal_auth(x_internal_service_key: Optional[str] = Header(None)):
    if x_internal_service_key and x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service credentials",
        )

@router.post(
    "/internal/v1/predict",
    response_model=PredictionResponse,
    summary="Predict transaction fraud risk with SHAP explainability",
)
@router.post("/predict", response_model=PredictionResponse, include_in_schema=False)
def predict(
    payload: TransactionFeatures,
    x_internal_service_key: Optional[str] = Header(None),
):
    verify_internal_auth(x_internal_service_key)
    try:
        features_dict = payload.model_dump()
        result = model_manager.predict_single(features_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}",
        )

@router.post(
    "/internal/v1/batch-predict",
    response_model=BatchPredictResponse,
    summary="Batch inference for dataset testing jobs",
)
@router.post("/batch-predict", response_model=BatchPredictResponse, include_in_schema=False)
def batch_predict(
    payload: BatchPredictRequest,
    x_internal_service_key: Optional[str] = Header(None),
):
    verify_internal_auth(x_internal_service_key)
    try:
        result = model_manager.predict_batch(payload.transactions)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference execution error: {str(e)}",
        )

@router.get(
    "/internal/v1/model/metadata",
    summary="Retrieve active champion model metadata and benchmark performance metrics",
)
@router.get("/model/metadata", include_in_schema=False)
def get_model_metadata(x_internal_service_key: Optional[str] = Header(None)):
    verify_internal_auth(x_internal_service_key)
    try:
        return model_manager.get_metadata()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model metadata retrieval error: {str(e)}",
        )
