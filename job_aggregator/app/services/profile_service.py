"""WorkGraph profile CRUD (wg_profiles)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models_workgraph import WgProfile, WgUser
from app.services.community_service import ensure_user


def _as_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def profile_to_dict(profile: WgProfile, user: WgUser | None) -> dict:
    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "email": user.email if user else None,
        "phone": profile.phone,
        "location": profile.location,
        "headline": profile.headline,
        "summary": profile.summary,
        "photo_url": profile.photo_url,
        "years_of_experience": profile.years_of_experience or 0,
        "skills": _as_list(profile.skills),
        "education": _as_list(profile.education),
        "work_experience": _as_list(profile.work_experience),
        "certifications": _as_list(profile.certifications),
        "linkedin_url": profile.linkedin_url,
        "github_url": profile.github_url,
        "website_url": profile.website_url,
        "resume_url": profile.resume_url,
        "resume_raw_text": profile.resume_raw_text,
        "ats_score": profile.ats_score,
        "ats_feedback": profile.ats_feedback,
        "profile_completeness": profile.profile_completeness or 0,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def get_profile(session: Session, user_id: uuid.UUID) -> dict | None:
    profile = session.get(WgProfile, user_id)
    if not profile:
        return None
    user = session.get(WgUser, user_id)
    return profile_to_dict(profile, user)


def upsert_profile(session: Session, user_id: uuid.UUID, payload: dict[str, Any]) -> dict:
    email = (payload.get("email") or "").strip() or None
    display = (payload.get("full_name") or "").strip() or None
    ensure_user(session, user_id, email=email, display_name=display)

    profile = session.get(WgProfile, user_id)
    if not profile:
        profile = WgProfile(id=user_id)
        session.add(profile)

    for field in (
        "full_name",
        "phone",
        "location",
        "headline",
        "summary",
        "photo_url",
        "linkedin_url",
        "github_url",
        "website_url",
        "resume_url",
        "resume_raw_text",
    ):
        if field in payload:
            setattr(profile, field, payload.get(field))

    if "years_of_experience" in payload:
        profile.years_of_experience = int(payload.get("years_of_experience") or 0)
    if "skills" in payload:
        profile.skills = _as_list(payload.get("skills"))
    if "education" in payload:
        profile.education = _as_list(payload.get("education"))
    if "work_experience" in payload:
        profile.work_experience = _as_list(payload.get("work_experience"))
    if "certifications" in payload:
        profile.certifications = _as_list(payload.get("certifications"))
    if "ats_score" in payload:
        profile.ats_score = payload.get("ats_score")
    if "ats_feedback" in payload:
        profile.ats_feedback = payload.get("ats_feedback")
    if "profile_completeness" in payload:
        profile.profile_completeness = int(payload.get("profile_completeness") or 0)

    profile.updated_at = datetime.now(timezone.utc)
    session.flush()
    user = session.get(WgUser, user_id)
    if email and user:
        user.email = email
    return profile_to_dict(profile, user)
