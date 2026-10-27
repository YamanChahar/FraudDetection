import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_health_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] in ["OPERATIONAL", "UP"]

    res_internal = client.get("/internal/v1/health", headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY})
    assert res_internal.status_code == 200
    assert res_internal.json()["status"] in ["OPERATIONAL", "UP"]

def test_predict_single_legit_transaction():
    payload = {
        "Time": 100.0,
        "Amount": 25.50,
        "V1": 0.5,
        "V2": -0.2,
        "V3": 0.1,
    }
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    res = client.post("/internal/v1/predict", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "fraud_probability" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "shap_explanation" in data
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "top_contributing_features" in data["shap_explanation"]
    assert len(data["shap_explanation"]["top_contributing_features"]) > 0

def test_predict_single_fraud_anomaly():
    # Strong anomaly in V14, V12, V10
    payload = {
        "Time": 400.0,
        "Amount": 2999.00,
        "V14": -8.5,
        "V12": -6.2,
        "V10": -5.1,
        "V4": 4.8,
    }
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    res = client.post("/internal/v1/predict", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    # Risk score should be elevated
    assert data["risk_score"] >= 70
    assert data["risk_level"] in ["HIGH", "CRITICAL"]

def test_batch_predict():
    payload = {
        "transactions": [
            {"Time": 10.0, "Amount": 15.0},
            {"Time": 20.0, "Amount": 1200.0, "V14": -9.0},
        ]
    }
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    res = client.post("/internal/v1/batch-predict", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 2
    assert len(data["predictions"]) == 2

def test_model_metadata():
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    res = client.get("/internal/v1/model/metadata", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "model_name" in data
    assert "model_version" in data
    assert "metrics" in data
    assert data["metrics"]["pr_auc"] > 0.0
