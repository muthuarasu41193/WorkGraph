import { cookies } from "next/headers"
import Link from "next/link"
import { JobFeed, type AppliedRef } from "@/components/jobs/JobFeed"
import { PullToRefresh } from "@/components/states/PullToRefresh"
import { Text } from "@/components/ui/text"
import { thinCoverageNote } from "@/lib/credibility"
import { getSessionUser } from "@/lib/auth/session-server"
import { listApplicationsForUser } from "@/lib/applications-server"
import { JOB_FEED_PAGE_SIZE, parseFeedSort, relaxQuery } from "@/lib/job-feed"
import { fetchLiveJobsPage, loadLiveJobCardsPage, mapJobRowToCard } from "@/lib/jobs-catalog"
import { loadUserProfile } from "@/lib/load-profile"
import { createServerSupabaseClient } from "@/lib/supabase"
import { parseJobSearchQuery } from "@/lib/validation"
import type { RecommendedJobCard } from "@/lib/job-dashboard"

export const dynamic = "force-dynamic"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(raw)) {
    const item = first(value)
    if (item) params.set(key, item)
  }
  const parsed = parseJobSearchQuery(params)
  const sort = parseFeedSort(params.get("sort") ?? undefined)
  const user = await getSessionUser()
  const profile = user ? await loadUserProfile(user.id) : null
  const skills = profile?.skills ?? []
  const supabase = createServerSupabaseClient(await cookies())
  const rank = sort === "match" && skills.length > 0

  async function load(filters = parsed.filters) {
    if (rank) {
      const ranked = await loadLiveJobCardsPage(supabase, skills, {
        page: 1,
        pageSize: JOB_FEED_PAGE_SIZE,
        filters,
        rankByProfile: true,
        includeHiringSignals: false,
        profile: { skills, headline: profile?.headline, summary: profile?.summary },
      })
      return { jobs: ranked.jobs, total: ranked.total, hasMore: ranked.hasMore }
    }
    const page = await fetchLiveJobsPage(supabase, { page: 1, pageSize: JOB_FEED_PAGE_SIZE, filters })
    const jobs = page.rows
      ? page.rows.map((row) => mapJobRowToCard(row, skills, { skills, headline: profile?.headline, summary: profile?.summary }))
      : null
    return { jobs, total: page.total, hasMore: page.hasMore }
  }

  let result = await load()
  let relaxedQuery: string | null = null
  const originalQuery = parsed.q ?? null
  if (result.jobs && result.total === 0 && originalQuery) {
    const relaxed = relaxQuery(originalQuery)
    if (relaxed) {
      const second = await load({ ...parsed.filters, q: relaxed })
      if (second.jobs && second.total > 0) {
        result = second
        relaxedQuery = relaxed
      }
    }
  }

  let applications: AppliedRef[] = []
  if (user) {
    try {
      const rows = await listApplicationsForUser()
      applications = rows.map((row) => ({ company: row.company, role: row.role, job_url: row.job_url }))
    } catch {
      applications = []
    }
  }

  const jobs: RecommendedJobCard[] = result.jobs ?? []
  const coverage = result.jobs ? thinCoverageNote(result.total) : null
  return (
    <main>
      <PullToRefresh>
        {coverage ? (
          <div className="border-b border-hairline px-4 py-3">
            <Text role="body-small">{coverage}</Text>
            <Link href="/jobs" className="inline-flex min-h-11 items-center text-role-body-small text-accent">Search without these filters</Link>
          </div>
        ) : null}
        <JobFeed
          key={params.toString()}
          initial={{
            jobs,
            total: result.jobs ? result.total : 0,
            hasMore: result.hasMore,
            error: result.jobs ? null : "Jobs could not be loaded. Refresh the page to try again.",
            relaxedQuery,
            originalQuery,
          }}
          userId={user?.id ?? null}
          applications={applications}
          skills={skills}
          search={params.toString()}
        />
      </PullToRefresh>
    </main>
  )
}
