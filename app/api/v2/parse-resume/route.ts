import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken, getSupabaseSessionUser } from "../../../../lib/route-auth";
import { parseResumeViaApi, workgraphApiEnabled } from "../../../../lib/workgraph-api";
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "../../../../lib/upload-limits";
import type { ParsedResume } from "../../../../packages/shared/types/workgraph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
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
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_RESUME_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_RESUME_UPLOAD_LABEL}` },
        { status: 413 },
      );
    }

    const parsed = (await parseResumeViaApi(file, {
      userId: user.id,
      store: false,
    })) as ParsedResume & { raw_text?: string };

    const resumeText = parsed.raw_text?.trim() ?? "";
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, file, {
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(storagePath);

    const formEmail = form.get("email");
    const emailOverride =
      typeof formEmail === "string" && formEmail.trim() ? formEmail.trim() : null;

    const profileCompleteness =
      typeof parsed.profile_completeness === "number" ? parsed.profile_completeness : 0;

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: parsed.email ?? emailOverride ?? sessionEmail,
        full_name: parsed.full_name || null,
        phone: parsed.phone,
        location: parsed.location,
        headline: parsed.headline || null,
        summary: parsed.summary,
        years_of_experience: parsed.years_of_experience ?? null,
        skills: parsed.skills ?? [],
        education: parsed.education ?? [],
        work_experience: parsed.work_experience ?? [],
        certifications: parsed.certifications ?? [],
        linkedin_url: parsed.linkedin_url,
        github_url: parsed.github_url,
        website_url: parsed.website_url,
        resume_raw_text: resumeText || null,
        resume_url: publicUrlData.publicUrl,
        profile_completeness: profileCompleteness,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...parsed,
        resume_url: publicUrlData.publicUrl,
        resume_raw_text: resumeText,
      },
      profile_completeness: profileCompleteness,
      source: "workgraph-api",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
