"""
Resume extraction: PDF/DOCX → structured profile.

Uses spaCy NER + regex heuristics; optional Ollama enrichment when available.
No proprietary AI APIs.
"""

from __future__ import annotations

import io
import logging
import re
from dataclasses import asdict, dataclass, field
from typing import Any

from langdetect import detect_langs
from pypdf import PdfReader

LOG = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")
LINKEDIN_RE = re.compile(r"https?://(?:www\.)?linkedin\.com/in/[\w\-_%]+/?", re.I)
GITHUB_RE = re.compile(r"https?://(?:www\.)?github\.com/[\w\-]+/?", re.I)
URL_RE = re.compile(r"https?://[^\s)>\]]+", re.I)

SKILL_HINTS = {
    "python", "javascript", "typescript", "java", "react", "node", "sql", "postgresql",
    "aws", "docker", "kubernetes", "fastapi", "next.js", "tailwind", "machine learning",
    "data science", "agile", "scrum", "ci/cd", "git", "linux", "rest", "graphql",
}


@dataclass
class ParsedEducation:
    degree: str = ""
    institution: str = ""
    year: str = ""


@dataclass
class ParsedWorkExperience:
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""


@dataclass
class ParsedResume:
    full_name: str = ""
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    headline: str = ""
    summary: str | None = None
    years_of_experience: int = 0
    skills: list[str] = field(default_factory=list)
    education: list[ParsedEducation] = field(default_factory=list)
    work_experience: list[ParsedWorkExperience] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    projects: list[dict[str, str]] = field(default_factory=list)
    linkedin_url: str | None = None
    github_url: str | None = None
    website_url: str | None = None
    detected_language: str = "en"
    raw_text: str = ""

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["education"] = [asdict(e) for e in self.education]
        d["work_experience"] = [asdict(w) for w in self.work_experience]
        return d


def extract_text_from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text() or ""
        if t.strip():
            parts.append(t)
    return "\n".join(parts).strip()


def extract_text_from_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


def extract_text(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(data)
    if lower.endswith(".docx"):
        return extract_text_from_docx(data)
    if lower.endswith(".txt"):
        return data.decode("utf-8", errors="replace").strip()
    raise ValueError(f"Unsupported file type: {filename}")


def _detect_language(text: str) -> str:
    try:
        langs = detect_langs(text[:4000])
        if langs:
            return langs[0].lang
    except Exception:
        pass
    return "en"


def _load_spacy_model(lang: str):
    import spacy

    if lang.startswith("en"):
        try:
            return spacy.load("en_core_web_sm")
        except OSError:
            return spacy.blank("en")
    return spacy.blank("xx")


def _extract_person_name(doc, text: str) -> str:
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
            return ent.text.strip()
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if lines:
        first = lines[0]
        if len(first) < 60 and not EMAIL_RE.search(first):
            return first
    return ""


def _extract_skills(text: str) -> list[str]:
    lower = text.lower()
    found: set[str] = set()
    for skill in SKILL_HINTS:
        if skill in lower:
            found.add(skill.title() if skill.islower() else skill)
    # Section after "Skills"
    m = re.search(r"(?i)skills?\s*[:\-]\s*([^\n]+(?:\n[^\n]+){0,5})", text)
    if m:
        for token in re.split(r"[,;|•·]", m.group(1)):
            token = token.strip()
            if 2 <= len(token) <= 40:
                found.add(token)
    return sorted(found)[:40]


def _estimate_years(text: str) -> int:
    years = re.findall(r"(?i)(\d{1,2})\+?\s*years?", text)
    if years:
        return max(int(y) for y in years)
    return 0


def _parse_sections(text: str) -> ParsedResume:
    result = ParsedResume(raw_text=text)
    result.detected_language = _detect_language(text)

    emails = EMAIL_RE.findall(text)
    if emails:
        result.email = emails[0]
    phones = PHONE_RE.findall(text)
    if phones:
        result.phone = phones[0][:32]
    li = LINKEDIN_RE.search(text)
    if li:
        result.linkedin_url = li.group(0).rstrip(".,)")
    gh = GITHUB_RE.search(text)
    if gh:
        result.github_url = gh.group(0).rstrip(".,)")
    urls = [u.rstrip(".,)") for u in URL_RE.findall(text)]
    for u in urls:
        if "linkedin" not in u.lower() and "github" not in u.lower():
            result.website_url = u
            break

    nlp = _load_spacy_model(result.detected_language)
    doc = nlp(text[:100000])
    result.full_name = _extract_person_name(doc, text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC") and not result.location:
            result.location = ent.text
            break

    result.skills = _extract_skills(text)
    result.years_of_experience = _estimate_years(text)

    lines = text.splitlines()
    summary_lines: list[str] = []
    in_summary = False
    for line in lines:
        if re.match(r"(?i)^(summary|profile|about)\s*$", line.strip()):
            in_summary = True
            continue
        if in_summary:
            if re.match(r"(?i)^(experience|education|skills|projects)\s*$", line.strip()):
                break
            if line.strip():
                summary_lines.append(line.strip())
    if summary_lines:
        result.summary = " ".join(summary_lines)[:2000]

    cert_section = re.search(r"(?i)certifications?\s*[:\n]([\s\S]{0,1500})", text)
    if cert_section:
        for line in cert_section.group(1).splitlines()[:15]:
            line = line.strip(" •-\t")
            if 4 < len(line) < 120:
                result.certifications.append(line)

    result.headline = result.skills[0] if result.skills and not result.headline else result.headline
    return result


def enrich_with_ollama(parsed: ParsedResume) -> ParsedResume:
    from app.services.ollama_client import chat_json

    system = (
        "You extract structured resume data. Respond with JSON only matching keys: "
        "full_name, email, phone, location, headline, summary, years_of_experience, "
        "skills (array), education (array of {degree, institution, year}), "
        "work_experience (array of {title, company, duration, description}), "
        "certifications (array), projects (array of {name, description}), "
        "linkedin_url, github_url, website_url."
    )
    data = chat_json(system, parsed.raw_text[:12000])
    if not data:
        return parsed

    if isinstance(data.get("full_name"), str) and data["full_name"].strip():
        parsed.full_name = data["full_name"].strip()
    for key in ("email", "phone", "location", "headline", "summary", "linkedin_url", "github_url", "website_url"):
        val = data.get(key)
        if isinstance(val, str) and val.strip():
            setattr(parsed, key, val.strip())
    if isinstance(data.get("years_of_experience"), (int, float)):
        parsed.years_of_experience = int(data["years_of_experience"])
    if isinstance(data.get("skills"), list):
        parsed.skills = [str(s).strip() for s in data["skills"] if str(s).strip()][:50]
    return parsed


def parse_resume_file(filename: str, data: bytes, *, use_ollama: bool = True) -> dict[str, Any]:
    text = extract_text(filename, data)
    if not text.strip():
        raise ValueError("Could not extract text from document")

    parsed = _parse_sections(text)
    if use_ollama:
        parsed = enrich_with_ollama(parsed)

    completeness = 0
    if parsed.full_name:
        completeness += 15
    if parsed.email:
        completeness += 10
    if parsed.skills:
        completeness += 20
    if parsed.work_experience or "experience" in text.lower():
        completeness += 25
    if parsed.education or "education" in text.lower():
        completeness += 15
    if parsed.summary:
        completeness += 15

    out = parsed.to_dict()
    out["profile_completeness"] = min(100, completeness)
    return out
