import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_public_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert data["service"] == "trace-ml-service"
    assert data["model_status"] in ["READY", "NOT_INITIALIZED"]

def test_internal_health_endpoint_authenticated():
    response = client.get(
        "/internal/v1/health",
        headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert data["model_status"] in ["READY", "NOT_INITIALIZED"]

def test_internal_health_endpoint_unauthenticated():
    response = client.get("/internal/v1/health")
    assert response.status_code == 422  # Missing required header

def test_internal_health_endpoint_invalid_key():
    response = client.get(
        "/internal/v1/health",
        headers={"X-Internal-Service-Key": "invalid_wrong_key"}
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]
