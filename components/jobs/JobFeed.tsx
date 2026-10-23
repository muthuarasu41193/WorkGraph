"use client"

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { ProductJobCard } from "@/components/product/JobCard"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import {
  FEED_JOB_TYPES,
  FEED_SOURCES,
  JOB_FEED_PAGE_SIZE,
  jobCardView,
  parseFeedSort,
  sortFeedJobs,
  type FeedSort,
} from "@/lib/job-feed"
import { dismissedSnapshot, readDismissedJobs, subscribeDismissedJobs, writeDismissedJobs } from "@/lib/dismissed-jobs"
import { readSavedSearches, writeSavedSearches } from "@/lib/saved-searches"
import { toggleSavedJobId } from "@/lib/saved-jobs-storage"
import { formatJobSource } from "@/lib/job-card-data"
import { cn } from "@/lib/utils"

const ROW_HEIGHT = 300
const UNDO_MS = 5000

export type AppliedRef = { company: string; role: string; job_url: string | null }

export type JobFeedInitial = {
  jobs: RecommendedJobCard[]
  total: number
  hasMore: boolean
  error: string | null
  relaxedQuery: string | null
  originalQuery: string | null
}

type Chip = {
  id: string
  label: string
  active: boolean
  params: (current: URLSearchParams) => URLSearchParams
}

function currentParams(): URLSearchParams {
  return new URLSearchParams(typeof window === "undefined" ? "" : window.location.search)
}

function subscribeWide(onStoreChange: () => void) {
  const media = window.matchMedia("(min-width: 1280px)")
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function wideSnapshot() {
  return window.matchMedia("(min-width: 1280px)").matches
}

function subscribeRail(onStoreChange: () => void) {
  window.addEventListener("wg-jobs-rail", onStoreChange)
  return () => window.removeEventListener("wg-jobs-rail", onStoreChange)
}

function railSnapshot() {
  return window.localStorage.getItem("wg-jobs-rail") === "closed"
}

function subscribeSaved(onStoreChange: () => void) {
  window.addEventListener("wg-saved-jobs", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-saved-jobs", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function isApplied(job: RecommendedJobCard, applications: AppliedRef[]): boolean {
  const company = job.company.trim().toLowerCase()
  const title = job.title.trim().toLowerCase()
  return applications.some((row) => {
    if (job.applyUrl && row.job_url && row.job_url === job.applyUrl) return true
    return row.company.trim().toLowerCase() === company && row.role.trim().toLowerCase() === title
  })
}

async function previewTotal(params: URLSearchParams, skills: string[], sort: FeedSort): Promise<number | null> {
  const qs = new URLSearchParams(params)
  qs.set("page", "1")
  qs.set("page_size", "1")
  qs.set("signals", "0")
  if (sort === "match" && skills.length > 0) qs.set("profile_skills", skills.join(","))
  else qs.set("rank_profile", "0")
  const res = await fetch(`/api/jobs?${qs}`)
  if (!res.ok) return null
  const data = (await res.json()) as { total?: number }
  return typeof data.total === "number" ? data.total : null
}

function idsFromStorage(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((item): item is string => typeof item === "string"))
  } catch {
    return new Set()
  }
}

function dismissedIdsFromStorage(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw || "[]") as { id?: string }[]
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((item) => item.id).filter((id): id is string => typeof id === "string"))
  } catch {
    return new Set()
  }
}

