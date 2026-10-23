"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { readSavedSearches, subscribeSavedSearches } from "@/lib/saved-searches"
import { fuzzyScore, SHELL_DESTINATIONS } from "@/lib/shell-nav"

type Item = { id: string; label: string; hint?: string; href?: string; action?: "help" }

const RECENT_KEY = "wg-shell-recent"

function readRecent(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Item[]
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  } catch {
    return []
  }
}

function remember(item: Item) {
  const next = [item, ...readRecent().filter((entry) => entry.id !== item.id)].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

const QUICK: Item[] = [
  { id: "qa-jobs", label: "Search jobs", hint: "Quick action", href: "/jobs" },
  { id: "qa-tracker", label: "Open tracker", hint: "Quick action", href: "/tracker" },
  { id: "qa-onboarding", label: "Continue onboarding", hint: "Quick action", href: "/onboarding" },
  { id: "qa-help", label: "Keyboard shortcuts", hint: "Quick action", action: "help" },
]

export function ShellCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<Item[]>([])
  const [tracker, setTracker] = useState<Item[]>([])
  const [active, setActive] = useState(0)
  const saved = useSyncExternalStore(subscribeSavedSearches, readSavedSearches, () => [])
  const recent = useMemo(() => (open ? readRecent() : []), [open])

  const nav: Item[] = SHELL_DESTINATIONS.map((dest) => ({
    id: dest.href,
    label: dest.label,
    hint: "Go to",
    href: dest.href,
  }))
  const savedItems: Item[] = saved.map((item) => ({
    id: `saved-${item.id}`,
    label: item.name,
    hint: "Saved search",
    href: `/jobs?${item.query}`,
  }))

  const q = query.trim()
  const pool = q
    ? [...nav, ...savedItems, ...QUICK, ...jobs, ...tracker].filter((item) => fuzzyScore(q, `${item.label} ${item.hint ?? ""}`) > 0)
    : [...recent, ...QUICK, ...savedItems, ...nav]
  const items = q
    ? [...pool].sort((a, b) => fuzzyScore(q, `${b.label} ${b.hint ?? ""}`) - fuzzyScore(q, `${a.label} ${a.hint ?? ""}`))
    : pool

  function go(item: Item) {
    remember(item)
    onOpenChange(false)
    setQuery("")
    if (item.action === "help") {
      window.dispatchEvent(new Event("wg-shell-help"))
      return
    }
    if (item.href) router.push(item.href)
  }

  async function search(value: string) {
    setQuery(value)
    setActive(0)
    const needle = value.trim()
    if (needle.length < 2) {
      setJobs([])
      setTracker([])
      return
    }
    const jobRes = await fetch(`/api/jobs?q=${encodeURIComponent(needle)}&page_size=6&rank_profile=0`)
    if (jobRes.ok) {
      const data = (await jobRes.json()) as { jobs?: { id: string; title: string; company: string }[] }
      const rows = data.jobs ?? []
      const companies = new Map<string, Item>()
      for (const job of rows) {
        if (job.company && fuzzyScore(needle, job.company) > 0 && !companies.has(job.company)) {
          companies.set(job.company, {
            id: `co-${job.company}`,
            label: job.company,
            hint: "Company",
            href: `/jobs?company=${encodeURIComponent(job.company)}`,
          })
        }
      }
      setJobs([
        ...rows.map((job) => ({
          id: `job-${job.id}`,
          label: job.title,
          hint: job.company,
          href: `/jobs/${encodeURIComponent(job.id)}`,
        })),
        ...companies.values(),
      ])
    }
    const appRes = await fetch("/api/applications", { credentials: "include" })
    if (appRes.ok) {
      const data = (await appRes.json()) as { applications?: { id: string; role: string; company: string }[] }
      setTracker(
        (data.applications ?? [])
          .filter((row) => fuzzyScore(needle, `${row.role} ${row.company}`) > 0)
          .slice(0, 5)
          .map((row) => ({
            id: `app-${row.id}`,
            label: row.role,
            hint: row.company,
            href: `/tracker?application=${encodeURIComponent(row.id)}`,
          })),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2 p-3">
        <DialogTitle className="text-role-subheading">Search</DialogTitle>
        <Input
          autoFocus
          aria-label="Search jobs, companies, saved searches, and pages"
          placeholder="Jobs, companies, saved searches, tracker, pages"
          value={query}
          className="min-h-11"
          onChange={(event) => void search(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setActive((index) => Math.min(index + 1, Math.max(items.length - 1, 0)))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((index) => Math.max(index - 1, 0))
            } else if (event.key === "Enter" && items[active]) {
              event.preventDefault()
              go(items[active])
            }
          }}
        />
        <ul role="listbox" aria-label="Search results" className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <li className="px-2 py-3 text-role-caption text-ink-subtle">No matches</li>
          ) : (
            items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-2 text-left ${index === active ? "bg-surface-sunken" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(item)}
                >
                  <span className="text-role-body-small text-ink">{item.label}</span>
                  {item.hint ? <span className="shrink-0 text-role-caption text-ink-subtle">{item.hint}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
