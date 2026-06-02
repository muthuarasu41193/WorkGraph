import { NextResponse } from "next/server";
import { analyzeResumeWithGroq } from "@/lib/resume/groq-client";
import { extractResumeTextFromPdf, normalizeResumeText } from "@/lib/resume/pdf-parser";
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "@/lib/upload-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isPdf(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type === "application/pdf" || lower.endsWith(".pdf");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const resumeTextInput = String(formData.get("resumeText") ?? "");
    const targetRole = String(formData.get("targetRole") ?? "").trim();
    const jobDescription = String(formData.get("jobDescription") ?? "").trim();

    if (!file && !resumeTextInput.trim()) {
      return NextResponse.json(
        { ok: false, error: "Upload a PDF or paste resume text." },
        { status: 400 },
      );
    }

    let resumeText = "";
    if (file) {
      if (!isPdf(file)) {
        return NextResponse.json({ ok: false, error: "Only PDF files are supported." }, { status: 400 });
      }
      if (file.size > MAX_RESUME_UPLOAD_BYTES) {
        return NextResponse.json(
          { ok: false, error: `PDF exceeds ${MAX_RESUME_UPLOAD_LABEL}.` },
          { status: 413 },
        );
      }
      resumeText = await extractResumeTextFromPdf(file);
    } else {
      resumeText = normalizeResumeText(resumeTextInput);
    }

    if (resumeText.length < 120) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not enough resume content found. Add more text or upload a clearer PDF.",
        },
        { status: 422 },
      );
    }

    const analysis = await analyzeResumeWithGroq({
      resumeText,
      targetRole: targetRole || undefined,
      jobDescription: jobDescription || undefined,
    });

    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume analysis failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

