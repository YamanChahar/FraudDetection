"""FastAPI entrypoint and application factory for FraudLens."""

from __future__ import annotations

import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from src import config
from backend.app.routers import explanations, health, model, predict, transactions


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title="FraudLens — Fraud Detection & Risk Assessment API",
        description=(
            "Enterprise-grade REST API service powered by Scikit-learn, "
            "RandomForest, and SHAP TreeExplainer for real-time transaction scoring."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Allowed CORS origins (Vite dev server and local frontend)
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static files directory for reports/visualizations if it exists
    if config.REPORTS_DIR.exists():
        app.mount("/static/reports", StaticFiles(directory=str(config.REPORTS_DIR)), name="reports")

    # Include API routers
    app.include_router(health.router)
    app.include_router(model.router)
    app.include_router(predict.router)
    app.include_router(explanations.router)
    app.include_router(transactions.router)

    # Global Exception Handler to avoid exposing filesystem paths or secrets
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred while processing the request."},
        )

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
