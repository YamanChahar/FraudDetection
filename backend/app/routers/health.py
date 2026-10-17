"""Health and service availability endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from src import config
from backend.app.dependencies import ServiceContainer
from backend.app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return service status, model availability, and dataset connectivity."""
    model_loaded = False
    model_name = None

    try:
        predictor = ServiceContainer.get_predictor()
        model_loaded = True
        model_name = predictor.model_name
    except Exception:
        model_loaded = False

    dataset_connected = config.DATASET_PATH.exists()

    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        model_loaded=model_loaded,
        model_name=model_name,
        dataset_connected=dataset_connected,
        version="1.0.0",
    )
