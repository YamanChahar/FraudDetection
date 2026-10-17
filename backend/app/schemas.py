"""Pydantic request and response validation schemas for the FraudLens REST API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="Service status (e.g., 'healthy')")
    model_loaded: bool = Field(..., description="True if the champion ML model is active and loaded")
    model_name: Optional[str] = Field(None, description="Name of the active model pipeline")
    dataset_connected: bool = Field(..., description="True if creditcard.csv dataset is accessible")
    version: str = Field("1.0.0", description="API Service Version")


class ThresholdsConfig(BaseModel):
    """Operational risk thresholds configuration."""
    low_threshold: float = Field(
        0.30,
        ge=0.01,
        le=0.50,
        description="Low risk threshold (p < T1) for automated approval",
    )
    high_threshold: float = Field(
        0.70,
        ge=0.51,
        le=0.99,
        description="High risk threshold (p >= T2) for immediate interception",
    )

    @field_validator("high_threshold")
    @classmethod
    def validate_threshold_order(cls, v: float, info: Any) -> float:
        low = info.data.get("low_threshold", 0.30)
        if v <= low:
            raise ValueError(f"high_threshold ({v}) must be strictly greater than low_threshold ({low})")
        return v


class SinglePredictionRequest(BaseModel):
    """Single transaction scoring payload containing all 30 canonical features."""
    features: Dict[str, float] = Field(
        ...,
        description="Dictionary containing all 30 features: Time, V1-V28, and Amount",
    )
    thresholds: Optional[ThresholdsConfig] = None


class SinglePredictionResponse(BaseModel):
    """Risk scoring and classification verdict response."""
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=0, le=100)
    risk_category: str = Field(..., description="'Low Risk', 'Medium Risk', or 'High Risk'")
    operational_recommendation: str
    model_name: str
    threshold_configuration: Dict[str, float]
    disclaimer: str


class BatchPredictionSummary(BaseModel):
    """Aggregated risk breakdown across batch transactions."""
    total: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    low_risk_pct: float
    medium_risk_pct: float
    high_risk_pct: float


class BatchPredictionResponse(BaseModel):
    """Enriched batch scoring output."""
    summary: BatchPredictionSummary
    results: List[Dict[str, Any]]
    columns: List[str]


class ModelInfoResponse(BaseModel):
    """Model governance and architecture metadata."""
    model_name: str
    algorithm: str
    feature_count: int
    features: List[str]
    default_thresholds: Dict[str, float]
    hyperparameters: Dict[str, Any]
    dataset_provenance: Dict[str, Any]
    probability_calibration_notice: str
    regulatory_disclaimer: str


class ModelMetricsResponse(BaseModel):
    """Verified evaluation metrics and comparison matrix."""
    selected_model: Dict[str, Any]
    models: Dict[str, Any]
    split_summary: Dict[str, Any]


class FeatureContribution(BaseModel):
    """Local SHAP feature contribution item."""
    feature: str
    raw_value: float
    shap_value: float
    direction: str
    abs_impact: float


class LocalExplanationRequest(BaseModel):
    """Request for instance-level SHAP explanation."""
    features: Dict[str, float]
    top_n: int = Field(5, ge=1, le=28)


class LocalExplanationResponse(BaseModel):
    """SHAP attribution details for a specific transaction."""
    base_value: float
    predicted_probability: float
    sum_shap_values: float
    top_risk_increasing: List[FeatureContribution]
    top_risk_decreasing: List[FeatureContribution]
    contributions: List[FeatureContribution]
    explained_class: str
    output_scale: str


class GlobalImportanceItem(BaseModel):
    """Ranked global feature importance item."""
    feature: str
    mean_abs_shap: float
    relative_importance: float
    rank: int


class GlobalExplanationResponse(BaseModel):
    """Global feature importance summary from SHAP analysis."""
    sample_size: int
    model: str
    explained_class: str
    output_scale: str
    feature_importance: List[GlobalImportanceItem]


class TransactionExplorerItem(BaseModel):
    """Transaction record with historical ground truth and model verdict."""
    Class: int
    Amount: float
    Time: float
    fraud_probability: float
    risk_score: int
    risk_category: str


class TransactionExplorerResponse(BaseModel):
    """List of transactions matching explorer filter criteria."""
    total_matching: int
    transactions: List[TransactionExplorerItem]
