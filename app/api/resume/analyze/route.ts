import { NextResponse } from "next/server";
import { analyzeResumeWithGroq } from "@/lib/resume/groq-client";
import { extractResumeTextFromPdf, normalizeResumeText } from "@/lib/resume/pdf-parser";
import {
  isValidationError,
  parseResumeUploadFile,
  parseWithSchema,
  publicErrorResponse,
  resumeAnalyzeTextSchema,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const fields = parseWithSchema(resumeAnalyzeTextSchema, {
      resumeText: String(formData.get("resumeText") ?? ""),
      targetRole: String(formData.get("targetRole") ?? ""),
      jobDescription: String(formData.get("jobDescription") ?? ""),
    });
    const file =
      fileValue instanceof File && fileValue.size > 0
        ? parseResumeUploadFile(fileValue, { pdfOnly: true })
        : null;
    const resumeTextInput = fields.resumeText ?? "";
    const targetRole = fields.targetRole?.trim() ?? "";
    const jobDescription = fields.jobDescription?.trim() ?? "";

    if (!file && !resumeTextInput.trim()) {
      return NextResponse.json(
        { ok: false, error: "Upload a PDF or paste resume text." },
        { status: 400 },
      );
    }

    let resumeText = "";
    if (file) {
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
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid resume upload.", style: "ok" });
    }
    return publicErrorResponse(error, {
      fallback: "Could not analyze your resume. Please try again.",
      style: "ok",
    });
  }
}
