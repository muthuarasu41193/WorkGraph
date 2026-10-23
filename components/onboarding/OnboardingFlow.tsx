"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AIProvenance } from "@/components/product/AIProvenance"
import { ProductJobCard } from "@/components/product/JobCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Text } from "@/components/ui/text"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import { jobCardView } from "@/lib/job-feed"
import { messages } from "@/lib/messages"
import {
  ONBOARDING_KEY,
  onboardingSteps,
  parseOnboardingDraft,
  subscribeOnboarding,
  writeOnboardingDraft,
  type ExtractedDraft,
  type OnboardingDraft,
} from "@/lib/onboarding-draft"

const STEP_LABEL = ["See jobs", "Resume", "Review extraction", "Target role", "Location", "Constraints"]

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const id = `onboarding-${label.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <label className="block" htmlFor={id}>
      <span className="text-role-caption text-ink-muted">{label} · Extracted</span>
      <Input id={id} className="mt-1 min-h-11" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} />
      <span className="block min-h-5 text-role-caption text-danger" />
    </label>
  )
}

export function OnboardingFlow({ userId }: { userId: string | null }) {
  const router = useRouter()
  const raw = useSyncExternalStore(subscribeOnboarding, () => localStorage.getItem(ONBOARDING_KEY) ?? "", () => "")
  const draft = parseOnboardingDraft(raw)
  const steps = onboardingSteps(draft)
  const position = Math.max(0, steps.indexOf(draft.step))
  const [query, setQuery] = useState(draft.role)
  const [jobs, setJobs] = useState<RecommendedJobCard[] | null>(null)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"idle" | "uploading" | "reading" | "done" | "error">("idle")
  const [phaseError, setPhaseError] = useState<string | null>(null)
  const [roleNote, setRoleNote] = useState("")
  const searchTimer = useRef<number | null>(null)

  function update(partial: Partial<OnboardingDraft>) {
    writeOnboardingDraft({ ...draft, ...partial })
  }

  function go(step: number) {
    update({ step })
  }

  function search(value: string) {
    setQuery(value)
    update({ role: value })
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => void runSearch(value), 180)
  }

  async function runSearch(value: string) {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setJobs(null)
      return
    }
    const res = await fetch(`/api/jobs?q=${encodeURIComponent(trimmed)}&page_size=3&rank_profile=0&signals=0`)
    const data = (await res.json()) as { ok?: boolean; jobs?: RecommendedJobCard[] }
    if (!res.ok || !data.ok) {
      setJobsError(messages.onboardingJobsFailed)
      setJobs([])
      return
    }
    setJobsError(null)
    setJobs(data.jobs ?? [])
  }

  async function extract(file: File) {
    if (!userId) {
      setPhase("error")
      setPhaseError("Sign in to extract a resume. Search stays available without an account.")
      return
    }
    setPhase("uploading")
    setPhaseError(null)
    const timer = window.setTimeout(() => setPhase("reading"), 400)
    const body = new FormData()
    body.set("file", file)
    const res = await fetch("/api/parse-resume", { method: "POST", body, credentials: "include" })
    window.clearTimeout(timer)
    const data = (await res.json()) as { success?: boolean; profile?: Record<string, unknown>; error?: string }
    if (!res.ok || !data.success || !data.profile) {
      setPhase("error")
      setPhaseError(typeof data.error === "string" ? data.error : "Could not read that file.")
      return
    }
    const profile = data.profile
    const extracted: ExtractedDraft = {
      full_name: String(profile.full_name ?? ""),
      headline: String(profile.headline ?? ""),
      summary: String(profile.summary ?? ""),
      skills: Array.isArray(profile.skills) ? profile.skills.filter((item) => typeof item === "string").join(", ") : "",
      location: String(profile.location ?? ""),
    }
    setPhase("done")
    writeOnboardingDraft({ ...draft, extracted, step: 2, location: extracted.location || draft.location })
  }

  function finish() {
    const params = new URLSearchParams()
    if (draft.role.trim()) params.set("q", draft.role.trim())
    if (draft.location.trim()) params.set("loc", draft.location.trim())
    if (draft.remote) params.set("locMode", draft.remote)
    const value = params.toString()
    router.push(value ? `/jobs?${value}` : "/jobs")
  }

  const missing = [
    !draft.extracted ? messages.onboardingResumeGap : null,
    !draft.role.trim() ? messages.onboardingRoleGap : null,
    !draft.location.trim() ? messages.onboardingLocationGap : null,
    !draft.authorization.trim() ? "Add work authorization to keep it with this draft when you apply." : null,
    !draft.salary.trim() ? "Add a salary note for yourself. Listings here do not include pay, and there is no market figure to prefill." : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <Text role="caption" className="text-ink-muted">
          Step {position + 1} of {steps.length}: {STEP_LABEL[draft.step] ?? "Onboarding"}
        </Text>
        <Text role="caption" className="text-ink-subtle">{messages.onboardingSaved}</Text>
        <div className="mt-2 h-1 bg-surface-sunken" aria-hidden>
          <div className="h-1 bg-accent" style={{ width: `${((position + 1) / steps.length) * 100}%` }} />
        </div>

        {draft.step === 0 ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Search before you sign up</Text>
            <Text role="body-small" className="text-ink-muted">Looking is open. Saving, tracking, and resume extraction need an account.</Text>
            <Input className="min-h-11" aria-label="Role to search" value={query} placeholder="Role or skill" onChange={(event) => search(event.target.value)} />
            {jobsError ? <Text role="caption" className="text-danger">{jobsError}</Text> : null}
            {jobs && jobs.length === 0 ? <Text role="body-small">No roles matched that search.</Text> : null}
            <div className="space-y-3">
              {(jobs ?? []).map((job) => {
                const view = jobCardView(job)
                return (
                  <ProductJobCard
                    key={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    remoteType={view.remoteType}
                    salary={view.salary}
                    match={view.match}
                    freshness={view.freshness}
                    source={view.source}
                    applyLabel="Open"
                    onApply={() => router.push(`/jobs/${encodeURIComponent(job.id)}`)}
                    onSave={() => router.push("/login?next=/onboarding")}
                    onDismiss={() => router.push(`/jobs?q=${encodeURIComponent(query)}`)}
                  />
                )
              })}
            </div>
          </section>
        ) : null}

        {draft.step === 1 ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Resume</Text>
            <Text role="body-small">Drop a PDF resume, or a LinkedIn profile PDF from LinkedIn’s export. You can also skip and fill a profile by hand.</Text>
            <div
              className="rounded-card border border-dashed border-hairline bg-surface-raised p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const file = event.dataTransfer.files[0]
                if (file) void extract(file)
              }}
            >
              <input
                className="block min-h-11 w-full text-role-body-small"
                type="file"
                accept="application/pdf,.pdf,.doc,.docx,.txt"
                aria-label="Resume file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void extract(file)
                }}
              />
            </div>
            {phase === "uploading" ? <Text role="body-small">Uploading the file.</Text> : null}
            {phase === "reading" ? <Text role="body-small">Reading the file. This is separate from the upload.</Text> : null}
            {phase === "error" && phaseError ? <Text role="body-small" className="text-danger">{phaseError}</Text> : null}
            {userId ? (
              <Text role="caption" className="text-ink-muted">
                Extract and review sends the file to the existing parser. That parser also saves the parsed profile. Nothing is accepted until you see the review step.
              </Text>
            ) : (
              <Text role="body-small">Sign in to extract a resume. Search stays available without an account.</Text>
            )}
            <div className="flex flex-wrap gap-2">
              {userId ? null : (
                <Button type="button" variant="outline" className="min-h-11" onClick={() => router.push("/login?next=/onboarding")}>Sign in</Button>
              )}
              <Link href="/create-profile" className="inline-flex min-h-11 items-center rounded-control border border-hairline px-3 text-role-body-small">Fill a profile manually</Link>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => go(3)}>Skip for now</Button>
            </div>
          </section>
        ) : null}

        {draft.step === 2 && draft.extracted ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Review what was extracted</Text>
            <Text role="body-small">Every value below was extracted. Edits stay on this device. The original extraction was already written to your profile by the parser. Open your profile if you want those edits saved there.</Text>
            <AIProvenance label="Extracted" summary="A parser filled these fields. They are not facts until you review them." href="/trust#match" hrefLabel="How extracted text is marked" />
            <Field label="Name" autoComplete="name" value={draft.extracted.full_name} onChange={(full_name) => update({ extracted: { ...draft.extracted!, full_name } })} />
            <Field label="Headline" value={draft.extracted.headline} onChange={(headline) => update({ extracted: { ...draft.extracted!, headline } })} />
            <Field label="Summary" value={draft.extracted.summary} onChange={(summary) => update({ extracted: { ...draft.extracted!, summary } })} />
            <Field label="Skills" value={draft.extracted.skills} onChange={(skills) => update({ extracted: { ...draft.extracted!, skills } })} />
            <Field label="Location" value={draft.extracted.location} onChange={(location) => update({ extracted: { ...draft.extracted!, location }, location })} />
            <Link href="/profile" className="inline-flex min-h-11 items-center text-role-body-small text-accent">Open profile to save edits on the server</Link>
          </section>
        ) : null}

        {draft.step === 3 ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Target role</Text>
            <Text role="body-small">This becomes the search that opens when you finish.</Text>
            <Input
              className="min-h-11"
              aria-label="Target role"
              autoComplete="organization-title"
              aria-describedby="onboarding-role-error"
              value={draft.role}
              onChange={(event) => update({ role: event.target.value })}
              onBlur={(event) => setRoleNote(event.currentTarget.value.trim() ? "" : messages.onboardingRoleMissing)}
            />
            <p id="onboarding-role-error" className="min-h-5 text-role-caption text-danger">{roleNote}</p>
          </section>
        ) : null}

        {draft.step === 4 ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Location and remote preference</Text>
            <Input className="min-h-11" aria-label="Location" autoComplete="address-level2" value={draft.location} onChange={(event) => update({ location: event.target.value })} />
            <div className="flex flex-wrap gap-2">
              {(["remote", "hybrid", "onsite"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`min-h-11 rounded-control border px-3 text-role-body-small ${draft.remote === mode ? "border-accent bg-accent-wash text-accent" : "border-hairline"}`}
                  onClick={() => update({ remote: draft.remote === mode ? "" : mode })}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {draft.step === 5 ? (
          <section className="mt-4 space-y-3">
            <Text as="h2" role="heading">Optional constraints</Text>
            <label className="block text-role-caption text-ink-muted">
              Work authorization
              <Input className="mt-1 min-h-11" value={draft.authorization} onChange={(event) => update({ authorization: event.target.value })} />
            </label>
            <label className="block text-role-caption text-ink-muted">
              Salary expectation
              <Input className="mt-1 min-h-11" inputMode="decimal" autoComplete="off" value={draft.salary} onChange={(event) => update({ salary: event.target.value })} placeholder="Not prefilled — no market data is available" />
            </label>
            <label className="block text-role-caption text-ink-muted">
              Deal-breakers
              <Textarea className="mt-1" value={draft.dealBreakers} onChange={(event) => update({ dealBreakers: event.target.value })} />
            </label>
            <Text role="caption" className="text-ink-subtle">These three stay in this draft on this device. They are not written to your profile from here.</Text>
          </section>
        ) : null}

        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" className="min-h-11" disabled={position === 0} onClick={() => go(steps[position - 1] ?? 0)}>Back</Button>
          {draft.step === 5 ? (
            <Button type="button" className="min-h-11" onClick={finish}>See matching jobs</Button>
          ) : (
            <Button type="button" className="min-h-11" onClick={() => go(steps[position + 1] ?? 5)}>Continue</Button>
          )}
        </div>
      </div>
      <aside className="h-fit rounded-card border border-hairline bg-surface-raised p-3">
        <Text as="h2" role="subheading">What would improve matching</Text>
        {missing.length === 0 ? <Text role="body-small" className="mt-2">The draft has the items this flow can use.</Text> : (
          <ul className="mt-2 space-y-2">
            {missing.map((item) => (
              <li key={item} className="text-role-body-small text-ink">{item}</li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  )
}
