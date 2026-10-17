"""Risk scoring and classification engine for the Fraud Detection system.

Converts raw fraud probability outputs into calibrated, business-interpretable
risk scores (0–100) and operational action tiers.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any, Dict, Literal, Optional, Union

import numpy as np

from src import config

RiskCategory = Literal["Low Risk", "Medium Risk", "High Risk"]


@dataclass(frozen=True)
class RiskThresholds:
    """Configurable risk boundary thresholds.

    Demonstration defaults:
    - Low Risk: probability < 0.30
    - Medium Risk: 0.30 <= probability < 0.70
    - High Risk: probability >= 0.70
    """

    low_threshold: float = config.DEFAULT_LOW_RISK_THRESHOLD
    high_threshold: float = config.DEFAULT_HIGH_RISK_THRESHOLD

    def __post_init__(self) -> None:
        if not (0.0 < self.low_threshold < self.high_threshold < 1.0):
            raise ValueError(
                f"Invalid threshold ordering: low_threshold ({self.low_threshold}) "
                f"must be strictly less than high_threshold ({self.high_threshold}) "
                "and both must reside strictly in (0.0, 1.0)."
            )


DEFAULT_THRESHOLDS = RiskThresholds()


def validate_probability(probability: Union[float, int, np.floating]) -> float:
    """Validate that probability is a finite numeric value within [0.0, 1.0].

    Args:
        probability: Raw model probability output.

    Returns:
        float: Validated float probability.

    Raises:
        TypeError: If probability is not a real number.
        ValueError: If probability is NaN, infinite, or outside [0.0, 1.0].
    """
    if not isinstance(probability, (float, int, np.floating, np.integer)):
        raise TypeError(
            f"Probability must be a numeric float or int, got type {type(probability).__name__}."
        )

    prob = float(probability)

    if math.isnan(prob) or math.isinf(prob):
        raise ValueError(f"Probability must be finite, received: {prob}.")

    if not (0.0 <= prob <= 1.0):
        raise ValueError(
            f"Probability must reside strictly within [0.0, 1.0], received: {prob}."
        )

    return prob


def calculate_risk_score(probability: float) -> int:
    """Convert a validated probability into an integer risk score in [0, 100].

    Uses standard rounding (`round(prob * 100)`), bounded strictly in range [0, 100].

    Args:
        probability: Validated fraud probability in [0.0, 1.0].

    Returns:
        int: Risk score from 0 (lowest risk) to 100 (highest risk).
    """
    prob = validate_probability(probability)
    score = int(round(prob * 100.0))
    return max(0, min(100, score))


def determine_risk_category(
    probability: float,
    thresholds: Optional[RiskThresholds] = None,
) -> RiskCategory:
    """Assign transaction to Low, Medium, or High Risk category.

    Args:
        probability: Validated fraud probability.
        thresholds: Configurable decision thresholds. Defaults to DEFAULT_THRESHOLDS.

    Returns:
        RiskCategory: 'Low Risk', 'Medium Risk', or 'High Risk'.
    """
    prob = validate_probability(probability)
    cfg = thresholds or DEFAULT_THRESHOLDS

    if prob < cfg.low_threshold:
        return "Low Risk"
    elif prob < cfg.high_threshold:
        return "Medium Risk"
    else:
        return "High Risk"


def get_operational_recommendation(risk_category: RiskCategory) -> str:
    """Provide operational guidance associated with each risk tier.

    Args:
        risk_category: 'Low Risk', 'Medium Risk', or 'High Risk'.

    Returns:
        str: Actionable policy recommendation for compliance / operations.
    """
    if risk_category == "Low Risk":
        return "Automated Approval: Minimal fraud probability. Process transaction automatically."
    elif risk_category == "Medium Risk":
        return "Step-Up Verification: Elevated risk pattern. Require 2FA OTP or route to secondary review."
    elif risk_category == "High Risk":
        return "Immediate Interception: Severe fraud risk. Hold/decline transaction and alert cardholder."
    else:
        return "Unknown risk status."


def assess_risk(
    probability: float,
    thresholds: Optional[RiskThresholds] = None,
) -> Dict[str, Any]:
    """Calculate risk score, category, and recommendation for a single probability.

    Args:
        probability: Model estimated fraud probability in [0.0, 1.0].
        thresholds: Optional custom thresholds.

    Returns:
        Dict[str, Any]: Complete risk assessment payload.
    """
    prob = validate_probability(probability)
    cfg = thresholds or DEFAULT_THRESHOLDS

    score = calculate_risk_score(prob)
    category = determine_risk_category(prob, thresholds=cfg)
    recommendation = get_operational_recommendation(category)

    return {
        "fraud_probability": round(prob, 4),
        "risk_score": score,
        "risk_category": category,
        "operational_recommendation": recommendation,
        "threshold_configuration": {
            "low_threshold": cfg.low_threshold,
            "high_threshold": cfg.high_threshold,
        },
        "regulatory_disclaimer": (
            "Educational portfolio demonstration score. Not a certified banking decision engine."
        ),
    }
