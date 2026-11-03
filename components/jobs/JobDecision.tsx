"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FreshnessIndicator } from "@/components/product/FreshnessIndicator"
import { MatchScore, MissingSkillsLine } from "@/components/product/MatchScore"
import { SalaryDisplay } from "@/components/product/SalaryDisplay"
import { SourceAttribution } from "@/components/product/SourceAttribution"
import { TrustIndicator } from "@/components/product/TrustIndicator"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import { jobCardView } from "@/lib/job-feed"
import { AIProvenance } from "@/components/product/AIProvenance"
import { buildJobSummary, jobSummaryLabel, sanitizeJobDescription } from "@/lib/job-summary"
import { toggleSavedJobId } from "@/lib/saved-jobs-storage"
import { cn } from "@/lib/utils"

function subscribeCollapse(onStoreChange: () => void) {
  window.addEventListener("wg-shell-collapse", onStoreChange)
  return () => window.removeEventListener("wg-shell-collapse", onStoreChange)
}

function subscribeSaved(onStoreChange: () => void) {
  window.addEventListener("wg-saved-jobs", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-saved-jobs", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function readIds(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("wg-jobs-ids") ?? "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

export function JobDecision({
  job,
  userId,
  tailorHref = null,
}: {
  job: RecommendedJobCard
  userId: string | null
  tailorHref?: string | null
}) {
  const router = useRouter()
  const collapsed = useSyncExternalStore(subscribeCollapse, () => window.localStorage.getItem("wg-shell-collapsed") === "1", () => false)
  const view = jobCardView(job)
  const summary = buildJobSummary({ description: job.description, company: job.company })
  const storedDescription = sanitizeJobDescription(job.description, job.company)
  const savedRaw = useSyncExternalStore(
    subscribeSaved,
    () => (userId ? window.localStorage.getItem(`wg-saved-catalog-jobs:${userId}`) ?? "" : ""),
    () => "",
  )
  const saved = savedRaw.includes(`"${job.id}"`)
  const idsRaw = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("focus", onStoreChange)
      return () => window.removeEventListener("focus", onStoreChange)
    },
    () => sessionStorage.getItem("wg-jobs-ids") ?? "",
    () => "",
  )
  const ids = idsRaw ? readIds() : []
  const index = ids.indexOf(job.id)
  const previous = index > 0 ? ids[index - 1] : null
  const next = index >= 0 && index < ids.length - 1 ? ids[index + 1] : null
  const [askTrack, setAskTrack] = useState(false)

  function go(id: string | null) {
    if (!id) return
    router.push(`/jobs/${encodeURIComponent(id)}`)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      const id = event.key === "ArrowLeft" || event.key === "k" ? previous : event.key === "ArrowRight" || event.key === "j" ? next : null
      if (!id || event.metaKey || event.ctrlKey) return
      router.push(`/jobs/${encodeURIComponent(id)}`)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, previous, router])

  function save() {
    if (!userId) {
      router.push(`/login?next=/jobs/${encodeURIComponent(job.id)}`)
      return
    }
    toggleSavedJobId(userId, job.id)
    window.dispatchEvent(new Event("wg-saved-jobs"))
  }

  function apply() {
    if (view.stale || !job.applyUrl) return
    window.open(job.applyUrl, "_blank", "noopener,noreferrer")
    setAskTrack(true)
  }

  async function track() {
    if (!userId) {
      router.push(`/login?next=/jobs/${encodeURIComponent(job.id)}`)
      return
    }
    const res = await fetch("/api/applications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: job.company, role: job.title, job_url: job.applyUrl ?? null, status: "applied" }),
    })
    setAskTrack(false)
    if (!res.ok) {
      toast({ title: "Could not add this to your tracker", variant: "error" })
      return
    }
    toast({ title: "Added to your tracker", variant: "success" })
  }

  async function share() {
    const url = `${window.location.origin}/jobs/${encodeURIComponent(job.id)}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: url, variant: "success" })
    } catch {
      toast({ title: "Could not copy the link", variant: "error" })
    }
  }

  const similar = `/jobs?q=${encodeURIComponent(job.title)}`

  return (
    <article className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      {view.stale ? (
        <div className="mb-4 rounded-card border border-caution bg-caution-wash p-3">
          <Text role="body">This posting may be closed. It was posted {job.postedAgo}. Applying is turned off.</Text>
          <Link href={similar} className="mt-2 inline-flex min-h-11 items-center text-role-body-small text-accent">
            Similar live roles
          </Link>
        </div>
      ) : null}
      <header className="space-y-2">
        <Text as="h2" role="heading">{job.title}</Text>
        <Text role="body">{job.company} · Company not verified</Text>
        <SalaryDisplay salary={view.salary} />
        <Text role="body-small" className="text-ink-muted">{job.location} · {view.remoteType}</Text>
        <FreshnessIndicator {...view.freshness} />
        <MatchScore {...view.match} tailorHref={tailorHref} />
        <div className="pt-2">
          {view.stale || !job.applyUrl ? (
            <Button type="button" className="min-h-11" disabled>
              {view.stale ? "Apply unavailable — posting may be closed" : "No apply link is stored"}
            </Button>
          ) : (
            <Button type="button" className="min-h-11" onClick={apply}>{view.applyLabel}</Button>
          )}
        </div>
      </header>

      <section className="mt-8 space-y-2">
        <Text as="h3" role="subheading">Match</Text>
        {job.matchedSkills.length > 0 ? (
          <ul className="space-y-1">
            {job.matchedSkills.map((skill) => (
              <li key={skill} className="text-role-body-small text-positive">Met: {skill}</li>
            ))}
          </ul>
        ) : (
          <Text role="body-small">Not scored against a profile, or none of the profile skills appear in this listing.</Text>
        )}
        <MissingSkillsLine skills={job.missingSkills ?? []} tailorHref={tailorHref} />
        <AIProvenance summary="The match line is an estimate when a profile was compared. It is not a hiring decision." />
        <Link href="/interview-vault" className="inline-flex min-h-11 items-center text-role-body-small text-accent">
          Prepare with the interview vault
        </Link>
      </section>

      <section className="mt-8 space-y-2">
        <Text as="h3" role="subheading">Role text we stored</Text>
        {summary ? (
          <Text role="body-small">
            <span className="font-medium text-ink">{jobSummaryLabel(summary.kind)}. </span>
            {summary.text}
          </Text>
        ) : null}
        {summary?.kind === "ai" ? (
          <AIProvenance label="AI summary" summary="This sentence was generated and stored. It is not the original posting." href="/trust#match" hrefLabel="What generated text means" />
        ) : (
          <Text role="caption" className="text-ink-subtle">This is the listing text from the ingest, not a generated summary.</Text>
        )}
        <Text role="body" className="whitespace-pre-wrap">{storedDescription || "No description is stored for this listing."}</Text>
        {job.applyUrl ? (
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-role-body text-accent">
            Read the full original posting
          </a>
        ) : (
          <Text role="body-small">No original posting URL is stored.</Text>
        )}
      </section>

      <section className="mt-8 space-y-2">
        <Text as="h3" role="subheading">Company</Text>
        <Text role="body-small">Company size, industry, and interview guides are not stored for this employer.</Text>
        <Link href={`/jobs?company=${encodeURIComponent(job.company)}`} className="inline-flex min-h-11 items-center text-role-body-small text-accent">
          Other open roles at {job.company}
        </Link>
      </section>

      <section className="mt-8 space-y-2">
        <Text as="h3" role="subheading">Pay</Text>
        <Text role="body-small">Salary is not on this listing, and there is no market comparison to show.</Text>
      </section>

      <section className="mt-8 space-y-2">
        <Text as="h3" role="subheading">Source</Text>
        <SourceAttribution {...view.source} attribution="Shown because the listing is in the public jobs index we ingest." />
        <TrustIndicator tone="clear" reason={`Last posted date we have: ${job.postedAgo}. A separate verification time is not stored.`} />
        {view.trust ? <TrustIndicator {...view.trust} /> : null}
      </section>

      <nav className="mt-8 flex gap-2" aria-label="Results">
        <Button type="button" variant="outline" className="min-h-11" disabled={!previous} onClick={() => go(previous)}>Previous</Button>
        <Button type="button" variant="outline" className="min-h-11" disabled={!next} onClick={() => go(next)}>Next</Button>
      </nav>

      <div className={cn("fixed inset-x-0 bottom-16 z-sticky flex items-center gap-2 border-t border-hairline bg-surface-raised px-3 py-2 md:bottom-0", collapsed ? "md:left-16" : "md:left-56")}>
        {view.stale || !job.applyUrl ? (
          <Button type="button" className="min-h-11" disabled>Apply unavailable</Button>
        ) : (
          <Button type="button" className="min-h-11" onClick={apply}>{view.applyLabel}</Button>
        )}
        <Button type="button" variant="outline" className="min-h-11" onClick={save}>{saved ? "Saved" : "Save"}</Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => void share()}>Share</Button>
      </div>

      {askTrack ? (
        <div className="fixed bottom-36 left-3 right-3 z-toast flex flex-wrap items-center gap-2 rounded-card border border-hairline bg-surface-raised p-3 shadow-overlay md:left-auto md:right-4 md:max-w-md" role="status">
          <Text role="body-small">Add {job.title} at {job.company} to your tracker?</Text>
          <Button type="button" className="min-h-11" onClick={() => void track()}>Add</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setAskTrack(false)}>Not now</Button>
        </div>
      ) : null}
    </article>
  )
}
