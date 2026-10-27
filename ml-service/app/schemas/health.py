from pydantic import BaseModel, Field
from typing import Optional

class HealthResponse(BaseModel):
    status: str = Field(default="OPERATIONAL", description="High-level service operational status")
    service: str = Field(default="trace-ml-service", description="Application identifier")
    version: str = Field(default="1.0.0", description="Semantic service version")
    environment: str = Field(..., description="Running environment")
    model_status: str = Field(
        default="NOT_INITIALIZED",
        description="Explicit model readiness state (Phase 1 Foundation: Model inference deferred to Phase 4)"
    )
    active_model: Optional[str] = Field(
        default=None,
        description="Active model identifier (None in Phase 1)"
    )
    phase: str = Field(
        default="Phase 1 — Monorepo Foundation & Tooling",
        description="Active development phase"
    )
