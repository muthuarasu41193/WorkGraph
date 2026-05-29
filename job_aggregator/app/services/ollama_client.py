"""Local LLM calls via Ollama (no paid APIs)."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import httpx

LOG = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))


def ollama_available() -> bool:
    try:
        with httpx.Client(timeout=3.0) as client:
            r = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def _extract_json_block(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def chat_json(system: str, user: str, *, model: str | None = None) -> dict[str, Any] | None:
    """Ask Ollama for a JSON object; returns None if unavailable or unparseable."""
    if not ollama_available():
        LOG.warning("Ollama not reachable at %s", OLLAMA_BASE_URL)
        return None

    payload = {
        "model": model or OLLAMA_MODEL,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    try:
        with httpx.Client(timeout=OLLAMA_TIMEOUT) as client:
            resp = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = (data.get("message") or {}).get("content") or ""
            return _extract_json_block(content)
    except Exception as exc:
        LOG.exception("Ollama chat failed: %s", exc)
        return None
