from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List, Optional

class TransactionFeatures(BaseModel):
    model_config = ConfigDict(extra="allow")
    Time: Optional[float] = Field(0.0, description="Time in seconds from initial transaction")
    Amount: Optional[float] = Field(0.0, description="Transaction financial amount")

class PredictionResponse(BaseModel):
    fraud_probability: float
    risk_score: int
    risk_level: str
    prediction_label: int
    model_version: str
    model_name: str
    latency_ms: float
    shap_explanation: Dict[str, Any]

class BatchPredictRequest(BaseModel):
    transactions: List[Dict[str, Any]]

class BatchPredictResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    total_records: int
    total_latency_ms: float
    avg_latency_ms: float
    model_version: str
