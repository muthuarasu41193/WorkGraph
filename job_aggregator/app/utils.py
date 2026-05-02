"""Shared helpers: HTTP retries, HTML stripping, content hashing, logging."""

from __future__ import annotations

import hashlib
import logging
import re
import time
from typing import Any

import requests

from app.config import HTTP_MAX_RETRIES, HTTP_TIMEOUT_SECONDS

LOG = logging.getLogger("job_aggregator")


def configure_logging(level: int = logging.INFO) -> None:
    if not logging.root.handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )


def strip_html_to_text(html: str) -> str:
    """Cheap HTML tag stripper — avoids extra deps (no BeautifulSoup)."""
    if not html:
        return ""
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def canonical_job_text(title: str, company: str, location: str, description: str) -> str:
    """Single string fed into embedding + hashing."""
    parts = [
        (title or "").strip(),
        (company or "").strip(),
        (location or "").strip(),
        (description or "").strip(),
    ]
    return "\n".join(parts)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def http_get_json(url: str, *, params: dict[str, Any] | None = None) -> Any | None:
    """
    GET JSON with exponential backoff retries.

    Returns parsed JSON or None if all retries exhausted / non-JSON response.
    """
    backoff = 1.0
    last_exc: Exception | None = None
    for attempt in range(HTTP_MAX_RETRIES):
        try:
            resp = requests.get(
                url,
                params=params,
                timeout=HTTP_TIMEOUT_SECONDS,
                headers={"Accept": "application/json", "User-Agent": "WorkGraphJobAggregator/1.0"},
            )
            if resp.status_code == 429 or 500 <= resp.status_code < 600:
                LOG.warning("HTTP %s for %s (attempt %s)", resp.status_code, url, attempt + 1)
                time.sleep(backoff)
                backoff = min(backoff * 2, 30)
                continue
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            last_exc = exc
            LOG.warning("Request failed %s attempt %s: %s", url, attempt + 1, exc)
            time.sleep(backoff)
            backoff = min(backoff * 2, 30)
    LOG.error("Giving up on %s: %s", url, last_exc)
    return None
