import type { Profile } from "./types";
import { getSessionUser } from "./auth/session-server";
import { supabaseConfigured } from "./supabase-enabled";
import { supertokensEnabled } from "./auth/config";
import { workgraphApiEnabled } from "./workgraph-api";
import { workgraphBffFetch } from "./workgraph-bff";
import { createServerSupabaseClient } from "./supabase";
import { cookies } from "next/headers";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];
}

function mapRow(data: Record<string, unknown>): Profile {
  return {
    id: String(data.id),
    full_name: typeof data.full_name === "string" ? data.full_name : null,
    email: typeof data.email === "string" ? data.email : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    location: typeof data.location === "string" ? data.location : null,
    headline: typeof data.headline === "string" ? data.headline : null,
    summary: typeof data.summary === "string" ? data.summary : null,
    photo_url: typeof data.photo_url === "string" ? data.photo_url : null,
    years_of_experience: typeof data.years_of_experience === "number" ? data.years_of_experience : 0,
    skills: asStringArray(data.skills),
    education: Array.isArray(data.education) ? (data.education as Profile["education"]) : [],
    work_experience: Array.isArray(data.work_experience) ? (data.work_experience as Profile["work_experience"]) : [],
    certifications: asStringArray(data.certifications),
    linkedin_url: typeof data.linkedin_url === "string" ? data.linkedin_url : null,
    github_url: typeof data.github_url === "string" ? data.github_url : null,
    website_url: typeof data.website_url === "string" ? data.website_url : null,
    resume_url: typeof data.resume_url === "string" ? data.resume_url : null,
    resume_raw_text: typeof data.resume_raw_text === "string" ? data.resume_raw_text : null,
    ats_score: typeof data.ats_score === "number" ? data.ats_score : null,
    ats_feedback: data.ats_feedback as Profile["ats_feedback"],
    profile_completeness: typeof data.profile_completeness === "number" ? data.profile_completeness : 0,
    created_at: typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
    updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
  };
}

/** Load profile — Supabase `profiles` when configured, else self-hosted `wg_profiles`. */
export async function loadUserProfile(userId: string): Promise<Profile | null> {
  if (supabaseConfigured()) {
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  }

  if (workgraphApiEnabled() && supertokensEnabled()) {
    try {
      const { profile } = await workgraphBffFetch<{ profile: Record<string, unknown> }>("/profile/me");
      return mapRow(profile);
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireAuthenticatedUser() {
  return getSessionUser();
}
