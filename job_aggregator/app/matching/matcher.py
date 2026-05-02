"""
Resume ↔ job cosine similarity using scikit-learn.

Jobs must already carry embedding_json produced by JobEmbedder + embed_pending_jobs.
Because embeddings are L2-normalized, cosine similarity equals the dot product — we still
use sklearn's cosine_similarity for clarity & numerical hygiene if vectors drift.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.matching.embedder import JobEmbedder
from app.models import Job


def match_resume_text(session: Session, embedder: JobEmbedder, resume_text: str, top_k: int = 20) -> list[dict[str, Any]]:
    doc = (resume_text or "").strip()
    if not doc:
        raise ValueError("Resume text is empty.")

    resume_vec = embedder.embed_text(doc).reshape(1, -1)

    jobs = session.scalars(select(Job).where(Job.embedding_json.is_not(None))).all()
    if not jobs:
        return []

    matrix = np.stack([np.array(json.loads(j.embedding_json), dtype=np.float32) for j in jobs])
    sims = cosine_similarity(resume_vec, matrix)[0]

    order = np.argsort(-sims)
    limit = min(top_k, len(order))

    results: list[dict[str, Any]] = []
    for idx in order[:limit]:
        job = jobs[int(idx)]
        score = float(sims[int(idx)])
        results.append(
            {
                "similarity": score,
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


def match_resume_file(session: Session, embedder: JobEmbedder, resume_path: Path, top_k: int = 20) -> list[dict[str, Any]]:
    path = resume_path.expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Resume file not found: {path}")
    text = path.read_text(encoding="utf-8", errors="replace")
    return match_resume_text(session, embedder, text, top_k=top_k)
