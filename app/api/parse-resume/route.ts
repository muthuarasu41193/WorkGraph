import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken, getSupabaseSessionUser } from "../../../lib/route-auth";
import {
  buildNormalizedResume,
  extractResumeTextFromBuffer,
  extractStructuredResumeWithGroq,
  persistResumeIntelligence,
  publicResumeIntelligence,
  resumeFileUrlForOwner,
  toLegacyProfileFields,
  toStoredResumeIntelligence,
} from "../../../lib/resume-intelligence";
import {
  isValidationError,
  parseAiParsedResume,
  parseResumeUploadFile,
  publicErrorResponse,
} from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Resume parsing + Groq can exceed default hobby limits; raise where your plan allows. */
export const maxDuration = 60;

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function safeFileName(name: string): string {
  return name.replace(/[/\\]/g, "-").replace(/\s+/g, "-").slice(0, 180);
}

function calculateProfileCompleteness(profile: ReturnType<typeof parseAiParsedResume>): number {
  let score = 0;

  if (profile.full_name) score += 15;
  if (profile.headline) score += 10;
  if (profile.summary) score += 10;
  if (profile.skills.length >= 3) score += 15;
  if (profile.work_experience.length >= 1) score += 20;
  if (profile.education.length >= 1) score += 15;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.certifications.length > 0) score += 5;

  return Math.min(100, score);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = parseResumeUploadFile(formData.get("file"));

    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    let userId: string | null = null;
    let sessionEmail: string | null = null;

    const bearer = getBearerToken(request);
    if (bearer) {
      const {
        data: { user },
        error: jwtError,
      } = await supabaseAdmin.auth.getUser(bearer);
      if (!jwtError && user) {
        userId = user.id;
        sessionEmail = user.email ?? null;
      }
    }

    if (!userId) {
      const {
        data: { user },
        error: sessionError,
      } = await getSupabaseSessionUser(request);
      if (!sessionError && user) {
        userId = user.id;
        sessionEmail = user.email ?? null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in and try again." },
        { status: 401 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractResumeTextFromBuffer(buffer, file.name, file.type);
    const resumeText = extracted.text;

    const storagePath = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("resumes").upload(storagePath, file, {
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: "Could not store your resume. Please try again." }, { status: 500 });
    }
    const resumeUrl = resumeFileUrlForOwner();

    let untrusted: unknown = {};
    try {
      untrusted = await extractStructuredResumeWithGroq(resumeText);
    } catch {
      untrusted = {};
    }

    const normalized = buildNormalizedResume({ sourceText: resumeText, extracted: untrusted });
    const legacy = toLegacyProfileFields(normalized);
    const parsedJson = parseAiParsedResume({
      ...legacy,
      years_of_experience: legacy.years_of_experience ?? 0,
      full_name: legacy.full_name ?? "",
      headline: legacy.headline ?? "",
    });

    const profile_completeness =
      normalized.quality.completeness || calculateProfileCompleteness(parsedJson);

    const formEmail = formData.get("email");
    const emailOverride =
      typeof formEmail === "string" && formEmail.trim() ? formEmail.trim() : null;

    const coreProfile = {
      id: userId,
      email: parsedJson.email ?? emailOverride ?? sessionEmail,
      full_name: parsedJson.full_name || null,
      phone: parsedJson.phone,
      location: parsedJson.location,
      headline: parsedJson.headline || null,
      summary: parsedJson.summary,
      years_of_experience: parsedJson.years_of_experience ?? null,
      skills: parsedJson.skills,
      education: parsedJson.education,
      work_experience: parsedJson.work_experience,
      certifications: parsedJson.certifications,
      linkedin_url: parsedJson.linkedin_url,
      github_url: parsedJson.github_url,
      website_url: parsedJson.website_url,
      resume_raw_text: resumeText,
      resume_url: resumeUrl,
      profile_completeness,
      updated_at: new Date().toISOString(),
    };

    const intelligenceFields = {
      resume_intelligence: toStoredResumeIntelligence(normalized),
      resume_storage_path: storagePath,
      resume_embedding: normalized.embedding?.vector ?? null,
      resume_embedding_model: normalized.embedding?.model ?? null,
    };

    let { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
      { ...coreProfile, ...intelligenceFields },
      { onConflict: "id" },
    );
    if (upsertError) {
      const fallback = await supabaseAdmin.from("profiles").upsert(coreProfile, { onConflict: "id" });
      upsertError = fallback.error;
    }

    if (upsertError) {
      return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
    }

    try {
      await persistResumeIntelligence({
        supabase: supabaseAdmin,
        userId,
        storagePath,
        sourceText: resumeText,
        resume: normalized,
      });
    } catch {
      // Additive snapshot; profile save is the production path.
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          ...parsedJson,
          resume_url: resumeUrl,
        },
        profile_completeness,
        resume_intelligence: publicResumeIntelligence(normalized),
      },
      { status: 200 }
    );
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid resume upload." });
    }
    return publicErrorResponse(error, { fallback: "Could not parse your resume. Please try again." });
  }
}
