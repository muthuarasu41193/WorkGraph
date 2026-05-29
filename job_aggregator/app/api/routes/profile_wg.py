"""GET/PUT /profile/me — self-hosted wg_profiles."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_user_id
from app.services.profile_service import get_profile, upsert_profile

router = APIRouter()


class ProfileUpsertBody(BaseModel):
    email: str | None = None
    full_name: str | None = None
    headline: str | None = None
    summary: str | None = None
    location: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    website_url: str | None = None
    skills: list[str] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    work_experience: list[dict[str, Any]] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    resume_raw_text: str | None = None
    profile_completeness: int | None = None
    ats_score: int | None = None
    ats_feedback: dict[str, Any] | None = None


@router.get("/me")
def profile_me(
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    row = get_profile(db, user_id)
    db.commit()
    if not row:
        raise HTTPException(404, "Profile not found")
    return {"profile": row}


@router.put("/me")
def profile_upsert(
    body: ProfileUpsertBody,
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    row = upsert_profile(db, user_id, body.model_dump(exclude_none=True))
    db.commit()
    return {"profile": row}
