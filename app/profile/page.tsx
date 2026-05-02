import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase";
import type { ATSFeedback, Education, Profile, WorkExperience } from "../../lib/types";
import ProfileHeader from "../../components/profile/ProfileHeader";
import LinksSection from "../../components/profile/LinksSection";
import SkillsSection from "../../components/profile/SkillsSection";
import ExperienceTimeline from "../../components/profile/ExperienceTimeline";
import EducationSection from "../../components/profile/EducationSection";
import ATSScoreCard from "../../components/profile/ATSScoreCard";
import ProfileTopBar from "../../components/profile/ProfileTopBar";
import ProfileQuickActions from "../../components/profile/ProfileQuickActions";
import ProfileJobDashboard from "../../components/profile/ProfileJobDashboard";
import RecommendedJobsSection from "../../components/profile/RecommendedJobsSection";
import { loadProfileJobDashboard } from "../../lib/job-dashboard";

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
  const supabase = createServerSupabaseClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/upload");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) redirect("/upload");

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
  const firstName = (profile.full_name?.trim().split(/\s+/)[0] ?? "").trim();

  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_18%,#ffffff_42%,#f0fdf9_100%)]">
      <ProfileTopBar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:space-y-10 lg:pb-20 lg:pt-10">
        <ProfileQuickActions userFirstName={firstName || "there"} />

        <ProfileJobDashboard
          stats={jobDashboard.pipeline}
          profileCompleteness={profile.profile_completeness}
          liveListings={jobDashboard.liveListings}
          listingsBySource={jobDashboard.listingsBySource}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-10">
          <div className="space-y-6">
            <ProfileHeader profile={profile} userId={user.id} />
            <LinksSection profile={profile} userId={user.id} />
            <SkillsSection userId={user.id} initialSkills={profile.skills} />
            <ExperienceTimeline userId={user.id} experience={profile.work_experience} />
            <EducationSection userId={user.id} education={profile.education} />
          </div>

          <aside className="space-y-6 xl:sticky xl:top-[4.25rem]">
            <ATSScoreCard userId={user.id} score={profile.ats_score} feedback={profile.ats_feedback} />

            <section className="rounded-3xl border border-emerald-100/90 bg-white/90 p-6 shadow-[0_20px_60px_-44px_rgba(16,185,129,0.35)] backdrop-blur-sm">
              <h2 className="text-base font-semibold text-slate-900">Resume snapshot</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Tallies from your parsed profile — sync applications above when your tracker is live.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/60 px-3 py-2.5 ring-1 ring-emerald-100/80">
                  <dt className="text-slate-600">Skills</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{profile.skills.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <dt className="text-slate-600">Experience</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{profile.work_experience.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <dt className="text-slate-600">Education</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{profile.education.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <dt className="text-slate-600">Certifications</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">{profile.certifications.length}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>

        <RecommendedJobsSection jobs={jobDashboard.recommended} skillHints={profile.skills} feedKind={jobDashboard.feedKind} />
      </main>
    </div>
  );
}