export function JobFeed({
  initial,
  userId,
  applications,
  skills,
  search,
}: {
  initial: JobFeedInitial
  userId: string | null
  applications: AppliedRef[]
  skills: string[]
  search: string
}) {
  const router = useRouter()
  const wide = useSyncExternalStore(subscribeWide, wideSnapshot, () => false)
  const railClosed = useSyncExternalStore(subscribeRail, railSnapshot, () => false)
  const savedRaw = useSyncExternalStore(
    subscribeSaved,
    () => (userId ? window.localStorage.getItem(`wg-saved-catalog-jobs:${userId}`) ?? "" : ""),
    () => "",
  )
  const dismissedRaw = useSyncExternalStore(subscribeDismissedJobs, dismissedSnapshot, () => "")
  const savedIds = useMemo(() => idsFromStorage(savedRaw), [savedRaw])
  const dismissedIds = useMemo(() => dismissedIdsFromStorage(dismissedRaw), [dismissedRaw])
  const params = useMemo(() => new URLSearchParams(search), [search])
  const sort = parseFeedSort(params.get("sort") ?? undefined)
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [extra, setExtra] = useState<RecommendedJobCard[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initial.hasMore)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [emptyMark, setEmptyMark] = useState<Record<string, number>>({})
  const [focus, setFocus] = useState(0)
  const [preview, setPreview] = useState<RecommendedJobCard | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [naming, setNaming] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [pendingDismiss, setPendingDismiss] = useState<Record<string, string>>({})
  const [trackJob, setTrackJob] = useState<RecommendedJobCard | null>(null)
  const [trackedUrls, setTrackedUrls] = useState<string[]>([])
  const timer = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(640)

  const jobs = useMemo(() => {
    const seen = new Set<string>()
    const merged = [...initial.jobs, ...extra].filter((job) => {
      if (seen.has(job.id) || dismissedIds.has(job.id)) return false
      seen.add(job.id)
      return true
    })
    return sortFeedJobs(merged, sort === "salary" || sort === "verified" ? "newest" : sort)
  }, [initial.jobs, extra, dismissedIds, sort])

  const rows = jobs.map((job) => ({ job, pending: Object.prototype.hasOwnProperty.call(pendingDismiss, job.id) }))

  useLayoutEffect(() => {
    if (sessionStorage.getItem("wg-jobs-restore") !== "1") return
    sessionStorage.removeItem("wg-jobs-restore")
    const top = Number(sessionStorage.getItem("wg-jobs-scroll") ?? "")
    if (listRef.current && Number.isFinite(top)) listRef.current.scrollTop = top
  }, [])

  function rememberList(nextJobs: RecommendedJobCard[]) {
    sessionStorage.setItem("wg-jobs-ids", JSON.stringify(nextJobs.map((job) => job.id)))
    sessionStorage.setItem("wg-jobs-scroll", String(listRef.current?.scrollTop ?? 0))
    sessionStorage.setItem("wg-jobs-restore", "1")
  }

  function pushParams(next: URLSearchParams) {
    const value = next.toString()
    router.replace(value ? `/jobs?${value}` : "/jobs", { scroll: false })
  }

  async function applyParams(id: string, build: (current: URLSearchParams) => URLSearchParams, active: boolean) {
    const next = build(currentParams())
    if (!active) {
      const total = await previewTotal(next, skills, sort)
      if (total === 0) {
        setEmptyMark((marks) => ({ ...marks, [id]: 0 }))
        return
      }
    }
    setEmptyMark((marks) => {
      const copy = { ...marks }
      delete copy[id]
      return copy
    })
    pushParams(next)
  }

  function onQueryChange(value: string) {
    setQuery(value)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const next = currentParams()
      const trimmed = value.trim()
      if (trimmed) next.set("q", trimmed)
      else next.delete("q")
      pushParams(next)
    }, 180)
  }

  const chips: Chip[] = [
    { id: "remote", label: "Remote", active: params.get("locMode") === "remote", params: (p) => { const n = new URLSearchParams(p); if (n.get("locMode") === "remote") n.delete("locMode"); else n.set("locMode", "remote"); return n } },
    { id: "hybrid", label: "Hybrid", active: params.get("locMode") === "hybrid", params: (p) => { const n = new URLSearchParams(p); if (n.get("locMode") === "hybrid") n.delete("locMode"); else n.set("locMode", "hybrid"); return n } },
    { id: "onsite", label: "On-site", active: params.get("locMode") === "onsite", params: (p) => { const n = new URLSearchParams(p); if (n.get("locMode") === "onsite") n.delete("locMode"); else n.set("locMode", "onsite"); return n } },
    { id: "today", label: "Posted today", active: params.get("date") === "1", params: (p) => { const n = new URLSearchParams(p); if (n.get("date") === "1") n.delete("date"); else n.set("date", "1"); return n } },
    { id: "week", label: "Past 7 days", active: params.get("date") === "7", params: (p) => { const n = new URLSearchParams(p); if (n.get("date") === "7") n.delete("date"); else n.set("date", "7"); return n } },
    { id: "month", label: "Past 30 days", active: params.get("date") === "30", params: (p) => { const n = new URLSearchParams(p); if (n.get("date") === "30") n.delete("date"); else n.set("date", "30"); return n } },
  ]

  const appliedChips = [
    params.get("q") ? { id: "q", label: `Search: ${params.get("q")}` } : null,
    params.get("locMode") ? { id: "locMode", label: params.get("locMode") } : null,
    params.get("date") ? { id: "date", label: `Posted window: ${params.get("date")}d` } : null,
    params.get("loc") ? { id: "loc", label: params.get("loc") } : null,
    params.get("company") ? { id: "company", label: params.get("company") } : null,
    params.get("type") ? { id: "type", label: params.get("type") } : null,
    ...(params.get("src") ?? "").split(",").filter(Boolean).map((source) => ({ id: `src:${source}`, label: formatJobSource(source as RecommendedJobCard["source"]) })),
  ].filter((chip): chip is { id: string; label: string | null } => Boolean(chip && chip.label))

  function clearChip(id: string) {
    const next = currentParams()
    if (id.startsWith("src:")) {
      const source = id.slice(4)
      const sources = (next.get("src") ?? "").split(",").filter((item) => item && item !== source)
      if (sources.length) next.set("src", sources.join(","))
      else next.delete("src")
    } else next.delete(id)
    pushParams(next)
  }

  function clearAll() {
    const next = currentParams()
    for (const key of ["q", "src", "date", "locMode", "loc", "company", "type"]) next.delete(key)
    setQuery("")
    pushParams(next)
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadError(null)
    const qs = currentParams()
    qs.set("page", String(page + 1))
    qs.set("page_size", String(JOB_FEED_PAGE_SIZE))
    qs.set("signals", "0")
    if (sort === "match" && skills.length > 0) qs.set("profile_skills", skills.join(","))
    else qs.set("rank_profile", "0")
    const res = await fetch(`/api/jobs?${qs}`)
    const data = (await res.json()) as { ok?: boolean; jobs?: RecommendedJobCard[]; has_more?: boolean }
    setLoadingMore(false)
    if (!res.ok || !data.ok || !data.jobs) {
      setLoadError("Could not load more roles. The list above is unchanged.")
      return
    }
    setExtra((current) => [...current, ...data.jobs!])
    setPage((current) => current + 1)
    setHasMore(Boolean(data.has_more))
  }

  function toggleSave(job: RecommendedJobCard) {
    if (!userId) {
      router.push("/login?next=/jobs")
      return
    }
    toggleSavedJobId(userId, job.id)
    window.dispatchEvent(new Event("wg-saved-jobs"))
  }

  function dismiss(job: RecommendedJobCard) {
    setPendingDismiss((current) => ({ ...current, [job.id]: current[job.id] ?? "" }))
    window.setTimeout(() => {
      let reason = ""
      let stillPending = false
      setPendingDismiss((current) => {
        if (!Object.prototype.hasOwnProperty.call(current, job.id)) return current
        stillPending = true
        reason = current[job.id] ?? ""
        const next = { ...current }
        delete next[job.id]
        return next
      })
      window.setTimeout(() => {
        if (!stillPending) return
        writeDismissedJobs([...readDismissedJobs().filter((item) => item.id !== job.id), { id: job.id, reason: reason.trim() || undefined }])
      }, 0)
    }, UNDO_MS)
  }

  function undo(id: string) {
    setPendingDismiss((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, id)) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function openJob(job: RecommendedJobCard) {
    rememberList(jobs)
    if (wide) setPreview(job)
    else router.push(`/jobs/${encodeURIComponent(job.id)}`)
  }

  function apply(job: RecommendedJobCard) {
    const view = jobCardView(job)
    if (view.stale || !job.applyUrl) {
      toast({
        title: view.stale ? "This posting may be closed" : "No apply link is stored",
        description: "Open the role for similar live listings.",
      })
      openJob(job)
      return
    }
    window.open(job.applyUrl, "_blank", "noopener,noreferrer")
    setTrackJob(job)
  }

  async function addToTracker(job: RecommendedJobCard) {
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
    if (!res.ok) {
      toast({ title: "Could not add this to your tracker", variant: "error" })
      return
    }
    if (job.applyUrl) setTrackedUrls((urls) => [...urls, job.applyUrl!])
    setTrackJob(null)
    toast({ title: "Added to your tracker", variant: "success" })
  }

  function onListKey(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
    const job = rows[focus]?.job
    if (event.key === "j") {
      event.preventDefault()
      setFocus((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)))
    } else if (event.key === "k") {
      event.preventDefault()
      setFocus((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter" && job) {
      event.preventDefault()
      openJob(job)
    } else if (event.key === "s" && job) {
      event.preventDefault()
      toggleSave(job)
    } else if (event.key === "x" && job) {
      event.preventDefault()
      dismiss(job)
    }
  }

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2)
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + 3)
  const visible = rows.slice(start, end)

  const filterBody = (
    <div className="space-y-4">
      <label className="block text-role-caption text-ink-muted">
        Location{emptyMark.loc === 0 ? " · 0" : ""}
        <Input className="mt-1 min-h-11" defaultValue={params.get("loc") ?? ""} name="loc" onBlur={(event) => {
          const next = currentParams()
          const value = event.target.value.trim()
          if (value) next.set("loc", value)
          else next.delete("loc")
          void applyParams("loc", () => next, !value)
        }} />
      </label>
      <label className="block text-role-caption text-ink-muted">
        Company{emptyMark.company === 0 ? " · 0" : ""}
        <Input className="mt-1 min-h-11" defaultValue={params.get("company") ?? ""} onBlur={(event) => {
          const next = currentParams()
          const value = event.target.value.trim()
          if (value) next.set("company", value)
          else next.delete("company")
          void applyParams("company", () => next, !value)
        }} />
      </label>
      <fieldset>
        <legend className="text-role-caption text-ink-muted">Job type</legend>
        <div className="mt-1 flex flex-col">
          {FEED_JOB_TYPES.map((type) => {
            const active = (params.get("type") ?? "").split(",").includes(type)
            return (
              <button
                key={type}
                type="button"
                className="min-h-11 text-left text-role-body-small"
                onClick={() => {
                  const next = currentParams()
                  const types = (next.get("type") ?? "").split(",").filter(Boolean)
                  const value = active ? types.filter((item) => item !== type) : [...types, type]
                  if (value.length) next.set("type", value.join(","))
                  else next.delete("type")
                  void applyParams(`type:${type}`, () => next, active)
                }}
              >
                {type}
                {emptyMark[`type:${type}`] === 0 ? " · 0" : ""}
                {active ? " · on" : ""}
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-role-caption text-ink-muted">Source</legend>
        <div className="mt-1 flex flex-col">
          {FEED_SOURCES.map((source) => {
            const active = (params.get("src") ?? "").split(",").includes(source)
            return (
              <button
                key={source}
                type="button"
                className="min-h-11 text-left text-role-body-small"
                onClick={() => {
                  const next = currentParams()
                  const sources = (next.get("src") ?? "").split(",").filter(Boolean)
                  const value = active ? sources.filter((item) => item !== source) : [...sources, source]
                  if (value.length) next.set("src", value.join(","))
                  else next.delete("src")
                  void applyParams(`src:${source}`, () => next, active)
                }}
              >
                {formatJobSource(source)}
                {emptyMark[`src:${source}`] === 0 ? " · 0" : ""}
                {active ? " · on" : ""}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )

  return (
    <div className="flex min-h-[70vh] flex-col gap-3 p-3" onKeyDown={onListKey}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <Text role="caption" className="text-ink-muted">Search roles</Text>
          <Input className="mt-1 min-h-11" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Title, skill, or company" aria-label="Search roles" />
        </label>
        <label className="text-role-caption text-ink-muted">
          Sort
          <select
            className="mt-1 block min-h-11 rounded-control border border-hairline bg-surface-raised px-2 text-role-body-small text-ink"
            value={sort}
            aria-label="Sort roles"
            onChange={(event) => {
              const next = currentParams()
              const value = event.target.value
              if (value === "newest") next.delete("sort")
              else next.set("sort", value)
              pushParams(next)
            }}
          >
            <option value="newest">Newest posted</option>
            <option value="match">Best match</option>
            <option value="salary">Salary</option>
            <option value="verified" disabled>Most recently verified — no verification time is stored</option>
          </select>
        </label>
        <Button type="button" variant="outline" className="min-h-11 xl:hidden" onClick={() => setFiltersOpen(true)}>Filters</Button>
        <Button type="button" variant="outline" className="hidden min-h-11 xl:inline-flex" onClick={() => {
          window.localStorage.setItem("wg-jobs-rail", railClosed ? "open" : "closed")
          window.dispatchEvent(new Event("wg-jobs-rail"))
        }}>{railClosed ? "Show filters" : "Hide filters"}</Button>
      </div>
      {sort === "salary" ? <Text role="caption" className="text-ink-muted">Salary is not on these listings, so this sort leaves the posted order unchanged.</Text> : null}
      {sort === "match" && skills.length === 0 ? <Text role="caption" className="text-ink-muted">Best match needs skills on your profile. Showing newest posted.</Text> : null}
      {initial.relaxedQuery && initial.originalQuery ? (
        <Text role="body-small">No exact matches for “{initial.originalQuery}”. Showing results for “{initial.relaxedQuery}”.</Text>
      ) : null}
      <div className="flex gap-2 overflow-x-auto">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 text-role-caption",
              chip.active ? "border-accent bg-accent-wash text-accent" : "border-hairline bg-surface-raised text-ink",
            )}
            onClick={() => void applyParams(chip.id, chip.params, chip.active)}
          >
            {chip.label}
            {emptyMark[chip.id] === 0 ? " · 0" : ""}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {appliedChips.map((chip) => (
          <button key={chip.id} type="button" className="inline-flex min-h-11 items-center rounded-full border border-hairline px-3 text-role-caption" onClick={() => clearChip(chip.id)}>
            {chip.label} · remove
          </button>
        ))}
        {appliedChips.length > 0 ? (
          <button type="button" className="min-h-11 px-2 text-role-caption text-accent" onClick={clearAll}>Clear all</button>
        ) : null}
        {naming ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              const name = searchName.trim()
              if (!name) return
              writeSavedSearches([{ id: crypto.randomUUID(), name, query: currentParams().toString() }, ...readSavedSearches()])
              setSearchName("")
              setNaming(false)
              toast({ title: "Saved this search", variant: "success" })
            }}
          >
            <Input className="min-h-11" aria-label="Saved search name" value={searchName} onChange={(event) => setSearchName(event.target.value)} />
            <Button type="submit" className="min-h-11">Save</Button>
          </form>
        ) : (
          <button type="button" className="min-h-11 px-2 text-role-caption text-ink" onClick={() => setNaming(true)}>Save this search</button>
        )}
      </div>
      <Text role="body-small" aria-live="polite">{initial.error ? initial.error : `${initial.total.toLocaleString("en-US")} roles`}</Text>
      <div className={cn("grid min-h-0 flex-1 gap-3", railClosed ? (preview && wide ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : "") : preview && wide ? "xl:grid-cols-[16rem_minmax(0,1fr)_22rem]" : "xl:grid-cols-[16rem_minmax(0,1fr)]")}>
        {railClosed ? null : <aside className="hidden xl:block">{filterBody}</aside>}
        <div
          ref={listRef}
          tabIndex={0}
          className="h-[70vh] overflow-auto rounded-card border border-hairline bg-surface outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop)
            setViewport(event.currentTarget.clientHeight)
          }}
        >
          {initial.error ? null : rows.length === 0 ? (
            <div className="p-4">
              <Text role="body">No roles match these filters.</Text>
              <button type="button" className="mt-2 min-h-11 text-role-body-small text-accent" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
              {visible.map((row, index) => {
                const absolute = start + index
                const view = jobCardView(row.job)
                const saved = savedIds.has(row.job.id)
                const applied = isApplied(row.job, applications) || (row.job.applyUrl ? trackedUrls.includes(row.job.applyUrl) : false)
                const notes = [saved ? "Saved on this device" : null, applied ? "In your tracker" : null].filter(Boolean).join(" · ")
                return (
                  <div
                    key={row.job.id}
                    className={cn("absolute inset-x-0 px-2 py-2", absolute === focus && "ring-2 ring-inset ring-accent")}
                    style={{ top: absolute * ROW_HEIGHT, height: ROW_HEIGHT }}
                  >
                    {row.pending ? (
                      <div className="flex h-full flex-col justify-center gap-2 rounded-card border border-hairline bg-surface-sunken px-3 duration-slow ease-exit">
                        <Text role="body-small">Dismissed {row.job.title}</Text>
                        <Input
                          className="min-h-11"
                          aria-label="Optional reason"
                          placeholder="Optional reason"
                          onChange={(event) => {
                            const value = event.target.value
                            setPendingDismiss((current) => ({ ...current, [row.job.id]: value }))
                          }}
                        />
                        <button type="button" className="min-h-11 self-start text-role-body-small text-accent" onClick={() => undo(row.job.id)}>Undo</button>
                      </div>
                    ) : (
                      <ProductJobCard
                        title={row.job.title}
                        company={row.job.company}
                        location={row.job.location}
                        remoteType={view.remoteType}
                        salary={view.salary}
                        match={view.match}
                        freshness={view.freshness}
                        source={view.source}
                        trust={view.trust}
                        applyLabel={view.applyLabel}
                        statusNote={notes || undefined}
                        saved={saved}
                        onSave={() => toggleSave(row.job)}
                        onDismiss={() => dismiss(row.job)}
                        onApply={() => apply(row.job)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {hasMore && !initial.error ? (
            <div className="p-3">
              <Button type="button" className="min-h-11" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Loading" : "Load more"}
              </Button>
              {loadError ? <Text role="caption" className="mt-2 text-danger">{loadError}</Text> : null}
            </div>
          ) : null}
        </div>
        {preview && wide ? (
          <aside className="hidden max-h-[70vh] overflow-auto rounded-card border border-hairline bg-surface-raised p-3 xl:block">
            <Text as="h2" role="subheading">{preview.title}</Text>
            <Text role="body-small" className="text-ink-muted">{preview.company}</Text>
            <Text role="body-small" className="mt-3 line-clamp-6">{preview.description || "No description is stored for this listing."}</Text>
            <div className="mt-3 flex flex-col gap-2">
              <Button type="button" className="min-h-11" onClick={() => apply(preview)}>{jobCardView(preview).applyLabel}</Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => router.push(`/jobs/${encodeURIComponent(preview.id)}`)}>Open full page</Button>
            </div>
          </aside>
        ) : null}
      </div>
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <div className="mt-3 overflow-auto">{filterBody}</div>
        </DrawerContent>
      </Drawer>
      {trackJob ? (
        <div className="fixed bottom-24 left-3 right-3 z-toast flex flex-wrap items-center gap-2 rounded-card border border-hairline bg-surface-raised p-3 shadow-overlay md:left-auto md:max-w-md" role="status">
          <Text role="body-small">Add {trackJob.title} at {trackJob.company} to your tracker?</Text>
          <Button type="button" className="min-h-11" onClick={() => void addToTracker(trackJob)}>Add</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setTrackJob(null)}>Not now</Button>
        </div>
      ) : null}
    </div>
  )
}
