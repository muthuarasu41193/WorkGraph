import type { FreshnessIndicatorProps } from "@/components/product/FreshnessIndicator"
import type { MatchScoreProps } from "@/components/product/MatchScore"
import type { SalaryFigure } from "@/components/product/SalaryDisplay"
import type { SourceAttributionProps } from "@/components/product/SourceAttribution"
import type { TrustIndicatorProps } from "@/components/product/TrustIndicator"
import { getApplyLabel, jobSourceName } from "@/lib/job-apply"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import { riskFlags, visibleRiskFlags, type JobRiskInput } from "@/lib/job-risk"
import { isJobStale, STALE_AFTER_DAYS, postedAgeDays as ageInDays } from "@/lib/job-staleness"
import { parseStatedSalary, statedPaySortKey } from "@/lib/salary-parse"

export const JOB_FEED_PAGE_SIZE = 40
export { STALE_AFTER_DAYS }

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

export function postedAgeDays(iso: string | null | undefined, now = Date.now()): number | null {
  return ageInDays(iso, now)
}

export function trustPropsForListing(input: JobRiskInput): TrustIndicatorProps | undefined {
  const flags = visibleRiskFlags(riskFlags(input))
  if (flags.length === 0) return undefined
  const warning = flags.some((flag) => flag.code === "payment_requested")
  return {
    tone: warning ? "caution" : "clear",
    reason: flags.map((flag) => flag.explanation).join(" "),
    flags: flags.map((flag) => ({
      code: flag.code,
      label: flag.label,
      explanation: flag.explanation,
      warning: flag.code === "payment_requested",
    })),
  }
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

/** Infer a job type only when the posting text names one. Null means unknown. */
export function inferJobType(title: string, description: string): string | null {
  const hay = `${title}\n${description}`.toLowerCase()
  if (/\b(intern(ship)?)\b/.test(hay)) return "Internship"
  if (/\b(part[-\s]?time)\b/.test(hay)) return "Part-time"
  if (/\b(contract|contractor|freelance)\b/.test(hay)) return "Contract"
  if (/\b(full[-\s]?time)\b/.test(hay)) return "Full-time"
  return null
}

/** Same "Apply on {source}" string as the logged-in card. */
export function namedApplyLabel(
  source: string | null | undefined,
  applyUrl?: string | null,
  company?: string | null,
): string {
  return getApplyLabel(source, company, applyUrl)
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

function matchRequirements(job: RecommendedJobCard): { label: string; met: boolean }[] {
  const matched = new Set(job.matchedSkills)
  return [
    ...job.matchedSkills.map((label) => ({ label, met: true })),
    ...(job.missingSkills ?? []).filter((label) => !matched.has(label)).map((label) => ({ label, met: false })),
  ]
}

export function jobCardView(job: RecommendedJobCard, now = Date.now()): JobCardView {
  const stale = isJobStale(job.postedAtIso, now)
  const score = parseMatchPercent(job.matchLabel)
  const reason = job.matchLabel.replace(/^\d+% match ·\s*/, "") || "Not scored against a profile"
  const requirements = matchRequirements(job)
  const match: MatchScoreProps =
    score == null
      ? { score: 0, unscored: true, reason, requirements }
      : {
          score,
          reason: job.matchedSkills.length > 0 ? `Overlaps ${job.matchedSkills.slice(0, 3).join(", ")}` : reason,
          requirements,
        }
  const trust = trustPropsForListing({
    title: job.title,
    company: job.company,
    description: job.description,
    applyUrl: job.applyUrl,
    postedAtIso: job.postedAtIso,
    isCommunity: job.isCommunity,
    source: job.source,
    now,
  })
  return {
    salary: parseStatedSalary(job.description),
    freshness: {
      status: stale ? "stale" : "unknown",
      label: stale ? `Posted ${job.postedAgo} — may no longer be open` : `Posted ${job.postedAgo}`,
    },
    remoteType: remotePolicy(job.location),
    match,
    source: { source: jobSourceName(job.source, job.company, job.applyUrl), href: job.applyUrl || undefined },
    trust,
    applyLabel: namedApplyLabel(job.source, job.applyUrl, job.company),
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
  if (sort === "salary") {
    return jobs
      .map((job, index) => ({ job, index, key: statedPaySortKey(parseStatedSalary(job.description)) }))
      .sort((a, b) => {
        if (a.key == null && b.key == null) return a.index - b.index
        if (a.key == null) return 1
        if (b.key == null) return -1
        if (a.key !== b.key) return b.key - a.key
        return a.index - b.index
      })
      .map((item) => item.job)
  }
  return jobs
}
