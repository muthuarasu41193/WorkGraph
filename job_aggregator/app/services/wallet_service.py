"""Contributor wallet and payout requests."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models_workgraph import WgProfile, WgWallet, WgWalletTransaction
from app.services.community_service import ensure_user

MIN_PAYOUT_CENTS = 500


def get_wallet_summary(session: Session, user_id: uuid.UUID) -> dict:
    ensure_user(session, user_id)
    wallet = session.get(WgWallet, user_id)
    if not wallet:
        wallet = WgWallet(user_id=user_id)
        session.add(wallet)
        session.flush()

    earned = session.scalar(
        select(func.coalesce(func.sum(WgWalletTransaction.amount_cents), 0)).where(
            WgWalletTransaction.user_id == user_id,
            WgWalletTransaction.kind == "earn",
            WgWalletTransaction.status == "completed",
        )
    )

    return {
        "balance_cents": wallet.balance_cents,
        "pending_cents": wallet.pending_cents,
        "currency": wallet.currency,
        "lifetime_earned_cents": int(earned or 0),
    }


def list_transactions(session: Session, user_id: uuid.UUID, limit: int = 40) -> list[dict]:
    rows = session.scalars(
        select(WgWalletTransaction)
        .where(WgWalletTransaction.user_id == user_id)
        .order_by(WgWalletTransaction.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(tx.id),
            "amount_cents": tx.amount_cents,
            "kind": tx.kind,
            "status": tx.status,
            "description": tx.description,
            "created_at": tx.created_at.isoformat(),
        }
        for tx in rows
    ]


def request_payout(session: Session, user_id: uuid.UUID, amount_cents: int) -> dict:
    if amount_cents < MIN_PAYOUT_CENTS:
        raise ValueError(f"Minimum payout is {MIN_PAYOUT_CENTS} cents")

    wallet = session.get(WgWallet, user_id)
    if not wallet or wallet.balance_cents < amount_cents:
        raise ValueError("Insufficient balance")

    wallet.balance_cents -= amount_cents
    wallet.pending_cents += amount_cents
    wallet.updated_at = datetime.now(timezone.utc)

    tx = WgWalletTransaction(
        user_id=user_id,
        amount_cents=-amount_cents,
        kind="payout_request",
        status="pending",
        description="Payout request — pending admin review",
    )
    session.add(tx)
    session.flush()

    return get_wallet_summary(session, user_id)


def dashboard_snapshot(session: Session, user_id: uuid.UUID) -> dict:
    from app.models_workgraph import WgJobApplication, WgSavedJob

    profile = session.get(WgProfile, user_id)
    saved_count = session.scalar(
        select(func.count()).select_from(WgSavedJob).where(WgSavedJob.user_id == user_id)
    )
    apps_count = session.scalar(
        select(func.count()).select_from(WgJobApplication).where(WgJobApplication.user_id == user_id)
    )

    return {
        "profile_completeness": profile.profile_completeness if profile else 0,
        "ats_score": profile.ats_score if profile else None,
        "trust_score": profile.trust_score if profile else 0,
        "contribution_score": profile.contribution_score if profile else 0,
        "saved_jobs_count": int(saved_count or 0),
        "applications_count": int(apps_count or 0),
    }
