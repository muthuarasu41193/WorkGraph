import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getSessionUser } from "../../../lib/auth/session-server";
import { supabaseServiceRoleConfigured } from "../../../lib/supabase-enabled";
import { workgraphApiEnabled } from "../../../lib/workgraph-api";
import { workgraphBffFetch } from "../../../lib/workgraph-bff";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

type ManualProfilePayload = {
  email?: string;
  full_name?: string;
  headline?: string;
  summary?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
};

function toStringArray(input: unknown): string[] {
  return Array.isArray(input)
    ? input.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];
}

function calculateCompleteness(payload: ManualProfilePayload): number {
  let score = 0;
  if (payload.full_name?.trim()) score += 15;
  if (payload.email?.trim()) score += 20;
  if (payload.headline?.trim()) score += 10;
  if ((payload.skills ?? []).length > 0) score += 20;
  if ((payload.experience ?? []).length > 0) score += 15;
  if ((payload.education ?? []).length > 0) score += 10;
  if (payload.linkedin_url?.trim() || payload.github_url?.trim()) score += 10;
  return Math.min(100, score);
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated. Please sign in and try again." }, { status: 401 });
    }

    const body = (await request.json()) as ManualProfilePayload;
    const email = body.email?.trim() || sessionUser.email || "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const payload: ManualProfilePayload = {
      email,
      full_name: body.full_name?.trim() || "",
      headline: body.headline?.trim() || "",
      summary: body.summary?.trim() || "",
      location: body.location?.trim() || "",
      linkedin_url: body.linkedin_url?.trim() || "",
      github_url: body.github_url?.trim() || "",
      website_url: body.website_url?.trim() || "",
      skills: toStringArray(body.skills),
      experience: toStringArray(body.experience),
      education: toStringArray(body.education),
    };

    const profile_completeness = calculateCompleteness(payload);
    const work_experience = (payload.experience ?? []).map((line) => ({
      title: line,
      company: "",
      duration: "",
      description: "",
    }));
    const education = (payload.education ?? []).map((line) => ({
      degree: line,
      institution: "",
      year: "",
    }));

    if (!supabaseServiceRoleConfigured()) {
      if (!workgraphApiEnabled()) {
        return NextResponse.json(
          { error: "Configure NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY, or WORKGRAPH_API_URL." },
          { status: 503 },
        );
      }
      const wgBody = {
        email,
        full_name: payload.full_name || "",
        headline: payload.headline || "",
        summary: payload.summary || "",
        location: payload.location || "",
        linkedin_url: payload.linkedin_url || "",
        github_url: payload.github_url || "",
        website_url: payload.website_url || "",
        skills: payload.skills,
        work_experience,
        education,
        resume_raw_text: [
          payload.full_name ? `Name: ${payload.full_name}` : "",
          payload.headline ? `Headline: ${payload.headline}` : "",
          payload.skills?.length ? `Skills: ${payload.skills.join(", ")}` : "",
          payload.experience?.length ? `Experience: ${payload.experience.join(" | ")}` : "",
          payload.education?.length ? `Education: ${payload.education.join(" | ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        profile_completeness,
      };
      const data = await workgraphBffFetch<{ profile: Record<string, unknown> }>("/profile/me", {
        method: "PUT",
        request,
        body: JSON.stringify(wgBody),
      });
      return NextResponse.json({
        success: true,
        profile: data.profile,
        profile_completeness,
      });
    }

    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: sessionUser.id,
          email: payload.email,
          full_name: payload.full_name || null,
          headline: payload.headline || null,
          summary: payload.summary || null,
          location: payload.location || null,
          linkedin_url: payload.linkedin_url || null,
          github_url: payload.github_url || null,
          website_url: payload.website_url || null,
          skills: payload.skills,
          work_experience,
          education,
          resume_raw_text: [
            payload.full_name ? `Name: ${payload.full_name}` : "",
            payload.headline ? `Headline: ${payload.headline}` : "",
            payload.skills?.length ? `Skills: ${payload.skills.join(", ")}` : "",
            payload.experience?.length ? `Experience: ${payload.experience.join(" | ")}` : "",
            payload.education?.length ? `Education: ${payload.education.join(" | ")}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          profile_completeness,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data, profile_completeness });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error saving profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
