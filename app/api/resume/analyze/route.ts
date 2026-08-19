import { NextResponse } from "next/server";
import { analyzeResumeWithGroq } from "@/lib/resume/groq-client";
import { extractResumeTextFromBuffer } from "@/lib/resume-intelligence";
import { normalizeResumeText } from "@/lib/resume/pdf-parser";
import { logRouteError } from "@/lib/security/log";
import { getSupabaseSessionUser } from "@/lib/route-auth";
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
    const {
      data: { user },
      error: authError,
    } = await getSupabaseSessionUser(request);
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

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
      const buffer = Buffer.from(await file.arrayBuffer());
      resumeText = (await extractResumeTextFromBuffer(buffer, file.name, file.type)).text;
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
    logRouteError("resume/analyze", error);
    return publicErrorResponse(error, {
      fallback: "Could not analyze your resume. Please try again.",
      style: "ok",
    });
  }
}
