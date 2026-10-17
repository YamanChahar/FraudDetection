"""Integration tests for the FraudLens FastAPI service."""

from __future__ import annotations

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from src import config

client = TestClient(app)


def test_api_health_endpoint():
    """Verify GET /api/health returns 200 with active model."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"healthy", "degraded"}
    assert data["model_loaded"] is True
    assert data["version"] == "1.0.0"


def test_api_model_info_endpoint():
    """Verify GET /api/model-info returns governance and architecture details."""
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "RandomForest" in data["model_name"] or "Classifier" in data["algorithm"]
    assert data["feature_count"] == 30
    assert "Time" in data["features"]
    assert "Amount" in data["features"]
    assert "default_thresholds" in data


def test_api_metrics_endpoint():
    """Verify GET /api/metrics returns Phase 5 evaluation benchmarks."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "selected_model" in data
    assert "random_forest" in data["models"]
    rf = data["models"]["random_forest"]
    assert "average_precision_pr_auc" in rf["metrics"]


def test_api_predict_single_legitimate_transaction():
    """Verify POST /api/predict correctly evaluates a known legitimate transaction."""
    tx_data = {
        "Time": 0.0,
        "Amount": 149.62,
        **{f"V{i}": 0.0 for i in range(1, 29)},
    }
    response = client.post("/api/predict", json={"features": tx_data})
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["fraud_probability"] <= 1.0
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_category"] in {"Low Risk", "Medium Risk", "High Risk"}
    assert "operational_recommendation" in data
    assert "disclaimer" in data


def test_api_predict_single_with_custom_thresholds():
    """Verify POST /api/predict applies custom policy threshold configurations."""
    tx_data = {
        "Time": 100.0,
        "Amount": 10.0,
        **{f"V{i}": 0.05 for i in range(1, 29)},
    }
    response = client.post(
        "/api/predict",
        json={
            "features": tx_data,
            "thresholds": {"low_threshold": 0.20, "high_threshold": 0.80},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["threshold_configuration"]["low_threshold"] == 0.20
    assert data["threshold_configuration"]["high_threshold"] == 0.80


def test_api_predict_single_invalid_threshold_order_raises_422():
    """Verify POST /api/predict rejects high_threshold <= low_threshold."""
    tx_data = {
        "Time": 100.0,
        "Amount": 10.0,
        **{f"V{i}": 0.05 for i in range(1, 29)},
    }
    response = client.post(
        "/api/predict",
        json={
            "features": tx_data,
            "thresholds": {"low_threshold": 0.60, "high_threshold": 0.40},
        },
    )
    assert response.status_code == 422


def test_api_predict_single_missing_features_raises_422():
    """Verify POST /api/predict rejects payloads missing required columns."""
    incomplete_data = {"Time": 100.0, "Amount": 50.0}  # Missing V1-V28
    response = client.post("/api/predict", json={"features": incomplete_data})
    assert response.status_code == 422


def test_api_predict_single_non_numeric_feature_raises_422():
    """Verify POST /api/predict rejects non-numeric feature values."""
    invalid_data = {
        "Time": "not-a-number",
        "Amount": 50.0,
        **{f"V{i}": 0.0 for i in range(1, 29)},
    }
    response = client.post("/api/predict", json={"features": invalid_data})
    assert response.status_code == 422


def test_api_predict_batch_csv_upload():
    """Verify POST /api/predict/batch processes a valid multi-row CSV file."""
    sample_path = config.DATA_DIR / "sample_batch_transactions.csv"
    assert sample_path.exists()

    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/predict/batch",
            files={"file": ("sample.csv", f, "text/csv")},
        )

    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["total"] == 10
    assert len(data["results"]) == 10
    assert "fraud_probability" in data["results"][0]
    assert "risk_score" in data["results"][0]


def test_api_predict_batch_with_custom_thresholds():
    """Verify POST /api/predict/batch accepts query threshold overrides."""
    sample_path = config.DATA_DIR / "sample_batch_transactions.csv"
    assert sample_path.exists()

    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/predict/batch?low_threshold=0.25&high_threshold=0.75",
            files={"file": ("sample.csv", f, "text/csv")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total"] == 10


def test_api_predict_batch_rejects_non_csv():
    """Verify POST /api/predict/batch rejects non-CSV files."""
    response = client.post(
        "/api/predict/batch",
        files={"file": ("test.txt", io.BytesIO(b"invalid data"), "text/plain")},
    )
    assert response.status_code == 400


def test_api_predict_batch_empty_csv_raises_422():
    """Verify POST /api/predict/batch rejects an empty CSV file."""
    empty_csv = io.BytesIO(b"")
    response = client.post(
        "/api/predict/batch",
        files={"file": ("empty.csv", empty_csv, "text/csv")},
    )
    assert response.status_code in {400, 422}


def test_api_predict_batch_missing_columns_raises_422():
    """Verify POST /api/predict/batch rejects CSV missing required columns."""
    partial_csv = io.BytesIO(b"Time,Amount\n100.0,50.0\n")
    response = client.post(
        "/api/predict/batch",
        files={"file": ("partial.csv", partial_csv, "text/csv")},
    )
    assert response.status_code == 422
    assert "Missing required column" in response.json()["detail"]


def test_api_sample_batch_download():
    """Verify GET /api/sample-batch returns downloadable CSV stream."""
    response = client.get("/api/sample-batch")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert b"Time,V1,V2" in response.content


def test_api_global_explanations():
    """Verify GET /api/explanations/global returns precomputed feature rankings."""
    response = client.get("/api/explanations/global")
    assert response.status_code == 200
    data = response.json()
    assert data["explained_class"] == "Fraudulent (Class = 1)"
    assert len(data["feature_importance"]) == 30
    assert data["feature_importance"][0]["rank"] == 1


def test_api_global_summary_plot_stream():
    """Verify GET /api/explanations/summary-plot streams valid PNG image bytes."""
    response = client.get("/api/explanations/summary-plot")
    assert response.status_code == 200
    assert "image/png" in response.headers["content-type"]
    assert len(response.content) > 1000  # Valid image payload


def test_api_local_explanation():
    """Verify POST /api/explanations/local returns SHAP breakdown for an instance."""
    tx_data = {
        "Time": 406.0,
        "Amount": 0.0,
        **{f"V{i}": -1.5 for i in range(1, 29)},
    }
    response = client.post("/api/explanations/local", json={"features": tx_data, "top_n": 5})
    assert response.status_code == 200
    data = response.json()
    assert "base_value" in data
    assert "predicted_probability" in data
    assert "top_risk_increasing" in data
    assert "top_risk_decreasing" in data


def test_api_transactions_explorer():
    """Verify GET /api/transactions/explorer returns filtered transaction list."""
    response = client.get("/api/transactions/explorer?class_filter=all&limit=10")
    if config.DATASET_PATH.exists():
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert len(data["transactions"]) <= 10
        if len(data["transactions"]) > 0:
            first = data["transactions"][0]
            assert "Class" in first
            assert "fraud_probability" in first
            assert "risk_score" in first


def test_api_transactions_explorer_invalid_class_filter_raises_422():
    """Verify GET /api/transactions/explorer validates class_filter query parameter."""
    response = client.get("/api/transactions/explorer?class_filter=invalid_class")
    assert response.status_code == 422


def test_api_cors_headers():
    """Verify CORS middleware responds with appropriate headers for local Vite origins."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
