import pytest
from app.core.model_manager import model_manager

def test_risk_score_boundaries_exact():
    """
    Validates Task 1 risk score boundary consistency on ML Service:
    - LOW:      0 – 30
    - MEDIUM:  31 – 70
    - HIGH:    71 – 89
    - CRITICAL: 90 – 100
    """
    # 0 -> LOW
    assert model_manager.calculate_risk_category(0) == "LOW"
    # 30 -> LOW
    assert model_manager.calculate_risk_category(30) == "LOW"

    # 31 -> MEDIUM
    assert model_manager.calculate_risk_category(31) == "MEDIUM"
    # 70 -> MEDIUM
    assert model_manager.calculate_risk_category(70) == "MEDIUM"

    # 71 -> HIGH
    assert model_manager.calculate_risk_category(71) == "HIGH"
    # 89 -> HIGH
    assert model_manager.calculate_risk_category(89) == "HIGH"

    # 90 -> CRITICAL
    assert model_manager.calculate_risk_category(90) == "CRITICAL"
    # 100 -> CRITICAL
    assert model_manager.calculate_risk_category(100) == "CRITICAL"


def test_risk_score_boundaries_clamping_and_edges():
    # Below 0
    assert model_manager.calculate_risk_category(-1) == "LOW"
    assert model_manager.calculate_risk_category(-100) == "LOW"

    # Above 100
    assert model_manager.calculate_risk_category(101) == "CRITICAL"
    assert model_manager.calculate_risk_category(500) == "CRITICAL"
