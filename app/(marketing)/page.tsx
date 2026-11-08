import Link from "next/link"
import { cookies } from "next/headers"
import Contact from "@/components/sections/Contact"
import Testimonials from "@/components/sections/Testimonials"
import { HowItWorksLanding } from "@/components/marketing/HowItWorksLanding"
import { LandingCtaBand } from "@/components/marketing/LandingCtaBand"
import { LandingHero } from "@/components/marketing/LandingHero"
import { LaunchNews } from "@/components/marketing/LaunchNews"
import { LiveIndexSection } from "@/components/marketing/LiveIndexSection"
import { WhatWeDeliver } from "@/components/marketing/WhatWeDeliver"
import { PricingTiers } from "@/components/marketing/PricingTiers"
import { Text } from "@/components/ui/text"
import { accountDataRights } from "@/lib/account/privacy-copy"
import { getSessionUser } from "@/lib/auth/session-server"
import { fetchLiveJobsPage, mapJobRowToCard } from "@/lib/jobs-catalog"
import { getConsentedTestimonials, getIndexStats } from "@/lib/social-proof-server"
import { createServerSupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [raw, testimonials, stats, session, demo] = await Promise.all([
    searchParams,
    getConsentedTestimonials(),
    getIndexStats(),
    getSessionUser(),
    (async () => {
      const page = await fetchLiveJobsPage(createServerSupabaseClient(await cookies()), {
        page: 1,
        pageSize: 1,
      })
      const row = page.rows?.[0]
      return row ? mapJobRowToCard(row, []) : null
    })(),
  ])
  const accountDeleted = raw.accountDeleted === "1"
  const countedAt = new Date().toISOString()

  return (
    <main id="main-content" tabIndex={-1}>
      {accountDeleted ? (
        <section className="mx-auto max-w-6xl px-4 pt-6" role="status">
          <div className="rounded-card border border-hairline bg-surface-raised p-4">
            <Text role="body">{accountDataRights().deletedBanner}</Text>
          </div>
        </section>
      ) : null}

      <LandingHero />
      <LaunchNews />
      <WhatWeDeliver />
      <LiveIndexSection stats={stats} demo={demo} countedAt={countedAt} />
      <HowItWorksLanding />

      <Testimonials items={testimonials} />

      <section id="pricing" className="border-b border-hairline">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Text as="h2" role="title">
            Pricing
          </Text>
          <Text role="body" className="max-w-xl text-ink-muted">
            Free search stays available. Paid tiers are listed only when they can
            be bought here.
          </Text>
          <div className="mt-4">
            <PricingTiers signedIn={Boolean(session)} />
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
          >
            Pricing details
          </Link>
        </div>
      </section>

      <LandingCtaBand />
      <Contact />
    </main>
  )
}
