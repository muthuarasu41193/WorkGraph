"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ProductJobCard } from "@/components/product/JobCard"
import { JobFeedSkeleton, JOB_FEED_ROW_HEIGHT } from "@/components/jobs/JobFeedSkeleton"
import { EmptyState } from "@/components/states/EmptyState"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
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
  relaxQuery,
  sortFeedJobs,
  type FeedSort,
} from "@/lib/job-feed"
import { attachMissingSkills } from "@/lib/job-requirements"
import { dismissedSnapshot, readDismissedJobs, subscribeDismissedJobs, writeDismissedJobs } from "@/lib/dismissed-jobs"
import { readSavedSearches, writeSavedSearches } from "@/lib/saved-searches"
import {
  readRecentSearches,
  rememberRecentSearch,
  recentSearchesSnapshot,
  subscribeRecentSearches,
} from "@/lib/recent-searches"
import { LANGUAGE_EMPTY_HINT, queryLooksNonLatin } from "@/lib/search-language"
import { toggleSavedJobId } from "@/lib/saved-jobs-storage"
import { formatJobSource } from "@/lib/job-card-data"
import { sanitizeJobDescription } from "@/lib/job-summary"
import { feedFocusAnnouncement, nextListIndex } from "@/lib/a11y"
import { cn } from "@/lib/utils"

