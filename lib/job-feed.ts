import type { FreshnessIndicatorProps } from "@/components/product/FreshnessIndicator"
import type { MatchScoreProps } from "@/components/product/MatchScore"
import type { SalaryFigure } from "@/components/product/SalaryDisplay"
import type { SourceAttributionProps } from "@/components/product/SourceAttribution"
import type { TrustIndicatorProps } from "@/components/product/TrustIndicator"
import { getApplyLabel } from "@/lib/job-apply"
import { formatJobSource } from "@/lib/job-card-data"
import type { RecommendedJobCard } from "@/lib/job-dashboard"

export const JOB_FEED_PAGE_SIZE = 40
export const STALE_AFTER_DAYS = 60

export const FEED_SOURCES = [
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "smartrecruiters",
  "usajobs",
  "adzuna",
  "remoteok",
] as const

export const FEED_JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const

export type FeedSort = "newest" | "match" | "salary" | "verified"

export function parseFeedSort(value: string | undefined): FeedSort {
  if (value === "match" || value === "salary" || value === "verified") return value
  return "newest"
}

export function postedAgeDays(iso: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((Date.now() - then) / 86_400_000)
}

export function parseMatchPercent(label: string): number | null {
  const match = label.match(/(\d+)% match/)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

export function remotePolicy(location: string): string {
  const loc = location.toLowerCase()
  if (loc.includes("hybrid")) return "Hybrid"
  if (loc.includes("remote") || loc.includes("work from home")) return "Remote"
  if (!location.trim() || location === "Location TBD") return "Remote policy not listed"
  return "Listed location"
}

export function namedApplyLabel(source: string | null | undefined, hasUrl: boolean): string {
  if (!hasUrl) return "Apply on the company site"
  const key = String(source ?? "").trim().toLowerCase()
  if (key === "" || key === "company" || key === "workgraph" || key === "other") {
    return "Apply on the company site"
  }
  const label = getApplyLabel(source)
  if (label === "Apply Now" || label === "Apply on Company Site") return "Apply on the company site"
  return label
}

export function relaxQuery(query: string): string | null {
  const trimmed = query.trim()
  if (trimmed.length < 4) return null
  const parts = trimmed.split(/\s+/)
  if (parts.length > 1) return parts.slice(0, -1).join(" ")
  return trimmed.slice(0, -1)
}

export type JobCardView = {
  salary: SalaryFigure
  freshness: FreshnessIndicatorProps
  remoteType: string
  match: MatchScoreProps
  source: SourceAttributionProps
  trust?: TrustIndicatorProps
  applyLabel: string
  stale: boolean
}

export function jobCardView(job: RecommendedJobCard): JobCardView {
  const days = postedAgeDays(job.postedAtIso)
  const stale = days != null && days >= STALE_AFTER_DAYS
  const score = parseMatchPercent(job.matchLabel)
  const reason = job.matchLabel.replace(/^\d+% match ·\s*/, "") || "Not scored against a profile"
  const match: MatchScoreProps =
    score == null
      ? { score: 0, unscored: true, reason, requirements: job.matchedSkills.map((skill) => ({ label: skill, met: true })) }
      : {
          score,
          reason: job.matchedSkills.length > 0 ? `Overlaps ${job.matchedSkills.slice(0, 3).join(", ")}` : reason,
          requirements: job.matchedSkills.map((skill) => ({ label: skill, met: true })),
        }
  const trust: TrustIndicatorProps | undefined = !job.applyUrl
    ? { tone: "caution", reason: "No apply link is stored for this listing." }
    : !job.company || job.company === "Company"
      ? { tone: "caution", reason: "The company name is missing on this listing." }
      : undefined
  return {
    salary: { kind: "undisclosed" },
    freshness: {
      status: stale ? "stale" : "unknown",
      label: stale ? `Posted ${job.postedAgo} — may no longer be open` : `Posted ${job.postedAgo}`,
    },
    remoteType: remotePolicy(job.location),
    match,
    source: { source: formatJobSource(job.source), href: job.applyUrl || undefined },
    trust,
    applyLabel: namedApplyLabel(job.source, Boolean(job.applyUrl)),
    stale,
  }
}

export function sortFeedJobs(jobs: RecommendedJobCard[], sort: FeedSort): RecommendedJobCard[] {
  if (sort === "match") {
    return [...jobs].sort((a, b) => (parseMatchPercent(b.matchLabel) ?? -1) - (parseMatchPercent(a.matchLabel) ?? -1))
  }
  if (sort === "newest") {
    return [...jobs].sort((a, b) => {
      const left = a.postedAtIso ? new Date(a.postedAtIso).getTime() : 0
      const right = b.postedAtIso ? new Date(b.postedAtIso).getTime() : 0
      return right - left
    })
  }
  return jobs
}
