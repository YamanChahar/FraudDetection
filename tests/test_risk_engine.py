"""Unit tests for the Risk Scoring Engine (src/risk_engine.py)."""

import math
import numpy as np
import pytest

from src.risk_engine import (
    DEFAULT_THRESHOLDS,
    RiskThresholds,
    assess_risk,
    calculate_risk_score,
    determine_risk_category,
    get_operational_recommendation,
    validate_probability,
)


def test_validate_probability_valid_ranges():
    """Verify that probabilities in [0.0, 1.0] pass validation."""
    assert validate_probability(0.0) == 0.0
    assert validate_probability(1.0) == 1.0
    assert validate_probability(0.5) == 0.5
    assert validate_probability(np.float64(0.42)) == 0.42


def test_validate_probability_invalid_bounds():
    """Verify that negative numbers and values > 1.0 raise ValueError."""
    with pytest.raises(ValueError) as exc:
        validate_probability(-0.001)
    assert "strictly within [0.0, 1.0]" in str(exc.value)

    with pytest.raises(ValueError) as exc:
        validate_probability(1.001)
    assert "strictly within [0.0, 1.0]" in str(exc.value)


def test_validate_probability_non_finite_and_invalid_types():
    """Verify that NaN, Inf, and non-numeric types raise appropriate errors."""
    with pytest.raises(ValueError) as exc:
        validate_probability(float("nan"))
    assert "must be finite" in str(exc.value)

    with pytest.raises(ValueError) as exc:
        validate_probability(float("inf"))
    assert "must be finite" in str(exc.value)

    with pytest.raises(TypeError) as exc:
        validate_probability("0.5")  # type: ignore
    assert "must be a numeric float or int" in str(exc.value)


def test_calculate_risk_score():
    """Verify exact rounding and integer bounds from 0 to 100."""
    assert calculate_risk_score(0.0) == 0
    assert calculate_risk_score(1.0) == 100
    assert calculate_risk_score(0.1234) == 12
    assert calculate_risk_score(0.126) == 13
    assert calculate_risk_score(0.999) == 100
    assert calculate_risk_score(0.001) == 0


def test_determine_risk_category_boundary_cases():
    """Verify exact boundary behavior for Low, Medium, and High Risk.

    Default demonstration thresholds:
    - Low Risk: p < 0.30
    - Medium Risk: 0.30 <= p < 0.70
    - High Risk: p >= 0.70
    """
    # Low Risk boundary
    assert determine_risk_category(0.0) == "Low Risk"
    assert determine_risk_category(0.299) == "Low Risk"

    # Exactly at lower threshold -> Medium Risk
    assert determine_risk_category(0.30) == "Medium Risk"
    assert determine_risk_category(0.301) == "Medium Risk"
    assert determine_risk_category(0.50) == "Medium Risk"
    assert determine_risk_category(0.699) == "Medium Risk"

    # Exactly at upper threshold -> High Risk
    assert determine_risk_category(0.70) == "High Risk"
    assert determine_risk_category(0.701) == "High Risk"
    assert determine_risk_category(1.0) == "High Risk"


def test_custom_thresholds():
    """Verify custom risk thresholds configuration and validation."""
    custom_cfg = RiskThresholds(low_threshold=0.20, high_threshold=0.80)
    assert determine_risk_category(0.25, thresholds=custom_cfg) == "Medium Risk"
    assert determine_risk_category(0.19, thresholds=custom_cfg) == "Low Risk"
    assert determine_risk_category(0.85, thresholds=custom_cfg) == "High Risk"

    # Invalid threshold order must raise ValueError
    with pytest.raises(ValueError) as exc:
        RiskThresholds(low_threshold=0.70, high_threshold=0.30)
    assert "must be strictly less than" in str(exc.value)


def test_assess_risk_payload_structure():
    """Verify full risk assessment dictionary schema and contents."""
    result = assess_risk(0.4567)
    assert result["fraud_probability"] == 0.4567
    assert result["risk_score"] == 46
    assert result["risk_category"] == "Medium Risk"
    assert "Step-Up Verification" in result["operational_recommendation"]
    assert result["threshold_configuration"]["low_threshold"] == 0.30
    assert result["threshold_configuration"]["high_threshold"] == 0.70
    assert "Educational portfolio" in result["regulatory_disclaimer"]