const ROW_HEIGHT = JOB_FEED_ROW_HEIGHT
const VIRTUALIZE_AFTER = 50
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
  tailorHref = null,
}: {
  initial: JobFeedInitial
  userId: string | null
  applications: AppliedRef[]
  skills: string[]
  search: string
  tailorHref?: string | null
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
  const recentRaw = useSyncExternalStore(subscribeRecentSearches, recentSearchesSnapshot, () => "")
  const savedIds = useMemo(() => idsFromStorage(savedRaw), [savedRaw])
  const dismissedIds = useMemo(() => dismissedIdsFromStorage(dismissedRaw), [dismissedRaw])
  const recentSearches = useMemo(() => {
    void recentRaw
    return readRecentSearches()
  }, [recentRaw])
  const params = useMemo(() => new URLSearchParams(search), [search])
  const sort = parseFeedSort(params.get("sort") ?? undefined)
  const feedSort: FeedSort = sort === "verified" ? "newest" : sort === "salary" ? "newest" : sort
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [extra, setExtra] = useState<RecommendedJobCard[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initial.hasMore)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [emptyMark, setEmptyMark] = useState<Record<string, number>>({})
  const [focus, setFocus] = useState(0)
  const [focusAnnouncement, setFocusAnnouncement] = useState("")
  const [preview, setPreview] = useState<RecommendedJobCard | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [naming, setNaming] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [alerting, setAlerting] = useState(false)
  const [alertName, setAlertName] = useState("")
  const [savingAlert, setSavingAlert] = useState(false)
  const [pendingDismiss, setPendingDismiss] = useState<Record<string, string>>({})
  const [trackJob, setTrackJob] = useState<RecommendedJobCard | null>(null)
  const [trackedUrls, setTrackedUrls] = useState<string[]>([])
  const [touchPrefetch, setTouchPrefetch] = useState(false)
  const timer = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prefetched = useRef<Set<string>>(new Set())

  const jobs = useMemo(() => {
    const seen = new Set<string>()
    const merged = [...initial.jobs, ...extra].filter((job) => {
      if (seen.has(job.id) || dismissedIds.has(job.id)) return false
      seen.add(job.id)
      return true
    })
    const hideClosed = params.get("hideClosed") === "1"
    const payStated = params.get("pay") === "stated"
    const filtered = merged.filter((job) => {
      const view = jobCardView(job)
      if (hideClosed && view.stale) return false
      if (payStated && view.salary.kind === "undisclosed") return false
      return true
    })
    return sortFeedJobs(filtered, feedSort === "match" ? "match" : "newest")
  }, [initial.jobs, extra, dismissedIds, feedSort, params])

  const rows = jobs.map((job) => ({ job, pending: Object.prototype.hasOwnProperty.call(pendingDismiss, job.id) }))
  const useVirtual = rows.length > VIRTUALIZE_AFTER

  useLayoutEffect(() => {
    if (sessionStorage.getItem("wg-jobs-restore") !== "1") return
    sessionStorage.removeItem("wg-jobs-restore")
    const top = Number(sessionStorage.getItem("wg-jobs-scroll") ?? "")
    if (listRef.current && Number.isFinite(top)) listRef.current.scrollTop = top
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(hover: none)")
    const sync = () => setTouchPrefetch(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    const q = params.get("q")?.trim()
    if (q) rememberRecentSearch(q, params.toString())
  }, [params])

  const virtualizer = useVirtualizer({
    count: useVirtual ? rows.length : 0,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  })

  function rememberList(nextJobs: RecommendedJobCard[]) {
    sessionStorage.setItem("wg-jobs-ids", JSON.stringify(nextJobs.map((job) => job.id)))
    sessionStorage.setItem("wg-jobs-scroll", String(listRef.current?.scrollTop ?? 0))
    sessionStorage.setItem("wg-jobs-restore", "1")
  }

  function pushParams(next: URLSearchParams) {
    const value = next.toString()
    const q = next.get("q")?.trim()
    if (q) rememberRecentSearch(q, value)
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
    { id: "pay", label: "Only jobs with pay stated", active: params.get("pay") === "stated", params: (p) => { const n = new URLSearchParams(p); if (n.get("pay") === "stated") n.delete("pay"); else n.set("pay", "stated"); return n } },
    { id: "hideClosed", label: "Hide likely-closed jobs", active: params.get("hideClosed") === "1", params: (p) => { const n = new URLSearchParams(p); if (n.get("hideClosed") === "1") n.delete("hideClosed"); else n.set("hideClosed", "1"); return n } },
  ]

  const appliedChips = [
    params.get("q") ? { id: "q", label: `Search: ${params.get("q")}` } : null,
    params.get("locMode") ? { id: "locMode", label: params.get("locMode") } : null,
    params.get("date") ? { id: "date", label: `Posted window: ${params.get("date")}d` } : null,
    params.get("loc") ? { id: "loc", label: params.get("loc") } : null,
    params.get("company") ? { id: "company", label: params.get("company") } : null,
    params.get("type") ? { id: "type", label: params.get("type") } : null,
    params.get("pay") === "stated" ? { id: "pay", label: "Only jobs with pay stated" } : null,
    params.get("hideClosed") === "1" ? { id: "hideClosed", label: "Hide likely-closed jobs" } : null,
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
    for (const key of ["q", "src", "date", "locMode", "loc", "company", "type", "pay", "hideClosed"]) next.delete(key)
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

  function moveFocus(delta: number) {
    const next = nextListIndex(focus, delta, rows.length)
    setFocus(next)
    const job = rows[next]?.job
    if (job) setFocusAnnouncement(feedFocusAnnouncement(job.title, job.company, next, rows.length))
    if (useVirtual) {
      virtualizer.scrollToIndex(next, { align: "auto" })
      return
    }
    const node = listRef.current
    if (!node) return
    const top = next * ROW_HEIGHT
    if (top < node.scrollTop || top + ROW_HEIGHT > node.scrollTop + node.clientHeight) node.scrollTop = top
  }

  function prefetchJob(id: string) {
    if (prefetched.current.has(id)) return
    prefetched.current.add(id)
    router.prefetch(`/jobs/${encodeURIComponent(id)}`)
  }

  async function retryFeed() {
    setRetrying(true)
    setLoadError(null)
    try {
      router.refresh()
    } finally {
      window.setTimeout(() => setRetrying(false), 400)
    }
  }

  function onListKey(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
    const job = rows[focus]?.job
    if (event.key === "j") {
      event.preventDefault()
      moveFocus(1)
    } else if (event.key === "k") {
      event.preventDefault()
      moveFocus(-1)
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

  const broaderSuggestions = useMemo(() => {
    const suggestions: { label: string; href: string }[] = []
    const q = params.get("q")?.trim()
    if (q) {
      const relaxed = relaxQuery(q)
      if (relaxed) {
        const next = new URLSearchParams(params)
        next.set("q", relaxed)
        suggestions.push({ label: `Search “${relaxed}”`, href: `/jobs?${next}` })
      }
      suggestions.push({ label: "Clear the search text", href: (() => {
        const next = new URLSearchParams(params)
        next.delete("q")
        const value = next.toString()
        return value ? `/jobs?${value}` : "/jobs"
      })() })
    }
    if (params.get("locMode") || params.get("date") || params.get("pay") || params.get("hideClosed") || params.get("src") || params.get("type") || params.get("loc") || params.get("company")) {
      suggestions.push({ label: "Search without these filters", href: q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs" })
    }
    if (suggestions.length === 0) {
      suggestions.push({ label: "Browse newest roles", href: "/jobs" })
    }
    return suggestions.slice(0, 4)
  }, [params])

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
    <div className="flex min-h-[70vh] flex-col gap-3" onKeyDown={onListKey}>
      <div className="sticky top-0 z-sticky border-b border-hairline bg-surface/95 px-3 py-3 backdrop-blur-sm motion-reduce:backdrop-blur-none">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1">
            <Text role="caption" className="text-ink-muted">Search roles</Text>
            <Input className="mt-1 min-h-11" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Title, skill, or company" aria-label="Search roles" />
          </label>
          <label className="text-role-caption text-ink-muted">
            Sort
            <select
              className="mt-1 block min-h-11 rounded-control border border-hairline bg-surface-raised px-2 text-role-body-small text-ink"
              value={feedSort === "match" ? "match" : "newest"}
              aria-label="Sort roles"
              onChange={(event) => {
                const next = currentParams()
                const value = event.target.value
                if (value === "newest") next.delete("sort")
                else next.set("sort", "match")
                pushParams(next)
              }}
            >
              <option value="newest">Newest</option>
              <option value="match">Most relevant</option>
            </select>
          </label>
          <Button type="button" variant="outline" className="min-h-11 xl:hidden" onClick={() => setFiltersOpen(true)}>Filters</Button>
          <Button type="button" variant="outline" className="hidden min-h-11 xl:inline-flex" onClick={() => {
            window.localStorage.setItem("wg-jobs-rail", railClosed ? "open" : "closed")
            window.dispatchEvent(new Event("wg-jobs-rail"))
          }}>{railClosed ? "Show filters" : "Hide filters"}</Button>
        </div>
        {feedSort === "match" && skills.length === 0 ? <Text role="caption" className="mt-2 text-ink-muted">Most relevant needs skills on your profile. Showing newest.</Text> : null}
        {initial.relaxedQuery && initial.originalQuery ? (
          <Text role="body-small" className="mt-2">No exact matches for “{initial.originalQuery}”. Showing results for “{initial.relaxedQuery}”.</Text>
        ) : null}
        <div className="mt-3 flex gap-2 overflow-x-auto motion-reduce:scroll-auto">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 text-role-caption motion-reduce:transition-none",
                chip.active ? "border-accent bg-accent-wash text-accent" : "border-hairline bg-surface-raised text-ink",
              )}
              onClick={() => void applyParams(chip.id, chip.params, chip.active)}
            >
              {chip.label}
              {emptyMark[chip.id] === 0 ? " · 0" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 px-3 pb-3">
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
        {userId ? (
          alerting ? (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                const name = alertName.trim()
                if (!name || savingAlert) return
                setSavingAlert(true)
                void (async () => {
                  try {
                    const res = await fetch("/api/alerts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: name.slice(0, 80),
                        query: currentParams().toString().slice(0, 500),
                        frequency: "weekly",
                        discreet: true,
                        min_match: 40,
                      }),
                    })
                    const json = (await res.json()) as { ok?: boolean; error?: string }
                    if (!res.ok || !json.ok) {
                      toast({ title: json.error ?? "Could not save alert", variant: "error" })
                      return
                    }
                    setAlertName("")
                    setAlerting(false)
                    toast({ title: "Saved as alert", variant: "success" })
                  } finally {
                    setSavingAlert(false)
                  }
                })()
              }}
            >
              <Input
                className="min-h-11"
                aria-label="Alert name"
                value={alertName}
                onChange={(event) => setAlertName(event.target.value)}
              />
              <Button type="submit" className="min-h-11" loading={savingAlert}>
                Save alert
              </Button>
              <button
                type="button"
                className="min-h-11 px-2 text-role-caption text-ink-muted"
                onClick={() => {
                  setAlerting(false)
                  setAlertName("")
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="min-h-11 px-2 text-role-caption text-ink"
              onClick={() => setAlerting(true)}
            >
              Save as alert
            </button>
          )
        ) : (
          <button
            type="button"
            className="min-h-11 px-2 text-role-caption text-ink-muted"
            onClick={() => router.push("/login?next=/jobs")}
          >
            Sign in to save alerts
          </button>
        )}
      </div>
      <Text role="body-small" aria-live="polite">
        {initial.error
          ? "Roles could not be loaded"
          : params.get("pay") === "stated" || params.get("hideClosed") === "1"
            ? `${jobs.length.toLocaleString("en-US")} loaded roles match these trust filters. The index still has ${initial.total.toLocaleString("en-US")} roles.`
            : `${initial.total.toLocaleString("en-US")} roles`}
      </Text>
      <p id="job-feed-keys" className="text-role-caption text-ink-muted">j and k move. Enter opens. s saves. x dismisses.</p>
      <p className="sr-only" aria-live="polite">{focusAnnouncement}</p>
      <div className={cn("grid min-h-0 flex-1 gap-3", railClosed ? (preview && wide ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : "") : preview && wide ? "xl:grid-cols-[16rem_minmax(0,1fr)_22rem]" : "xl:grid-cols-[16rem_minmax(0,1fr)]")}>
        {railClosed ? null : <aside className="hidden xl:block">{filterBody}</aside>}
        <div
          ref={listRef}
          tabIndex={0}
          aria-label="Job list"
          aria-keyshortcuts="j k Enter s x"
          aria-describedby="job-feed-keys"
          className="h-[70vh] overflow-auto rounded-card border border-hairline bg-surface outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {initial.error ? (
            <div className="space-y-3 p-4">
              <EmptyState
                title="Roles could not be loaded"
                reason="The jobs request did not finish. Your filters are unchanged. Try again."
                actionLabel={retrying ? "Trying again" : "Try again"}
                onAction={() => void retryFeed()}
              />
              <Text role="caption" className="text-ink-muted">
                WorkGraph could not reach the job index. Nothing on this page was lost.
              </Text>
            </div>
          ) : rows.length === 0 ? (
            <div className="space-y-4 p-4">
              {queryLooksNonLatin(params.get("q") ?? "") ? (
                <p className="rounded-card border border-hairline bg-surface-sunken px-3 py-2 text-role-body-small text-ink" role="status">
                  {LANGUAGE_EMPTY_HINT}
                </p>
              ) : null}
              <EmptyState
                title={appliedChips[0] ? "No roles match these filters" : "No roles matched that search"}
                reason={
                  appliedChips[0]
                    ? `${appliedChips[0].label} is hiding results. Try a broader search below.`
                    : "Try a broader role or skill, or open a recent search."
                }
                actionLabel={appliedChips[0] ? `Remove ${appliedChips[0].label}` : "Browse newest roles"}
                onAction={appliedChips[0] ? () => clearChip(appliedChips[0].id) : () => pushParams(new URLSearchParams())}
              />
              <div>
                <Text role="caption" className="text-ink-muted">Broader searches</Text>
                <ul className="mt-2 space-y-1" role="list">
                  {broaderSuggestions.map((item) => (
                    <li key={item.href + item.label}>
                      <a href={item.href} className="inline-flex min-h-11 items-center text-role-body-small text-accent">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {recentSearches.length > 0 ? (
                <div>
                  <Text role="caption" className="text-ink-muted">Recent searches</Text>
                  <ul className="mt-2 space-y-1" role="list">
                    {recentSearches.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center text-role-body-small text-ink"
                          onClick={() => {
                            setQuery(item.q)
                            router.replace(item.query ? `/jobs?${item.query}` : "/jobs", { scroll: false })
                          }}
                        >
                          {item.q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : useVirtual ? (
            <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index]
                if (!row) return null
                return (
                  <div
                    key={row.job.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={cn("absolute inset-x-0 px-2 py-2", virtualRow.index === focus && "ring-2 ring-inset ring-accent")}
                    style={{ transform: `translateY(${virtualRow.start}px)`, height: ROW_HEIGHT }}
                  >
                    <FeedRow
                      row={row}
                      skills={skills}
                      saved={savedIds.has(row.job.id)}
                      applied={isApplied(row.job, applications) || (row.job.applyUrl ? trackedUrls.includes(row.job.applyUrl) : false)}
                      tailorHref={tailorHref}
                      rootRef={listRef}
                      touchPrefetch={touchPrefetch}
                      onUndo={() => undo(row.job.id)}
                      onReason={(value) => setPendingDismiss((current) => ({ ...current, [row.job.id]: value }))}
                      onSave={() => toggleSave(row.job)}
                      onDismiss={() => dismiss(row.job)}
                      onApply={() => apply(row.job)}
                      onIntent={() => prefetchJob(row.job.id)}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
              {rows.map((row, absolute) => (
                <div
                  key={row.job.id}
                  className={cn("absolute inset-x-0 px-2 py-2", absolute === focus && "ring-2 ring-inset ring-accent")}
                  style={{ top: absolute * ROW_HEIGHT, height: ROW_HEIGHT }}
                >
                  <FeedRow
                    row={row}
                    skills={skills}
                    saved={savedIds.has(row.job.id)}
                    applied={isApplied(row.job, applications) || (row.job.applyUrl ? trackedUrls.includes(row.job.applyUrl) : false)}
                    tailorHref={tailorHref}
                    rootRef={listRef}
                    touchPrefetch={touchPrefetch}
                    onUndo={() => undo(row.job.id)}
                    onReason={(value) => setPendingDismiss((current) => ({ ...current, [row.job.id]: value }))}
                    onSave={() => toggleSave(row.job)}
                    onDismiss={() => dismiss(row.job)}
                    onApply={() => apply(row.job)}
                    onIntent={() => prefetchJob(row.job.id)}
                  />
                </div>
              ))}
            </div>
          )}
          {loadingMore ? <JobFeedSkeleton rows={2} className="motion-reduce:animate-none" /> : null}
          {hasMore && !initial.error ? (
            <div className="p-3">
              <Button type="button" className="min-h-11 min-w-32" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Loading" : "Load more"}
              </Button>
              {loadError ? <p className="mt-2 text-role-caption text-danger" role="alert">{loadError}</p> : null}
            </div>
          ) : null}
        </div>
        {preview && wide ? (
          <aside className="hidden max-h-[70vh] overflow-auto rounded-card border border-hairline bg-surface-raised p-3 xl:block">
            <Text as="h2" role="subheading">{preview.title}</Text>
            <Text role="body-small" className="text-ink-muted">{preview.company}</Text>
            <Text role="body-small" className="mt-3 line-clamp-6">{sanitizeJobDescription(preview.description, preview.company) || "No description is stored for this listing."}</Text>
            <div className="mt-3 flex flex-col gap-2">
              <Button type="button" className="min-h-11" onClick={() => apply(preview)}>{jobCardView(preview).applyLabel}</Button>
              <Button type="button" variant="outline" className="min-h-11" onMouseEnter={() => prefetchJob(preview.id)} onFocus={() => prefetchJob(preview.id)} onClick={() => router.push(`/jobs/${encodeURIComponent(preview.id)}`)}>Open full page</Button>
            </div>
          </aside>
        ) : null}
      </div>
      </div>
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the job list. Changes are saved in the page address.</DrawerDescription>
          <div className="mt-3 overflow-auto pb-6">{filterBody}</div>
        </DrawerContent>
      </Drawer>
      {trackJob ? (
        <div className="fixed bottom-24 start-3 end-3 z-toast flex flex-wrap items-center gap-2 rounded-card border border-hairline bg-surface-raised p-3 shadow-overlay md:start-auto md:max-w-md" role="status">
          <Text role="body-small">Add {trackJob.title} at {trackJob.company} to your tracker?</Text>
          <Button type="button" className="min-h-11" onClick={() => void addToTracker(trackJob)}>Add</Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setTrackJob(null)}>Not now</Button>
        </div>
      ) : null}
    </div>
  )
}

function FeedRow({
  row,
  skills,
  saved,
  applied,
  tailorHref,
  rootRef,
  touchPrefetch,
  onUndo,
  onReason,
  onSave,
  onDismiss,
  onApply,
  onIntent,
}: {
  row: { job: RecommendedJobCard; pending: boolean }
  skills: string[]
  saved: boolean
  applied: boolean
  tailorHref?: string | null
  rootRef: React.RefObject<HTMLDivElement | null>
  touchPrefetch: boolean
  onUndo: () => void
  onReason: (value: string) => void
  onSave: () => void
  onDismiss: () => void
  onApply: () => void
  onIntent: () => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!touchPrefetch) return
    const node = hostRef.current
    const root = rootRef.current
    if (!node || !root) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntent()
          observer.disconnect()
        }
      },
      { root, rootMargin: "120px", threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [touchPrefetch, rootRef, onIntent, row.job.id])

  const view = jobCardView(attachMissingSkills(row.job, skills))
  const notes = [saved ? "Saved on this device" : null, applied ? "In your tracker" : null].filter(Boolean).join(" · ")
  if (row.pending) {
    return (
      <div ref={hostRef} className="flex h-full flex-col justify-center gap-2 rounded-card border border-hairline bg-surface-sunken px-3 duration-slow ease-exit motion-reduce:transition-none">
        <Text role="body-small">Dismissed {row.job.title}</Text>
        <Input className="min-h-11" aria-label="Optional reason" placeholder="Optional reason" onChange={(event) => onReason(event.target.value)} />
        <button type="button" className="min-h-11 self-start text-role-body-small text-accent" onClick={onUndo}>Undo</button>
      </div>
    )
  }
  return (
    <div ref={hostRef} className="h-full">
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
        tailorHref={tailorHref}
        applyLabel={view.applyLabel}
        statusNote={notes || undefined}
        saved={saved}
        onSave={onSave}
        onDismiss={onDismiss}
        onApply={onApply}
        onIntent={onIntent}
      />
    </div>
  )
}

