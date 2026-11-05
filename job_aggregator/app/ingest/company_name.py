"""Rule-based company name normalization for the Python ingest path.

Mirrors lib/company-name/normalize-rules.ts. Groq + Supabase cache live in the
TypeScript community sync; ATS ingest applies the same deterministic rules so
glued suffixes never land in jobs.company unchanged.
"""

from __future__ import annotations

import re
from typing import TypedDict

LEGAL_SUFFIXES = [
    "gmbh & co kg",
    "gmbh & co. kg",
    "pty ltd",
    "pte ltd",
    "co ltd",
    "co. ltd",
    "limited",
    "corporation",
    "incorporated",
    "company",
    "gmbh",
    "corp",
    "llc",
    "llp",
    "plc",
    "inc",
    "ltd",
    "lp",
    "ag",
    "sa",
    "ab",
    "nv",
    "bv",
    "se",
    "oy",
    "as",
    "aps",
    "sas",
    "sarl",
    "spa",
    "srl",
    "pbc",
    "pc",
]

COMPOUND_TOKENS = [
    "technologies",
    "technology",
    "engineering",
    "solutions",
    "systems",
    "software",
    "digital",
    "security",
    "advisory",
    "capital",
    "holdings",
    "holding",
    "group",
    "global",
    "health",
    "healthcare",
    "hospitality",
    "operating",
    "operations",
    "management",
    "partners",
    "ventures",
    "network",
    "networks",
    "media",
    "studio",
    "studios",
    "labs",
    "lab",
    "linkedin",
    "evidensia",
]

PROTECTED = {
    "openai": "OpenAI",
    "gitlab": "GitLab",
    "github": "GitHub",
    "youtube": "YouTube",
    "linkedin": "LinkedIn",
    "whatsapp": "WhatsApp",
    "dataclue": "DataClue",
    "digicert": "DigiCert",
    "airbnb": "Airbnb",
    "paypal": "PayPal",
}

SUFFIX_DISPLAY = {
    "llc",
    "llp",
    "plc",
    "inc",
    "ltd",
    "lp",
    "pbc",
    "corp",
    "gmbh",
    "ag",
    "sa",
    "ab",
    "nv",
    "bv",
    "se",
}


class RulesResult(TypedDict):
    display_name: str
    confident: bool
    reason: str


def _collapse(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _format_suffix(suffix: str) -> str:
    lower = suffix.lower()
    if lower == "gmbh":
        return "GmbH"
    if lower in {"llc", "llp", "plc", "inc", "ltd", "lp", "pbc", "corp", "ag", "sa", "ab", "nv", "bv", "se"}:
        return lower.upper() if lower != "corp" else "CORP"
    return " ".join(part.upper() if part not in {"&", "gmbh"} else ("GmbH" if part == "gmbh" else part) for part in lower.split())


def peel_legal_suffix(raw: str) -> tuple[str, str | None]:
    compact = re.sub(r"[\s.,]+", "", raw)
    lower = compact.lower()
    for suffix in sorted(LEGAL_SUFFIXES, key=len, reverse=True):
        needle = re.sub(r"[\s.]+", "", suffix)
        if len(needle) <= 2 and not any(ch.isupper() for ch in re.sub(r"[\s.,]+", "", raw)[-len(needle) :]):
            continue
        if len(lower) <= len(needle) + 2:
            continue
        if lower.endswith(needle):
            return compact[: len(compact) - len(needle)], _format_suffix(suffix)
    return raw.strip(), None


def _split_camel(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", value)
    value = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", value)
    return value


def _title_word(word: str) -> str:
    if not word:
        return word
    if word.lower() == "gmbh":
        return "GmbH"
    lower = word.lower()
    if lower in {"ai", "io", "hq", "uk", "us", "eu", "ivc"}:
        return lower.upper()
    if lower in {"llc", "llp", "plc", "inc", "ltd", "lp", "pbc"}:
        return lower.upper()
    if lower == "corp":
        return "Corp"
    if lower in {"ag", "sa", "ab", "nv", "bv", "se"}:
        return lower.upper()
    return word[:1].upper() + word[1:].lower()


def _insert_compounds(value: str) -> str:
    result = value
    for token in sorted(COMPOUND_TOKENS, key=len, reverse=True):
        result = re.sub(rf"([a-z0-9])({re.escape(token)})", r"\1 \2", result, flags=re.I)
    return _collapse(result)


def _needs_llm(display_name: str, raw: str) -> bool:
    words = [w for w in display_name.split() if w]
    if not display_name.strip():
        return True
    body = [w for w in words if w.lower() not in SUFFIX_DISPLAY]
    was_glued = (
        " " not in raw.strip()
        and not re.search(r"[a-z][A-Z]", raw)
        and not re.search(r"[0-9]", raw)
        and "." not in raw
        and len(re.sub(r"[^a-zA-Z]", "", raw)) >= 8
    )
    if len(body) >= 2:
        return was_glued and len(body[0]) >= 10
    if len(body) == 1 and was_glued and len(body[0]) >= 10:
        return True
    return False


def normalize_company_name_rules(raw_input: str) -> RulesResult:
    raw = _collapse(str(raw_input or ""))
    if not raw:
        return {"display_name": "", "confident": False, "reason": "needs_llm"}

    if " " in raw:
        all_caps = raw == raw.upper()
        parts = []
        for word in raw.split():
            if word.lower() == "gmbh":
                parts.append("GmbH")
            elif not all_caps and (re.search(r"[a-z][A-Z]", word) or (re.search(r"[A-Z].*[A-Z]", word) and re.search(r"[a-z]", word))):
                parts.append(word)
            elif word == word.upper() and len(word) <= 3 and not all_caps:
                parts.append(word)
            elif word == word.upper():
                parts.append(_title_word(word.lower()))
            else:
                parts.append(_title_word(word))
        return {"display_name": _collapse(" ".join(parts)).replace("Gmb H", "GmbH"), "confident": True, "reason": "clean"}

    lower_raw = raw.lower()
    if lower_raw in PROTECTED:
        return {"display_name": PROTECTED[lower_raw], "confident": True, "reason": "clean"}

    if re.search(r"[a-z]", raw) and re.search(r"[A-Z]", raw) and len(raw) <= 9:
        return {"display_name": raw, "confident": True, "reason": "clean"}

    working = raw
    reason = "title_case"
    peeled_suffix = None
    body, suffix = peel_legal_suffix(working)
    if suffix:
        working = body
        peeled_suffix = suffix
        reason = "suffix_split"

    if re.search(r"[a-z][A-Z]|[A-Z]{2,}[a-z]", working) and len(working) >= 10:
        working = _split_camel(working)
        reason = "suffix_split" if peeled_suffix else "camel_split"

    if " " not in working and len(working) >= 8:
        compounded = _insert_compounds(working)
        if compounded != working:
            working = compounded
            reason = "compound_split"

    if working == working.upper() and len(working) > 3:
        working = working.lower()

    words = [_title_word(part) for part in working.split() if part]
    display = _collapse(" ".join(words))
    if peeled_suffix:
        display = _collapse(f"{display} {peeled_suffix}")
    if re.fullmatch(r"ivc evidensia", display, flags=re.I):
        display = "IVC Evidensia"

    if _needs_llm(display, raw):
        return {"display_name": display or raw, "confident": False, "reason": "needs_llm"}
    return {"display_name": display, "confident": True, "reason": reason}


def normalize_company_name(raw_input: str) -> str:
    """Apply rules; when not confident, still return the rules display (Groq is TS-side)."""
    result = normalize_company_name_rules(raw_input)
    return result["display_name"] or str(raw_input or "").strip()
