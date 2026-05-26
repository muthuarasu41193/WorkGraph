"""Map ORM rows to public DTOs."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from app.domain.schemas import JobPublic
from app.models import Job

_SNIPPET_LEN = 320
_TAG_RE = re.compile(r"\b(remote|hiring|internship|freelance|full[- ]?stack|frontend|backend)\b", re.I)


def _parse_posted_at(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _tags_for_fields(
    *,
    title: str,
    location: str,
    description: str,
    kind: str,
    classification: str,
    is_community: bool,
) -> list[str]:
    tags: list[str] = []
    if kind and kind != "listing":
        tags.append(kind)
    if classification and classification not in ("employer_hiring", "discussion_only"):
        tags.append(classification.replace("_", "-"))
    if is_community:
        tags.append("community")
    hay = f"{title} {location} {description[:400]}"
    for match in _TAG_RE.finditer(hay):
        token = match.group(0).lower().replace(" ", "-")
        if token not in tags:
            tags.append(token)
    return tags[:12]


def job_to_public(job: Job) -> JobPublic:
    desc = (job.description or "").strip()
    return JobPublic(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        source=job.source,
        source_url=job.apply_url,
        snippet=desc[:_SNIPPET_LEN] + ("…" if len(desc) > _SNIPPET_LEN else ""),
        tags=_tags_for_fields(
            title=job.title,
            location=job.location,
            description=desc,
            kind=job.kind or "listing",
            classification=job.classification or "employer_hiring",
            is_community=bool(job.is_community),
        ),
        posted_at=job.posted_at,
        is_community=bool(job.is_community),
        kind=job.kind or "listing",
        classification=job.classification or "employer_hiring",
    )


def job_dict_to_public(row: dict[str, Any]) -> JobPublic:
    desc = str(row.get("description") or "").strip()
    title = str(row.get("title") or "")
    kind = str(row.get("kind") or "listing")
    classification = str(row.get("classification") or "employer_hiring")
    is_community = bool(row.get("is_community"))
    return JobPublic(
        id=int(row["id"]),
        title=title,
        company=str(row.get("company") or ""),
        location=str(row.get("location") or ""),
        source=str(row.get("source") or ""),
        source_url=str(row.get("apply_url") or ""),
        snippet=desc[:_SNIPPET_LEN] + ("…" if len(desc) > _SNIPPET_LEN else ""),
        tags=_tags_for_fields(
            title=title,
            location=str(row.get("location") or ""),
            description=desc,
            kind=kind,
            classification=classification,
            is_community=is_community,
        ),
        posted_at=_parse_posted_at(row.get("posted_at")),
        is_community=is_community,
        kind=kind,
        classification=classification,
    )


def row_to_public(row: Job | dict[str, Any]) -> JobPublic:
    if isinstance(row, dict):
        return job_dict_to_public(row)
    return job_to_public(row)
