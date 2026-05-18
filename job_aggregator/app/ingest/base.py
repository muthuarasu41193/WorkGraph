"""
Shared helpers for community / RSS-style job ingestors.

These helpers keep the source modules small and consistent with the existing
Greenhouse / Lever normalize-then-persist pattern.
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET

import requests

from app.config import HTTP_MAX_RETRIES, HTTP_TIMEOUT_SECONDS
from app.utils import LOG, canonical_job_text, sha256_hex, strip_html_to_text


def env_int(name: str, default: int, *, min_value: int | None = None, max_value: int | None = None) -> int:
    raw = str(os.getenv(name, "") or "").strip()
    try:
        value = int(raw) if raw else default
    except ValueError:
        value = default
    if min_value is not None:
        value = max(min_value, value)
    if max_value is not None:
        value = min(max_value, value)
    return value


def split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    parts = [part.strip() for part in str(value).replace(";", ",").split(",")]
    return [part for part in parts if part]


def absolutize_url(url: str, *, base: str | None = None) -> str:
    raw = str(url or "").strip()
    if not raw:
        return ""
    if base:
        return urljoin(base, raw)
    return raw


def parse_datetime(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        try:
            ts = float(value)
            if ts > 1_000_000_000_000:
                ts /= 1000.0
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        except (TypeError, ValueError, OSError):
            return None
    if not isinstance(value, str):
        return None

    text = value.strip()
    if not text:
        return None

    if text.isdigit():
        return parse_datetime(int(text))

    normalized = text.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass

    try:
        dt = parsedate_to_datetime(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError, IndexError, OverflowError):
        return None


def compact_text(*parts: Any) -> str:
    out: list[str] = []
    for part in parts:
        if part is None:
            continue
        if isinstance(part, (list, tuple, set)):
            for nested in part:
                text = str(nested or "").strip()
                if text:
                    out.append(text)
            continue
        text = str(part).strip()
        if text:
            out.append(text)
    return "\n\n".join(out).strip()


def fetch_text(url: str, *, params: dict[str, Any] | None = None, accept: str = "text/plain, application/xml, text/xml, application/rss+xml, application/atom+xml") -> str | None:
    backoff = 1.0
    last_exc: Exception | None = None
    for attempt in range(HTTP_MAX_RETRIES):
        try:
            resp = requests.get(
                url,
                params=params,
                timeout=HTTP_TIMEOUT_SECONDS,
                headers={
                    "Accept": accept,
                    "User-Agent": "WorkGraphJobAggregator/1.0",
                },
            )
            if resp.status_code == 429 or 500 <= resp.status_code < 600:
                LOG.warning("HTTP %s for %s (attempt %s)", resp.status_code, url, attempt + 1)
                time.sleep(backoff)
                backoff = min(backoff * 2, 30)
                continue
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            last_exc = exc
            LOG.warning("Request failed %s attempt %s: %s", url, attempt + 1, exc)
            time.sleep(backoff)
            backoff = min(backoff * 2, 30)
    LOG.error("Giving up on %s: %s", url, last_exc)
    return None


def _local_name(tag: str) -> str:
    return str(tag or "").split("}", 1)[-1].lower()


def parse_rss_items(url: str) -> list[ET.Element]:
    xml_text = fetch_text(url)
    if not xml_text:
        return []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        LOG.warning("RSS parse failed for %s: %s", url, exc)
        return []

    items = [elem for elem in root.iter() if _local_name(elem.tag) in {"item", "entry"}]
    return items


def rss_item_text(item: ET.Element, *names: str) -> str:
    wanted = {name.lower() for name in names}
    for child in item.iter():
        if _local_name(child.tag) not in wanted:
            continue
        text = "".join(child.itertext()).strip()
        if text:
            return strip_html_to_text(text)
    return ""


def rss_item_link(item: ET.Element) -> str:
    for child in item.iter():
        if _local_name(child.tag) != "link":
            continue
        href = str(child.attrib.get("href") or "").strip()
        if href:
            return href
        text = "".join(child.itertext()).strip()
        if text:
            return text
    return ""


def host_label(url: str) -> str:
    host = urlparse(url).netloc.lower().strip()
    if host.startswith("www."):
        host = host[4:]
    if not host:
        return ""
    pieces = [piece for piece in host.split(".") if piece]
    if len(pieces) >= 2:
        return pieces[-2].replace("-", " ").title()
    return host.replace("-", " ").title()


def normalize_job(
    *,
    source: str,
    external_id: str,
    title: str,
    company: str,
    location: str,
    description: str,
    apply_url: str,
    posted_at: datetime | None,
    kind: str = "listing",
    classification: str = "employer_hiring",
    is_community: bool = False,
) -> dict[str, Any] | None:
    normalized_url = absolutize_url(apply_url)
    if not normalized_url:
        return None

    clean_title = str(title or "").strip() or "Untitled role"
    clean_company = str(company or "").strip() or f"Employer via {source.title()}"
    clean_location = str(location or "").strip()
    clean_description = strip_html_to_text(str(description or "").strip())
    canon = canonical_job_text(clean_title, clean_company, clean_location, clean_description)

    return {
        "external_id": str(external_id).strip(),
        "title": clean_title,
        "company": clean_company,
        "location": clean_location,
        "description": clean_description,
        "apply_url": normalized_url,
        "posted_at": posted_at,
        "source": source,
        "kind": str(kind or "listing").strip(),
        "classification": str(classification or "employer_hiring").strip(),
        "is_community": bool(is_community),
        "content_hash": sha256_hex(canon),
    }
