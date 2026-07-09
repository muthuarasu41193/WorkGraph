import type { RecommendedJobCard } from "../../../lib/job-dashboard";
import type { JobMatchPreview } from "../../../lib/profile-mock-data";

function inferWorkMode(location: string): JobMatchPreview["workMode"] {
  const l = location.toLowerCase();
  if (l.includes("remote")) return "Remote";
  if (l.includes("hybrid")) return "Hybrid";
  return "On-site";
}

function parseMatchPercent(label: string): number {
  const matchPct = label.match(/(\d{1,3})%\s*match/i);
  if (matchPct) return Math.min(99, Math.max(48, Number(matchPct[1])));
  const m = label.match(/(\d{1,3})/);
  if (!m) return 75;
  return Math.min(99, Math.max(48, Number(m[1])));
}

export type JobMatchPreviewExt = JobMatchPreview & { applyUrl?: string };

/** Prefer AI semantic matches; else map live Supabase job cards. */
export function resolveProfileJobMatches(
  semantic?: JobMatchPreviewExt[] | null,
  jobs?: RecommendedJobCard[],
): JobMatchPreviewExt[] {
  if (semantic?.length) return semantic.slice(0, 12);
  return jobCardsToMatches(jobs);
}

/** Map live recommended jobs to horizontal match cards. */
export function jobCardsToMatches(jobs?: RecommendedJobCard[]): JobMatchPreviewExt[] {
  if (!jobs?.length) return [];
  return jobs.slice(0, 6).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    matchPercent: parseMatchPercent(job.matchLabel),
    salaryRange: "See listing",
    workMode: inferWorkMode(job.location),
    location: job.location,
    applyUrl: job.applyUrl ?? undefined,
  }));
}
