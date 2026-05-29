"""POST /ats/score — resume vs job description ATS analysis."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ats_engine import score_ats

router = APIRouter()


class ATSScoreRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    job_description: str = Field(..., min_length=20)
    user_id: str | None = None
    use_ollama: bool = True


class ATSScoreResponse(BaseModel):
    score: int
    grade: str
    strengths: list[str]
    weaknesses: list[str]
    optimization_suggestions: list[str]
    missing_skills: list[str]
    weak_keywords: list[str]
    keyword_density: str
    formatting_score: int
    content_score: int
    formatting_issues: list[str] = Field(default_factory=list)


@router.post("/score", response_model=ATSScoreResponse)
def ats_score(body: ATSScoreRequest) -> ATSScoreResponse:
    try:
        result = score_ats(
            body.resume_text,
            body.job_description,
            use_ollama=body.use_ollama,
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return ATSScoreResponse(**result)
