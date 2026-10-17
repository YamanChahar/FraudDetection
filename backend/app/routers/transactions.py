"""Transaction explorer and auditing endpoints."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from src import config
from backend.app.dependencies import ServiceContainer, load_cached_dataset_sample
from backend.app.schemas import TransactionExplorerItem, TransactionExplorerResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("/explorer", response_model=TransactionExplorerResponse)
def get_transaction_explorer_slice(
    class_filter: str = Query("all", pattern="^(all|legitimate|fraudulent)$", description="Filter by historical label"),
    min_amount: float = Query(0.0, ge=0.0, description="Minimum transaction amount"),
    max_amount: float = Query(100000.0, ge=0.0, description="Maximum transaction amount"),
    limit: int = Query(25, ge=1, le=100, description="Maximum rows to return"),
) -> TransactionExplorerResponse:
    """Return historical transactions from the dataset enriched with live model predictions."""
    df_sample = load_cached_dataset_sample(n_rows=500)
    if df_sample is None:
        raise HTTPException(
            status_code=404,
            detail="Credit card dataset (creditcard.csv) not found in data directory.",
        )

    # Filter by amount
    filtered = df_sample[(df_sample["Amount"] >= min_amount) & (df_sample["Amount"] <= max_amount)]

    # Filter by ground truth class
    if class_filter == "legitimate":
        filtered = filtered[filtered["Class"] == 0]
    elif class_filter == "fraudulent":
        filtered = filtered[filtered["Class"] == 1]

    subset = filtered.head(limit)
    if subset.empty:
        return TransactionExplorerResponse(total_matching=0, transactions=[])

    try:
        predictor = ServiceContainer.get_predictor()
        features_only = subset[config.FEATURE_COLUMNS]
        predictions = predictor.predict_batch(features_only)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error during exploration: {e}")

    items = []
    for idx, (orig_row, pred_row) in enumerate(zip(subset.itertuples(), predictions.itertuples())):
        items.append(
            TransactionExplorerItem(
                Class=int(orig_row.Class),
                Amount=float(orig_row.Amount),
                Time=float(orig_row.Time),
                fraud_probability=float(pred_row.fraud_probability),
                risk_score=int(pred_row.risk_score),
                risk_category=str(pred_row.risk_category),
            )
        )

    return TransactionExplorerResponse(
        total_matching=len(filtered),
        transactions=items,
    )
