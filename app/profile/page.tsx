import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ATSFeedback, Education, Profile, WorkExperience } from "../../lib/types";
import ProfileShell from "../../components/profile/premium/ProfileShell";
import { loadProfileJobDashboard } from "../../lib/job-dashboard";
import { getSupabaseSessionUser } from "../../lib/route-auth";
import { createServerSupabaseClient } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];
}

function asEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      degree: typeof item.degree === "string" ? item.degree : "",
      institution: typeof item.institution === "string" ? item.institution : "",
      year: typeof item.year === "string" ? item.year : "",
    }));
}

function asExperience(value: unknown): WorkExperience[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      company: typeof item.company === "string" ? item.company : "",
      duration: typeof item.duration === "string" ? item.duration : "",
      description: typeof item.description === "string" ? item.description : "",
    }));
}

function asFeedback(value: unknown): ATSFeedback | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  return {
    score: typeof obj.score === "number" ? obj.score : 0,
    grade: typeof obj.grade === "string" ? obj.grade : "F",
    strengths: asStringArray(obj.strengths),
    weaknesses: asStringArray(obj.weaknesses),
    suggestions: asStringArray(obj.suggestions),
    keyword_density: typeof obj.keyword_density === "string" ? obj.keyword_density : "low",
    formatting_score: typeof obj.formatting_score === "number" ? obj.formatting_score : 0,
    content_score: typeof obj.content_score === "number" ? obj.content_score : 0,
  };
}

export default async function ProfilePage() {
  const {
    data: { user },
  } = await getSupabaseSessionUser();

  if (!user) redirect("/login?next=/profile");

  const supabase = createServerSupabaseClient(await cookies());

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) redirect("/create-profile");

  const profile: Profile = {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    headline: data.headline,
    summary: data.summary,
    photo_url: data.photo_url,
    years_of_experience: data.years_of_experience,
    skills: asStringArray(data.skills),
    education: asEducation(data.education),
    work_experience: asExperience(data.work_experience),
    certifications: asStringArray(data.certifications),
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    website_url: data.website_url,
    resume_url: data.resume_url,
    resume_raw_text: data.resume_raw_text,
    ats_score: typeof data.ats_score === "number" ? data.ats_score : null,
    ats_feedback: asFeedback(data.ats_feedback),
    profile_completeness: typeof data.profile_completeness === "number" ? data.profile_completeness : 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  const jobDashboard = await loadProfileJobDashboard(supabase, user.id, {
    skills: profile.skills,
    headline: profile.headline,
  });

  return (
    <ProfileShell profile={profile} userId={user.id} recommendedJobs={jobDashboard.recommended} />
  );
}
