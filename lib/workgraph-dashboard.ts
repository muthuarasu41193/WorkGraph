/**
 * Profile dashboard integration with self-hosted WorkGraph API.
 */

import type { JobMatch } from "../packages/shared/types/workgraph";
import type { JobMatchPreview } from "./profile-mock-data";
import type { Profile } from "./types";
import { matchJobsViaApi, workgraphApiEnabled } from "./workgraph-api";

function inferWorkMode(location: string): JobMatchPreview["workMode"] {
  const l = location.toLowerCase();
  if (l.includes("remote")) return "Remote";
  if (l.includes("hybrid")) return "Hybrid";
  return "On-site";
}

/** Build resume text for embedding match when raw resume is missing. */
export function buildResumeTextForMatch(profile: Pick<
  Profile,
  "resume_raw_text" | "headline" | "summary" | "skills" | "work_experience"
>): string {
  if (profile.resume_raw_text?.trim()) {
    return profile.resume_raw_text.trim();
  }
  const parts: string[] = [];
  if (profile.headline) parts.push(profile.headline);
  if (profile.summary) parts.push(profile.summary);
  if (profile.skills.length) parts.push(`Skills: ${profile.skills.join(", ")}`);
  for (const exp of profile.work_experience) {
    parts.push(
      [exp.title, exp.company, exp.duration, exp.description].filter(Boolean).join(" — "),
    );
  }
  return parts.join("\n").trim();
}

export function jobMatchesToPreviews(matches: JobMatch[]): JobMatchPreview[] {
  return matches.map((m) => ({
    id: String(m.job_id),
    title: m.title,
    company: m.company,
    matchPercent: Math.min(99, Math.max(50, Math.round(m.similarity * 100))),
    salaryRange: "See listing",
    workMode: inferWorkMode(m.location),
    location: m.location || "—",
    applyUrl: m.apply_url,
  }));
}

export async function loadSemanticJobMatches(
  profile: Pick<
    Profile,
    "resume_raw_text" | "headline" | "summary" | "skills" | "work_experience"
  >,
  topK = 12,
): Promise<JobMatchPreview[] | null> {
  if (!workgraphApiEnabled()) return null;

  const resumeText = buildResumeTextForMatch(profile);
  if (resumeText.length < 80) return null;

  try {
    const { matches } = await matchJobsViaApi(resumeText, topK);
    if (!matches.length) return null;
    return jobMatchesToPreviews(matches);
  } catch (err) {
    console.warn("[workgraph-dashboard] semantic match failed:", err);
    return null;
  }
}
