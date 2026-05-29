"""Contributor wallet endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_user_id
from app.services.community_service import ensure_user
from app.services.wallet_service import (
    dashboard_snapshot,
    get_wallet_summary,
    list_transactions,
    request_payout,
)

router = APIRouter()


class PayoutRequest(BaseModel):
    amount_cents: int = Field(..., ge=500)


@router.get("/summary")
def wallet_summary(
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    summary = get_wallet_summary(db, user_id)
    db.commit()
    return summary


@router.get("/transactions")
def wallet_transactions(
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    txs = list_transactions(db, user_id)
    return {"transactions": txs}


@router.post("/payout")
def wallet_payout(
    body: PayoutRequest,
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    try:
        summary = request_payout(db, user_id, body.amount_cents)
        db.commit()
        return summary
    except ValueError as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc


@router.get("/dashboard")
def wallet_dashboard(
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    ensure_user(db, user_id)
    snap = dashboard_snapshot(db, user_id)
    wallet = get_wallet_summary(db, user_id)
    db.commit()
    return {"dashboard": snap, "wallet": wallet}
