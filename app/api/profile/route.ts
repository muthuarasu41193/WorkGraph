import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerSupabaseClient } from "../../../lib/supabase";

type ManualProfilePayload = {
  email: string;
  full_name?: string;
  headline?: string;
  linkedin_url?: string;
  github_url?: string;
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
    const body = (await request.json()) as ManualProfilePayload;
    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const payload: ManualProfilePayload = {
      email,
      full_name: body.full_name?.trim() || "",
      headline: body.headline?.trim() || "",
      linkedin_url: body.linkedin_url?.trim() || "",
      github_url: body.github_url?.trim() || "",
      skills: toStringArray(body.skills),
      experience: toStringArray(body.experience),
      education: toStringArray(body.education),
    };

    const profile_completeness = calculateCompleteness(payload);
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          email: payload.email,
          full_name: payload.full_name || null,
          headline: payload.headline || null,
          linkedin_url: payload.linkedin_url || null,
          github_url: payload.github_url || null,
          skills: payload.skills,
          experience: payload.experience,
          education: payload.education,
          resume_text: [
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
        { onConflict: "email" }
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
