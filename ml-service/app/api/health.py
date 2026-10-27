from fastapi import APIRouter, Depends
from app.schemas.health import HealthResponse
from app.core.config import settings
from app.core.security import verify_internal_service_key

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_public_health():
    """
    Public health check endpoint returning service identity and Phase 1 readiness.
    Explicitly indicates that ML models are NOT yet initialized.
    """
    from pathlib import Path
    artifact_exists = (Path(__file__).resolve().parent.parent.parent / "models" / "champion_model.joblib").exists()
    m_status = "READY" if artifact_exists else "NOT_INITIALIZED"
    m_active = "Logistic Regression (v1.2.0-champion)" if artifact_exists else None

    return HealthResponse(
        status="OPERATIONAL",
        service="trace-ml-service",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        model_status=m_status,
        active_model=m_active,
        phase="Phase 7 — Real ML Pipeline & True SHAP"
    )

@router.get("/internal/v1/health", response_model=HealthResponse, dependencies=[Depends(verify_internal_service_key)], tags=["Internal Health"])
def get_internal_health():
    """
    Authenticated internal health check for Node.js gateway.
    Requires valid X-Internal-Service-Key header.
    """
    from pathlib import Path
    artifact_exists = (Path(__file__).resolve().parent.parent.parent / "models" / "champion_model.joblib").exists()
    m_status = "READY" if artifact_exists else "NOT_INITIALIZED"
    m_active = "Logistic Regression (v1.2.0-champion)" if artifact_exists else None

    return HealthResponse(
        status="OPERATIONAL",
        service="trace-ml-service",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        model_status=m_status,
        active_model=m_active,
        phase="Phase 7 — Real ML Pipeline & True SHAP"
    )
