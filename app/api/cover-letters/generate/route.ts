import { NextResponse } from "next/server";

import { generateCoverLetter } from "@/lib/cover-letters/service";
import { requireCoverLetterSession, type CoverLetterSession } from "@/lib/cover-letters/session";
import { logErrorCode, logRouteError } from "@/lib/security/log";
import { canUse, type Entitlement } from "@/lib/subscription/entitlements";
import { recordUsage } from "@/lib/subscription/usage";
import {
  coverLetterGenerateSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GenerateInput = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeText: string;
};

export type CoverLetterGenerateDeps = {
  requireSession: (request: Request) => Promise<CoverLetterSession>;
  canUseFeature: (userId: string, feature: "cover_letter") => Promise<Entitlement>;
  generate: (input: GenerateInput) => Promise<string>;
  record: (userId: string, feature: "cover_letter") => Promise<void>;
};

function limitResponse(decision: Entitlement) {
  if (decision.reason === "limit_reached") {
    return NextResponse.json(
      {
        error: "limit_reached",
        used: decision.used,
        limit: decision.limit,
        resetsAt: decision.resetsAt,
        upgradeUrl: "/pricing",
      },
      { status: 402 },
    );
  }
  return NextResponse.json(
    { error: "Could not generate a cover letter. Please try again." },
    { status: 503 },
  );
}

export async function handleCoverLetterGenerate(
  request: Request,
  deps: Partial<CoverLetterGenerateDeps> = {},
): Promise<Response> {
  const requireSession = deps.requireSession ?? requireCoverLetterSession;
  const canUseFeature = deps.canUseFeature ?? ((userId: string) => canUse(userId, "cover_letter"));
  const generate = deps.generate ?? generateCoverLetter;
  const record = deps.record ?? ((userId: string) => recordUsage(userId, "cover_letter"));

  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(coverLetterGenerateSchema, rawBody);

    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("id, resume_raw_text")
      .eq("id", auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const resumeText =
      typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";
    if (!resumeText) {
      return NextResponse.json(
        { error: "No resume found. Please upload your resume first." },
        { status: 400 },
      );
    }

    const decision = await canUseFeature(auth.userId, "cover_letter");
    if (!decision.allowed) return limitResponse(decision);

    try {
      const letter = await generate({
        jobTitle: body.jobTitle,
        company: body.company,
        jobDescription: body.jobDescription,
        resumeText,
      });
      try {
        await record(auth.userId, "cover_letter");
      } catch (error) {
        logErrorCode("cover-letters/generate", "usage_record_failed");
        logRouteError("cover-letters/generate", error);
      }
      return NextResponse.json({ letter });
    } catch (err) {
      logRouteError("cover-letters/generate", err);
      return NextResponse.json(
        { error: "Could not generate a cover letter. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid request." });
    }
    logRouteError("cover-letters/generate", error);
    return publicErrorResponse(error, {
      fallback: "Could not generate a cover letter. Please try again.",
    });
  }
}

export async function POST(request: Request) {
  return handleCoverLetterGenerate(request);
}
