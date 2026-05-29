"""POST /match/jobs — semantic job recommendations from resume text."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.matching.keyword_matcher import match_resume_keywords

router = APIRouter()
LOG = logging.getLogger(__name__)


class MatchRequest(BaseModel):
    resume_text: str = Field(..., min_length=80)
    top_k: int = Field(20, ge=1, le=50)
    use_embeddings: bool = Field(
        True,
        description="Set false to skip PyTorch and use keyword overlap only",
    )


class JobMatchItem(BaseModel):
    job_id: int
    title: str
    company: str
    location: str
    source: str
    apply_url: str
    similarity: float
    match_mode: str = "embedding"


class MatchResponse(BaseModel):
    matches: list[JobMatchItem]
    count: int
    match_mode: str


def _semantic_match(session: Session, resume_text: str, top_k: int) -> list[dict]:
    from app.matching.embedder import JobEmbedder
    from app.matching.matcher import match_resume_text

    embedder = JobEmbedder()
    return match_resume_text(session, embedder, resume_text, top_k=top_k)


@router.post("/jobs", response_model=MatchResponse)
def match_jobs(
    body: MatchRequest,
    session: Session = Depends(get_db),
) -> MatchResponse:
    mode = "keyword"
    raw: list[dict] = []

    if body.use_embeddings:
        try:
            raw = _semantic_match(session, body.resume_text, body.top_k)
            mode = "embedding"
        except OSError as exc:
            LOG.warning("Embedding match unavailable (low memory?): %s", exc)
            raw = []
        except Exception as exc:
            LOG.warning("Embedding match failed: %s", exc)
            raw = []

    if not raw:
        raw = match_resume_keywords(session, body.resume_text, top_k=body.top_k)
        mode = "keyword"

    if not raw:
        raise HTTPException(
            503,
            "No job matches. Ingest jobs first (`python -m app.main ingest`) or increase Windows paging file for embeddings.",
        )

    items = [
        JobMatchItem(
            job_id=m["job_id"],
            title=m.get("title", ""),
            company=m.get("company", ""),
            location=m.get("location", ""),
            source=m.get("source", ""),
            apply_url=m.get("apply_url", ""),
            similarity=float(m.get("similarity", 0)),
            match_mode=mode,
        )
        for m in raw
    ]
    return MatchResponse(matches=items, count=len(items), match_mode=mode)
