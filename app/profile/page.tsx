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

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[65%_35%]">
          <section className="space-y-6">
            <ProfileHeader profile={profile} userId={user.id} />
            <LinksSection profile={profile} userId={user.id} />
            <SkillsSection userId={user.id} initialSkills={profile.skills} />
            <ExperienceTimeline userId={user.id} experience={profile.work_experience} />
            <EducationSection userId={user.id} education={profile.education} />
          </section>

          <aside className="space-y-6">
            <ATSScoreCard userId={user.id} score={profile.ats_score} feedback={profile.ats_feedback} />

            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#111827]">Quick Stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Skills</span>
                  <span className="font-semibold text-[#111827]">{profile.skills.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Experience Entries</span>
                  <span className="font-semibold text-[#111827]">{profile.work_experience.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Education Entries</span>
                  <span className="font-semibold text-[#111827]">{profile.education.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Certifications</span>
                  <span className="font-semibold text-[#111827]">{profile.certifications.length}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
