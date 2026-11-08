import Link from "next/link"
import { HeroSearch } from "@/components/marketing/HeroSearch"
import { ProductJobCard } from "@/components/product/JobCard"
import { MatchScore } from "@/components/product/MatchScore"
import { Text } from "@/components/ui/text"
import { countedAtLabel } from "@/lib/credibility"
import { jobCardView, parseMatchPercent } from "@/lib/job-feed"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import type { IndexStats } from "@/lib/social-proof-server"

function Stat({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  return (
    <div className="space-y-1">
      <Text as="p" role="heading" className="tabular-nums">
        {value.toLocaleString("en-US")}
      </Text>
      <Text role="caption" className="text-ink-muted">
        {label}
      </Text>
    </div>
  )
}

export function LiveIndexSection({
  stats,
  demo,
  countedAt,
}: {
  stats: IndexStats
  demo: RecommendedJobCard | null
  countedAt: string
}) {
  const shown = [stats.liveJobs, stats.postedLast24Hours, stats.verifiedEmployers].some(
    (value) => value != null,
  )
  const view = demo ? jobCardView(demo) : null
  const score = demo ? parseMatchPercent(demo.matchLabel) : null

  return (
    <section
      id="try-index"
      aria-labelledby="index-heading"
      className="border-b border-hairline"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
          <div className="space-y-3">
            <Text as="h2" role="title" id="index-heading">
              Try the live index
            </Text>
            <Text role="body" className="max-w-xl text-ink-muted">
              Search here, or open the full jobs page. Counts below are loaded
              when this page renders. Missing counts are omitted.
            </Text>
          </div>
          <aside className="rounded-card border border-hairline bg-surface-raised p-4">
            {shown ? (
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <Stat label="Jobs in the index" value={stats.liveJobs} />
                <Stat label="Posted in the last 24 hours" value={stats.postedLast24Hours} />
                <Stat label="Verified employers" value={stats.verifiedEmployers} />
              </div>
            ) : (
              <Text role="body-small">Index counts could not be loaded.</Text>
            )}
            {countedAtLabel(countedAt) && shown ? (
              <Text role="caption" className="mt-3 text-ink-subtle">
                {countedAtLabel(countedAt)}
              </Text>
            ) : null}
          </aside>
        </div>

        <HeroSearch />

        <div className="space-y-4">
          <Text as="h3" role="subheading">
            A listing from the index
          </Text>
          {demo && view ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <ProductJobCard
                  title={demo.title}
                  company={demo.company}
                  location={demo.location}
                  remoteType={view.remoteType}
                  salary={view.salary}
                  match={view.match}
                  freshness={view.freshness}
                  source={view.source}
                  trust={view.trust}
                  applyLabel={view.applyLabel}
                />
                <Text role="caption" className="mt-2 text-ink-muted">
                  Freshness uses the stored posted date. Trust is shown only when
                  the listing is missing a link or a company name.
                </Text>
              </div>
              <div className="space-y-3">
                {score != null ? (
                  <MatchScore
                    score={score}
                    reason={demo.matchLabel}
                    requirements={demo.matchedSkills.map((skill) => ({
                      label: skill,
                      met: true,
                    }))}
                  />
                ) : (
                  <Text role="body-small">
                    No match breakdown is shown. This preview is not scored
                    against a profile.
                  </Text>
                )}
                <Text role="body-small">
                  Salary distribution is omitted. These listings do not include
                  pay unless the posting states it.
                </Text>
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-hairline bg-surface-raised p-5">
              <Text role="body-small" className="text-ink-muted">
                No live listing was available to show on this render. Search
                above still opens the jobs page when the index is reachable.
              </Text>
              <Link
                href="/jobs"
                className="mt-3 inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
              >
                Open the jobs page
              </Link>
            </div>
          )}
          <Link
            href="/sources"
            className="inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
          >
            Where our jobs come from
          </Link>
        </div>
      </div>
    </section>
  )
}
