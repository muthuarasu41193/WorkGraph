import Link from "next/link"
import { cookies } from "next/headers"
import Contact from "@/components/sections/Contact"
import Testimonials from "@/components/sections/Testimonials"
import { HeroSearch } from "@/components/marketing/HeroSearch"
import { PricingTiers } from "@/components/marketing/PricingTiers"
import { ProductJobCard } from "@/components/product/JobCard"
import { MatchScore } from "@/components/product/MatchScore"
import { Text } from "@/components/ui/text"
import { jobCardView, parseMatchPercent } from "@/lib/job-feed"
import { fetchLiveJobsPage, mapJobRowToCard } from "@/lib/jobs-catalog"
import { countedAtLabel } from "@/lib/credibility"
import { getConsentedTestimonials, getIndexStats } from "@/lib/social-proof-server"
import { createServerSupabaseClient } from "@/lib/supabase"
import type { IndexStats } from "@/lib/social-proof-server"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  return (
    <div>
      <Text role="heading">{value.toLocaleString("en-US")}</Text>
      <Text role="caption" className="text-ink-muted">{label}</Text>
    </div>
  )
}

function IndexNumbers({ stats }: { stats: IndexStats }) {
  const shown = [stats.liveJobs, stats.postedLast24Hours, stats.verifiedEmployers].some((value) => value != null)
  if (!shown) return <Text role="body-small">Index counts could not be loaded.</Text>
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Jobs in the index" value={stats.liveJobs} />
      <Stat label="Posted in the last 24 hours" value={stats.postedLast24Hours} />
      <Stat label="Verified employers" value={stats.verifiedEmployers} />
    </div>
  )
}

export default async function HomePage() {
  const [testimonials, stats, demo] = await Promise.all([
    getConsentedTestimonials(),
    getIndexStats(),
    (async () => {
      const page = await fetchLiveJobsPage(createServerSupabaseClient(await cookies()), { page: 1, pageSize: 1 })
      const row = page.rows?.[0]
      return row ? mapJobRowToCard(row, []) : null
    })(),
  ])
  const countedAt = new Date().toISOString()
  const view = demo ? jobCardView(demo) : null
  const score = demo ? parseMatchPercent(demo.matchLabel) : null

  return (
    <main id="main-content">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <Text as="h1" role="display">Search the live index</Text>
          <Text role="body" className="mt-3 max-w-xl text-ink-muted">
            Results come from the jobs index. No account is required to look.
          </Text>
          <div className="mt-4">
            <HeroSearch />
          </div>
        </div>
        <aside className="rounded-card border border-hairline bg-surface-raised p-4">
          <Text as="h2" role="subheading">Index</Text>
          <div className="mt-3">
            <IndexNumbers stats={stats} />
          </div>
          {countedAtLabel(countedAt) && [stats.liveJobs, stats.postedLast24Hours, stats.verifiedEmployers].some((value) => value != null) ? (
            <Text role="caption" className="mt-2 text-ink-subtle">{countedAtLabel(countedAt)}</Text>
          ) : null}
          <Text role="caption" className="mt-3 text-ink-subtle">
            Posted means the listing date we stored. It is not a verification time. Suspected scams removed this month are not shown because that count is not stored.
          </Text>
        </aside>
      </section>

      <section id="features" className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Text as="h2" role="title">A listing from the index</Text>
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
              <Text role="caption" className="mt-2 text-ink-muted">Freshness uses the stored posted date. Trust is shown only when the listing is missing a link or a company name.</Text>
            </div>
            <div className="space-y-3">
              {score != null ? <MatchScore score={score} reason={demo.matchLabel} requirements={demo.matchedSkills.map((skill) => ({ label: skill, met: true }))} /> : (
                <Text role="body-small">No match breakdown is shown. This preview is not scored against a profile.</Text>
              )}
              <Text role="body-small">Salary distribution is omitted. These listings do not include pay.</Text>
            </div>
          </div>
        ) : (
          <Text role="body-small">No live listing was available to show.</Text>
        )}
        <Link href="/sources" className="inline-flex min-h-11 items-center text-accent">Where our jobs come from</Link>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl space-y-3 px-4 py-8">
        <Text as="h2" role="title">How to use it</Text>
        <ol className="space-y-2 text-role-body">
          <li>Search the index. An account is not required.</li>
          <li>Open a role to see where it was posted and whether the date is old.</li>
          <li>Sign in to save a role or log an application.</li>
        </ol>
        <p id="interview-vault">
          <Link href="/interview-vault" className="inline-flex min-h-11 items-center text-accent">Interview vault</Link>
        </p>
      </section>

      <Testimonials items={testimonials} />

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-8">
        <Text as="h2" role="title">Pricing</Text>
        <div className="mt-4">
          <PricingTiers />
        </div>
        <Link href="/pricing" className="mt-4 inline-flex min-h-11 items-center text-accent">Pricing details</Link>
      </section>

      <Contact />
    </main>
  )
}
