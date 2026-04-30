import {
  BriefcaseBusiness,
  Camera,
  CircleDashed,
  Globe,
  GraduationCap,
  Link2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { createServerComponentSupabaseClient } from "../../lib/supabase-server";
import SignOutButton from "./sign-out-button";

type ProfileViewModel = {
  isAuthenticated: boolean;
  name: string;
  headline: string;
  linkedin: string;
  github: string;
  atsScore: number;
  skills: string[];
  experience: string[];
  education: string[];
};

const emptyProfile: ProfileViewModel = {
  isAuthenticated: false,
  name: "Your Profile",
  headline: "Add your resume to automatically populate this page.",
  linkedin: "",
  github: "",
  atsScore: 0,
  skills: [],
  experience: [],
  education: [],
};

function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
    : [];
}

async function getProfile(): Promise<ProfileViewModel> {
  const supabase = await createServerComponentSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return emptyProfile;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, headline, linkedin_url, github_url, skills, experience, education, ats_score, updated_at"
    )
    .eq("email", user.email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return { ...emptyProfile, isAuthenticated: true };

  const atsScore =
    typeof data.ats_score === "number" && Number.isFinite(data.ats_score)
      ? Math.max(0, Math.min(100, Math.round(data.ats_score)))
      : 0;

  return {
    isAuthenticated: true,
    name: data.full_name?.trim() || "Your Profile",
    headline: data.headline?.trim() || "Add your resume to automatically populate this page.",
    linkedin: data.linkedin_url?.trim() || "",
    github: data.github_url?.trim() || "",
    atsScore,
    skills: toStringList(data.skills),
    experience: toStringList(data.experience),
    education: toStringList(data.education),
  };
}

function AtsScoreRing({ score }: { score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg className="-rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#111827"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold text-gray-900">{score}</p>
        <p className="text-xs uppercase tracking-wide text-gray-500">ATS Score</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex justify-end">
          {profile.isAuthenticated ? <SignOutButton /> : null}
        </div>

        <section className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400"
              >
                <CircleDashed className="h-8 w-8 text-gray-300" />
                <span className="sr-only">Upload profile photo</span>
                <span className="absolute inset-0 hidden items-center justify-center bg-black/5 group-hover:flex">
                  <Camera className="h-4 w-4 text-gray-700" />
                </span>
              </button>
              <div>
                <h1 className="text-2xl font-semibold">{profile.name}</h1>
                <p className="mt-1 max-w-xl text-sm text-gray-600">{profile.headline}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {profile.linkedin ? (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <Link2 className="h-4 w-4" />
                  LinkedIn
                </a>
              ) : null}
              {profile.github ? (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <Globe className="h-4 w-4" />
                  GitHub
                </a>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-5">
            <AtsScoreRing score={profile.atsScore} />
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
              <Sparkles className="h-3.5 w-3.5" />
              Strong ATS profile
            </div>
          </aside>
        </section>
        {!profile.isAuthenticated ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Please sign in to view your profile</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to load your resume data, ATS score, and experience timeline automatically.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Go to Login
            </Link>
          </section>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No skills added yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Education
            </h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                {profile.education[0] || "No education entries yet."}
              </p>
              {profile.education.length > 1 ? (
                <p className="mt-1 text-sm text-gray-700">{profile.education.slice(1).join(" | ")}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Work Experience
          </h2>
          <ol className="relative space-y-6 border-l border-gray-200 pl-6">
            {(profile.experience.length > 0
              ? profile.experience
              : ["No work experience entries yet."]).map((item, index) => (
              <li key={`${item}-${index}`} className="relative">
                <span className="absolute -left-[33px] top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white">
                  <BriefcaseBusiness className="h-3 w-3 text-gray-600" />
                </span>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
