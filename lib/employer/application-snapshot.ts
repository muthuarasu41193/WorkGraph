import type { Profile } from "@/lib/types";
import type { ApplicationSnapshot } from "./types";

export type ApplicationInput = {
  connectionNote?: string;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  stackoverflowUrl?: string | null;
};

function trimUrl(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v || null;
}

/** Build the employer-visible application package from profile + optional overrides. */
export function buildApplicationSnapshot(
  profile: Profile,
  input: ApplicationInput = {},
): ApplicationSnapshot {
  return {
    full_name: profile.full_name,
    headline: profile.headline,
    email: profile.email,
    location: profile.location,
    summary: profile.summary,
    years_of_experience: profile.years_of_experience,
    skills: profile.skills ?? [],
    education: profile.education ?? [],
    work_experience: profile.work_experience ?? [],
    certifications: profile.certifications ?? [],
    resume_url: trimUrl(input.resumeUrl) ?? profile.resume_url,
    linkedin_url: trimUrl(input.linkedinUrl) ?? profile.linkedin_url,
    github_url: trimUrl(input.githubUrl) ?? profile.github_url,
    website_url: trimUrl(input.websiteUrl) ?? profile.website_url,
    stackoverflow_url: trimUrl(input.stackoverflowUrl) ?? profile.stackoverflow_url ?? null,
    message: input.connectionNote?.trim().slice(0, 2000) ?? "",
  };
}

export function parseApplicationSnapshot(raw: unknown): ApplicationSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.full_name && !o.email && !o.resume_url && !o.message) return null;

  return {
    full_name: o.full_name != null ? String(o.full_name) : null,
    headline: o.headline != null ? String(o.headline) : null,
    email: o.email != null ? String(o.email) : null,
    location: o.location != null ? String(o.location) : null,
    summary: o.summary != null ? String(o.summary) : null,
    years_of_experience:
      typeof o.years_of_experience === "number" ? o.years_of_experience : null,
    skills: Array.isArray(o.skills)
      ? (o.skills as unknown[]).map((s) => String(s)).filter(Boolean)
      : [],
    education: Array.isArray(o.education) ? (o.education as ApplicationSnapshot["education"]) : [],
    work_experience: Array.isArray(o.work_experience)
      ? (o.work_experience as ApplicationSnapshot["work_experience"])
      : [],
    certifications: Array.isArray(o.certifications)
      ? (o.certifications as unknown[]).map((s) => String(s)).filter(Boolean)
      : [],
    resume_url: o.resume_url != null ? String(o.resume_url) : null,
    linkedin_url: o.linkedin_url != null ? String(o.linkedin_url) : null,
    github_url: o.github_url != null ? String(o.github_url) : null,
    website_url: o.website_url != null ? String(o.website_url) : null,
    stackoverflow_url: o.stackoverflow_url != null ? String(o.stackoverflow_url) : null,
    message: o.message != null ? String(o.message) : "",
  };
}
