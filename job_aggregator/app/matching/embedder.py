"""
Local embeddings via sentence-transformers (no paid inference APIs).

Model: sentence-transformers/all-MiniLM-L6-v2 (384-dimensional embeddings).

Batching:
  Jobs are encoded in configurable batches to reduce overhead / maximize throughput.

Incremental work:
  Only Job rows with embedding_json IS NULL are encoded after ingestion updates cleared them.
"""

from __future__ import annotations

import json
import logging

import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import EMBED_BATCH_SIZE, EMBEDDING_MODEL_NAME, EMBEDDING_MODEL_VERSION
from app.models import Job

LOG = logging.getLogger(__name__)


class JobEmbedder:
    """Thin wrapper — lazily loads the transformer once."""

    def __init__(self, model_name: str | None = None):
        self._model_name = model_name or EMBEDDING_MODEL_NAME
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            LOG.info("Loading SentenceTransformer model=%s", self._model_name)
            self._model = SentenceTransformer(self._model_name)
        return self._model

    def embed_text(self, text: str) -> np.ndarray:
        """Encode a single document → normalized L2 unit vector (as returned by encode)."""
        vec = self.model.encode(
            [text or ""],
            batch_size=1,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vec[0]

    def embed_texts_batch(self, texts: list[str], batch_size: int | None = None) -> np.ndarray:
        bs = batch_size or EMBED_BATCH_SIZE
        if not texts:
            dim = self.model.get_sentence_embedding_dimension()
            return np.zeros((0, dim), dtype=np.float32)
        return self.model.encode(
            texts,
            batch_size=bs,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )


def embed_pending_jobs(session: Session, embedder: JobEmbedder, batch_size: int | None = None) -> int:
    """
    Encode every Job lacking embedding_json.

    Returns number of rows updated.
    """
    pending = session.scalars(select(Job).where(Job.embedding_json.is_(None))).all()
    if not pending:
        LOG.info("No pending jobs requiring embeddings.")
        return 0

    texts: list[str] = []
    for job in pending:
        parts = [job.title, job.company, job.location, job.description]
        texts.append("\n".join(p.strip() for p in parts if p))

    matrices = embedder.embed_texts_batch(texts, batch_size=batch_size)

    updated = 0
    for job, row_vec in zip(pending, matrices, strict=True):
        job.embedding_json = json.dumps(row_vec.astype(float).tolist())
        job.embedding_model_version = EMBEDDING_MODEL_VERSION
        updated += 1

    session.flush()
    LOG.info("Embedded jobs count=%s model=%s", updated, EMBEDDING_MODEL_VERSION)
    return updated
