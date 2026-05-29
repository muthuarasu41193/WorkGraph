"""Lightweight job ranking without PyTorch (low-RAM fallback)."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Job


def _tokens(text: str) -> set[str]:
    return {t.lower() for t in re.findall(r"[a-zA-Z][a-zA-Z0-9+#.\-]{1,}", text) if len(t) > 2}


def match_resume_keywords(session: Session, resume_text: str, top_k: int = 20) -> list[dict[str, Any]]:
    """Rank jobs by token overlap — no ML dependencies."""
    resume_kw = _tokens(resume_text)
    if not resume_kw:
        return []

    jobs = session.scalars(select(Job).order_by(Job.id.desc()).limit(500)).all()

    scored: list[tuple[float, Job]] = []
    for job in jobs:
        hay = _tokens(f"{job.title} {job.company} {job.location} {job.description}")
        if not hay:
            continue
        overlap = len(resume_kw & hay)
        if overlap == 0:
            continue
        score = overlap / max(len(resume_kw), 1)
        scored.append((score, job))

    scored.sort(key=lambda x: -x[0])
    results: list[dict[str, Any]] = []
    for sim, job in scored[:top_k]:
        results.append(
            {
                "similarity": float(sim),
                "job_id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "apply_url": job.apply_url,
                "source": job.source,
                "posted_at": job.posted_at.isoformat() if job.posted_at else None,
            }
        )
    return results
