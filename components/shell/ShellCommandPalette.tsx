"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
  { id: "qa-alerts", label: "Job alerts", hint: "Quick action", href: "/alerts" },
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery("")
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command shouldFilter={false} label="Shell search" loop className="bg-surface-raised text-ink">
          <Command.Input
            autoFocus
            value={query}
            onValueChange={(value) => void search(value)}
            placeholder="Jobs, companies, saved searches, tracker, pages"
            className="h-11 w-full border-b border-hairline bg-transparent px-4 text-role-body text-ink outline-none placeholder:text-ink-subtle"
            aria-label="Search jobs, companies, saved searches, and pages"
          />
          <Command.List className="max-h-80 overflow-auto p-2">
            <Command.Empty className="px-2 py-3 text-role-caption text-ink-subtle">No matches</Command.Empty>
            {items.map((item) => (
              <Command.Item
                key={item.id}
                value={`${item.id} ${item.label} ${item.hint ?? ""}`}
                onSelect={() => go(item)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-control px-2 text-left outline-none data-[selected=true]:bg-surface-sunken"
              >
                <span className="text-role-body-small text-ink">{item.label}</span>
                {item.hint ? <span className="shrink-0 text-role-caption text-ink-subtle">{item.hint}</span> : null}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
