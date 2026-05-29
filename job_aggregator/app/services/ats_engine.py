"""
ATS compatibility scoring — local heuristics + optional Ollama analysis.

Compares resume text to job description without paid APIs.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class ATSResult:
    score: int = 0
    grade: str = "F"
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)
    weak_keywords: list[str] = field(default_factory=list)
    keyword_density: str = "low"
    formatting_score: int = 0
    content_score: int = 0
    formatting_issues: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _tokenize_keywords(text: str) -> set[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.\-]{1,}", text.lower())
    stop = {
        "the", "and", "for", "with", "this", "that", "will", "your", "our", "you",
        "are", "have", "from", "able", "work", "team", "role", "job", "years",
    }
    return {t for t in tokens if len(t) > 2 and t not in stop}


def _grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _formatting_checks(resume: str) -> tuple[int, list[str]]:
    issues: list[str] = []
    score = 100
    if len(resume) < 200:
        issues.append("Resume text is very short — ATS may not parse enough content.")
        score -= 25
    if re.search(r"[^\x00-\x7F]{50,}", resume):
        issues.append("Heavy non-ASCII content may confuse some ATS parsers.")
        score -= 10
    if resume.count("\t") > 5:
        issues.append("Tab characters detected — prefer simple section breaks.")
        score -= 10
    if len(re.findall(r"\|", resume)) > 20:
        issues.append("Many table-like pipes — some ATS strip tables.")
        score -= 15
    bullets = len(re.findall(r"(?m)^\s*[-•*]\s+", resume))
    if bullets < 3:
        issues.append("Few bullet points — add quantified achievement bullets.")
        score -= 15
    return max(0, min(100, score)), issues


def score_ats(resume_text: str, job_description: str, *, use_ollama: bool = True) -> dict[str, Any]:
    resume = (resume_text or "").strip()
    jd = (job_description or "").strip()
    if not resume:
        raise ValueError("resume_text is required")
    if not jd:
        raise ValueError("job_description is required")

    jd_kw = _tokenize_keywords(jd)
    resume_kw = _tokenize_keywords(resume)
    if not jd_kw:
        jd_kw = resume_kw

    overlap = jd_kw & resume_kw
    missing = sorted(jd_kw - resume_kw)[:25]
    weak = sorted((jd_kw - resume_kw) & {k for k in jd_kw if len(k) <= 4})[:10]

    match_ratio = len(overlap) / max(len(jd_kw), 1)
    content_score = int(round(match_ratio * 100))
    fmt_score, fmt_issues = _formatting_checks(resume)
    overall = int(round(content_score * 0.7 + fmt_score * 0.3))

    density = "low"
    if match_ratio >= 0.55:
        density = "high"
    elif match_ratio >= 0.35:
        density = "medium"

    result = ATSResult(
        score=overall,
        grade=_grade(overall),
        content_score=content_score,
        formatting_score=fmt_score,
        keyword_density=density,
        missing_skills=missing[:15],
        weak_keywords=weak[:10],
        formatting_issues=fmt_issues,
        strengths=[
            f"Matched {len(overlap)} relevant keywords from the job description.",
        ]
        if overlap
        else [],
        weaknesses=[f"Missing ~{len(missing)} job keywords in your resume."] if missing else [],
        suggestions=[
            "Mirror exact phrases from the job description in your skills and experience bullets.",
            "Add metrics (%, $, time saved) to each role.",
            "Keep section headers standard: Experience, Education, Skills.",
        ],
    )

    if use_ollama:
        from app.services.ollama_client import chat_json

        system = (
            "You are an ATS coach. Return JSON with keys: score (0-100), grade (A-F), "
            "strengths, weaknesses, suggestions (arrays of strings), missing_skills, "
            "weak_keywords, keyword_density (low|medium|high), formatting_score, content_score."
        )
        user = f"JOB DESCRIPTION:\n{jd[:6000]}\n\nRESUME:\n{resume[:8000]}"
        ai = chat_json(system, user)
        if ai:
            if isinstance(ai.get("score"), (int, float)):
                result.score = max(0, min(100, int(ai["score"])))
                result.grade = _grade(result.score)
            for key in ("strengths", "weaknesses", "suggestions", "missing_skills", "weak_keywords"):
                val = ai.get(key)
                if isinstance(val, list):
                    setattr(result, key, [str(v).strip() for v in val if str(v).strip()][:12])
            if isinstance(ai.get("keyword_density"), str):
                d = ai["keyword_density"].lower()
                if d in ("low", "medium", "high"):
                    result.keyword_density = d

    out = result.to_dict()
    out["optimization_suggestions"] = out.pop("suggestions")
    return out
