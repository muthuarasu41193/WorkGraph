"use client"

import type { ReactNode } from "react"
import JobCard from "@/components/design-system/JobCard"
import { ProductJobCard } from "@/components/product/JobCard"
import { FreshnessIndicator } from "@/components/product/FreshnessIndicator"
import { MatchScore } from "@/components/product/MatchScore"
import { SalaryDisplay } from "@/components/product/SalaryDisplay"
import { SourceAttribution } from "@/components/product/SourceAttribution"
import { TrustIndicator } from "@/components/product/TrustIndicator"
import type { JobCardData } from "@/lib/job-card-data"

const JOB = {
  title: "Operations editor, climate desk",
  company: "Harbor Ledger",
  location: "Lagos",
  remoteType: "Remote",
  description:
    "Edit the daily briefing, check the source on every figure, and keep the desk calm when the wire is loud.",
  match: {
    score: 72,
    reason: "4 of 6 requirements met",
    requirements: [
      { label: "Editing", met: true },
      { label: "SQL", met: false },
    ],
  },
  freshness: { status: "verified" as const, label: "Verified live 2 hours ago" },
  source: {
    source: "Greenhouse",
    href: "https://boards.greenhouse.io",
    attribution: "Listing data via Greenhouse.",
  },
  salary: { kind: "range" as const, min: 84000, max: 102000, currency: "USD", period: "per year" },
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-hairline py-4">
      <h3 className="text-role-subheading text-ink">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  )
}

const RECOMMENDED: JobCardData = {
  id: "rec-1",
  title: "Senior backend engineer",
  company: "Northwind",
  location: "Bengaluru",
  workMode: "On-site",
  employmentType: "Full-time",
  experience: "Senior",
  matchPercent: 82,
  matchedSkills: ["TypeScript", "Postgres", "Redis", "Kafka", "AWS", "Go"],
  profileSkillCount: 9,
  postedAgo: "2d ago",
  salaryRange: "₹18–24L",
  applyUrl: "https://www.linkedin.com/jobs/view/1",
  source: "linkedin",
}

const RECOMMENDED_MINIMAL: JobCardData = {
  id: "rec-2",
  title: "Support engineer",
  company: "Cool Apps",
  location: "India",
  workMode: "Remote",
  matchPercent: 0,
  matchedSkills: [],
  profileSkillCount: 9,
  postedAgo: "Today",
  applyUrl: "https://boards.greenhouse.io/example/jobs/1",
  source: "greenhouse",
}

function Specimens() {
  return (
    <div>
      <Block title="Recommended JobCard">
        <JobCard job={RECOMMENDED} onSave={() => undefined} onClick={() => undefined} />
        <JobCard job={RECOMMENDED_MINIMAL} onSave={() => undefined} />
      </Block>
      <Block title="JobCard">
        <ProductJobCard {...JOB} applyLabel="Apply on Greenhouse" onSave={() => undefined} onDismiss={() => undefined} onApply={() => undefined} />
        <ProductJobCard
          {...JOB}
          applyLabel="Apply on Greenhouse"
          expanded
          saved
          trust={{ tone: "caution", reason: "No company domain listed" }}
          onSave={() => undefined}
          onDismiss={() => undefined}
          onApply={() => undefined}
        />
        <ProductJobCard {...JOB} applyLabel="Apply on Greenhouse" loading />
        <ProductJobCard {...JOB} applyLabel="Apply on Greenhouse" error="This listing could not be refreshed." disabled />
      </Block>
      <Block title="MatchScore">
        <MatchScore {...JOB.match} />
        <MatchScore {...JOB.match} defaultExpanded />
        <MatchScore score={0} reason="" loading />
        <MatchScore score={0} reason="" error="Match could not be scored." />
      </Block>
      <Block title="TrustIndicator">
        <TrustIndicator tone="positive" reason="Company domain matches the application link" />
        <TrustIndicator tone="caution" reason="Asks for upfront payment" />
        <TrustIndicator tone="clear" reason="Source named, no extra risk flagged" />
        <TrustIndicator tone="clear" reason="" loading />
        <TrustIndicator tone="clear" reason="" error="Trust check failed." />
      </Block>
      <Block title="FreshnessIndicator">
        <FreshnessIndicator status="verified" label="Verified live 2 hours ago" />
        <FreshnessIndicator status="stale" label="Posted 89 days ago — may no longer be open" />
        <FreshnessIndicator status="unknown" label="Posted date not provided" />
        <FreshnessIndicator status="unknown" label="" loading />
        <FreshnessIndicator status="unknown" label="" error="Could not check whether this role is still open." />
      </Block>
      <Block title="SalaryDisplay">
        <SalaryDisplay salary={JOB.salary} />
        <SalaryDisplay salary={{ kind: "single", amount: 64, currency: "USD", period: "per hour" }} />
        <SalaryDisplay salary={{ kind: "undisclosed" }} />
        <SalaryDisplay
          salary={{
            kind: "converted",
            amount: 92000,
            currency: "USD",
            convertedFrom: "GBP",
            rateDate: "23 Oct 2026",
            originalLabel: "£72,000",
          }}
        />
        <SalaryDisplay salary={{ kind: "undisclosed" }} loading />
        <SalaryDisplay salary={{ kind: "undisclosed" }} error="Salary could not be read." />
      </Block>
      <Block title="SourceAttribution">
        <SourceAttribution {...JOB.source} />
        <SourceAttribution source="Lever" href="https://jobs.lever.co" loading />
        <SourceAttribution source="Lever" href="https://jobs.lever.co" error="Source link unavailable." />
      </Block>
    </div>
  )
}

export function ProductGallery() {
  const frames = [
    { theme: "light" as const, width: 375, label: "Light, mobile" },
    { theme: "light" as const, width: 1280, label: "Light, desktop" },
    { theme: "dark" as const, width: 375, label: "Dark, mobile" },
    { theme: "dark" as const, width: 1280, label: "Dark, desktop" },
  ]
  return (
    <div className="space-y-8 bg-surface p-4 text-ink">
      <header className="measure">
        <h2 className="text-role-title">Product composites</h2>
        <p className="text-role-body text-ink-muted">
          Recommended JobCard is the live feed row (home matches and Jobs tab). Product JobCard below is the marketing/onboarding specimen.
        </p>
      </header>
      {frames.map((frame) => (
        <section key={frame.label} className="space-y-2" aria-label={`Product ${frame.label}`}>
          <h3 className="text-role-heading">{frame.label}</h3>
          <div
            data-theme={frame.theme}
            className="overflow-x-auto border border-hairline bg-surface p-3 text-ink dark:bg-surface"
            style={{ width: frame.width, maxWidth: "100%" }}
          >
            <div className={frame.theme === "dark" ? "dark" : undefined}>
              <Specimens />
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
