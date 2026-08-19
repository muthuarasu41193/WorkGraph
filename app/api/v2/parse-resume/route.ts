import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken, getSupabaseSessionUser } from "../../../../lib/route-auth";
import { parseResumeViaApi, workgraphApiEnabled } from "../../../../lib/workgraph-api";
import {
  buildNormalizedResume,
  persistResumeIntelligence,
  publicResumeIntelligence,
  resumeFileUrlForOwner,
  toLegacyProfileFields,
  toStoredResumeIntelligence,
} from "../../../../lib/resume-intelligence";
import {
  isValidationError,
  parseAiParsedResume,
  parseResumeUploadFile,
  publicErrorResponse,
} from "../../../../lib/validation";
import type { ParsedResume } from "../../../../packages/shared/types/workgraph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function safeFileName(name: string): string {
  return name.replace(/[/\\]/g, "-").replace(/\s+/g, "-").slice(0, 180);
}

/**
 * Self-hosted resume parsing via WorkGraph FastAPI (spaCy + Ollama), saved to Supabase profile.
 */
export async function POST(request: Request) {
  if (!workgraphApiEnabled()) {
    const url = new URL("/api/parse-resume", request.url);
    const forward = new Request(url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      duplex: "half",
    } as RequestInit);
    return fetch(forward);
  }

  try {
    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const {
      data: { user },
      error: userError,
    } = await getSupabaseSessionUser(request);
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const bearer = getBearerToken(request);
    let sessionEmail = user.email ?? "";
    if (bearer) {
      const { data: { user: jwtUser } } = await supabase.auth.getUser(bearer);
      if (jwtUser?.email) sessionEmail = jwtUser.email;
    }

    const form = await request.formData();
    const file = parseResumeUploadFile(form.get("file"));

    const parsedRaw = (await parseResumeViaApi(file, {
      userId: user.id,
      store: false,
    })) as ParsedResume & { raw_text?: string };
    const parsed = parseAiParsedResume(parsedRaw);

    const resumeText = parsedRaw.raw_text?.trim() ?? "";
    const storagePath = `${user.id}/${Date.now()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, file, {
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: "Could not store your resume. Please try again." }, { status: 500 });
    }
    const resumeUrl = resumeFileUrlForOwner();

    const formEmail = form.get("email");
    const emailOverride =
      typeof formEmail === "string" && formEmail.trim() ? formEmail.trim() : null;

    const normalized = buildNormalizedResume({
      sourceText: resumeText,
      extracted: parsedRaw,
    });
    const legacy = toLegacyProfileFields(normalized);
    const merged = parseAiParsedResume({
      ...parsed,
      ...legacy,
      years_of_experience: legacy.years_of_experience ?? parsed.years_of_experience,
    });

    const profileCompleteness =
      typeof parsedRaw.profile_completeness === "number"
        ? parsedRaw.profile_completeness
        : normalized.quality.completeness;

    const coreProfile = {
      id: user.id,
      email: merged.email ?? emailOverride ?? sessionEmail,
      full_name: merged.full_name || null,
      phone: merged.phone,
      location: merged.location,
      headline: merged.headline || null,
      summary: merged.summary,
      years_of_experience: merged.years_of_experience ?? null,
      skills: merged.skills ?? [],
      education: merged.education ?? [],
      work_experience: merged.work_experience ?? [],
      certifications: merged.certifications ?? [],
      linkedin_url: merged.linkedin_url,
      github_url: merged.github_url,
      website_url: merged.website_url,
      resume_raw_text: resumeText || null,
      resume_url: resumeUrl,
      profile_completeness: profileCompleteness,
      updated_at: new Date().toISOString(),
    };
    const intelligenceFields = {
      resume_intelligence: toStoredResumeIntelligence(normalized),
      resume_storage_path: storagePath,
      resume_embedding: normalized.embedding?.vector ?? null,
      resume_embedding_model: normalized.embedding?.model ?? null,
    };

    let { error: upsertError } = await supabase.from("profiles").upsert(
      { ...coreProfile, ...intelligenceFields },
      { onConflict: "id" },
    );
    if (upsertError) {
      const fallback = await supabase.from("profiles").upsert(coreProfile, { onConflict: "id" });
      upsertError = fallback.error;
    }

    if (upsertError) {
      return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
    }

    try {
      await persistResumeIntelligence({
        supabase,
        userId: user.id,
        storagePath,
        sourceText: resumeText,
        resume: normalized,
      });
    } catch {
      // Additive snapshot.
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...merged,
        resume_url: resumeUrl,
      },
      profile_completeness: profileCompleteness,
      resume_intelligence: publicResumeIntelligence(normalized),
      source: "workgraph-api",
    });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid resume upload." });
    }
    return publicErrorResponse(err, { fallback: "Could not parse your resume. Please try again." });
  }
}
