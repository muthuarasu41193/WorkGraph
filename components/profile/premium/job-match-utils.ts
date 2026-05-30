import type { RecommendedJobCard } from "../../../lib/job-dashboard";
import { MOCK_JOB_MATCHES, type JobMatchPreview } from "../../../lib/profile-mock-data";

function inferWorkMode(location: string): JobMatchPreview["workMode"] {
  const l = location.toLowerCase();
  if (l.includes("remote")) return "Remote";
  if (l.includes("hybrid")) return "Hybrid";
  return "On-site";
}

function parseMatchPercent(label: string): number {
  const m = label.match(/(\d{1,3})/);
  if (!m) return 75;
  return Math.min(99, Math.max(50, Number(m[1])));
}

export type JobMatchPreviewExt = JobMatchPreview & { applyUrl?: string };

/** Prefer AI semantic matches; else map Supabase job cards; mock only in demo mode. */
export function resolveProfileJobMatches(
  semantic?: JobMatchPreviewExt[] | null,
  jobs?: RecommendedJobCard[],
  feedKind: "live" | "demo" = "demo",
): JobMatchPreviewExt[] {
  if (semantic?.length) return semantic.slice(0, 12);
  return jobCardsToMatches(jobs, feedKind);
}

/** Map live recommended jobs to horizontal match cards; mock only when feed is demo. */
export function jobCardsToMatches(
  jobs?: RecommendedJobCard[],
  feedKind: "live" | "demo" = "demo",
): JobMatchPreviewExt[] {
  if (jobs?.length) {
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
  if (feedKind === "live") return [];
  return MOCK_JOB_MATCHES;
}
