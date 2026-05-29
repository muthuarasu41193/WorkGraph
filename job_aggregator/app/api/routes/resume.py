"""POST /resume/parse — upload PDF/DOCX and return structured profile."""

from __future__ import annotations

import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.resume_parser import parse_resume_file
from app.services.storage import upload_resume

router = APIRouter()
MAX_BYTES = int(os.getenv("MAX_RESUME_UPLOAD_BYTES", str(4 * 1024 * 1024)))


class ParsedResumeResponse(BaseModel):
    full_name: str = ""
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    headline: str = ""
    summary: str | None = None
    years_of_experience: int = 0
    skills: list[str] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    work_experience: list[dict] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)
    linkedin_url: str | None = None
    github_url: str | None = None
    website_url: str | None = None
    detected_language: str = "en"
    profile_completeness: int = 0
    resume_storage_key: str | None = None
    raw_text: str | None = None


@router.post("/parse", response_model=ParsedResumeResponse)
async def parse_resume(
    file: UploadFile = File(...),
    user_id: str | None = Form(None),
    store: bool = Form(False),
    use_ollama: bool = Form(True),
) -> ParsedResumeResponse:
    if not file.filename:
        raise HTTPException(400, "filename required")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"File exceeds {MAX_BYTES} bytes")

    lower = file.filename.lower()
    if not (lower.endswith(".pdf") or lower.endswith(".docx") or lower.endswith(".txt")):
        raise HTTPException(400, "Supported formats: PDF, DOCX, TXT")

    try:
        parsed = parse_resume_file(file.filename, data, use_ollama=use_ollama)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    storage_key: str | None = None
    if store and user_id:
        import io

        ct = file.content_type or "application/octet-stream"
        storage_key = upload_resume(user_id, file.filename, io.BytesIO(data), ct)
        parsed["resume_storage_key"] = storage_key

    return ParsedResumeResponse.model_validate(parsed)
