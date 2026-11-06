"use client"

import { useEffect, useState } from "react"
import { Banknote, Bookmark, BookmarkCheck, Briefcase, ExternalLink, MapPin, MoreHorizontal, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { FOCUS_RING } from "@/lib/focus-ring"
import { formatPostedExactLocal, formatPostedRelative } from "@/lib/format-posted"
import type { SalaryFigure } from "@/components/product/SalaryDisplay"
import { salaryText } from "@/components/product/SalaryDisplay"
import { cn } from "@/lib/utils"

export type EmployerMark = "verified" | "unverified" | "reported"

export type ProductJobCardProps = {
  title: string
  company: string
  /** Domain verification / report state for the employer mark. */
  employerMark?: EmployerMark
  location: string
  remoteType: string
  salary: SalaryFigure
  /** Optional known job type (Full-time, Contract, …). Omitted when unknown. */
  jobType?: string | null
  sourceName: string
  postedAtIso?: string | null
  /** Fallback when postedAtIso is missing (legacy feed strings). */
  postedLabel?: string | null
  applyUrl?: string | null
  saved?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  statusNote?: string
  onSave?: () => void
  onDismiss?: () => void
  onReport?: () => void
  onApply?: () => void
  onViewDetails?: () => void
  onIntent?: () => void
  className?: string
}

const MARK_COPY: Record<
  EmployerMark,
  { label: string; className: string; explanation: string }
> = {
  verified: {
    label: "Verified",
    className: "text-positive",
    explanation:
      "The company domain on this listing matches a verified employer profile. It is a domain check, not a background check.",
  },
  unverified: {
    label: "Not verified",
    className: "text-ink-muted",
    explanation:
      "We have not matched this listing to a verified employer domain yet. That does not mean the role is fake.",
  },
  reported: {
    label: "Reported",
    className: "text-caution",
    explanation:
      "Someone reported a problem with this employer or listing. Read the listing carefully before you apply.",
  },
}

function isKnownLocation(location: string): boolean {
  const value = location.trim()
  if (!value) return false
  if (/^location tbd$/i.test(value)) return false
  return true
}

function isKnownRemote(remoteType: string): boolean {
  const value = remoteType.trim().toLowerCase()
  if (!value) return false
  if (value.includes("not listed")) return false
  if (value === "listed location") return false
  return value === "remote" || value === "hybrid" || value === "on-site" || value === "onsite"
}

function isKnownSalary(salary: SalaryFigure): boolean {
  if (salary.kind === "undisclosed") return false
  if (salary.kind === "stated" && !salary.label?.trim()) return false
  return true
}

function FactChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-control border border-hairline px-2 text-role-caption text-ink">
      <span className="text-ink-muted" aria-hidden>
        {icon}
      </span>
      <span className="tabular-nums">{label}</span>
    </span>
  )
}

export function ProductJobCard({
  title,
  company,
  employerMark = "unverified",
  location,
  remoteType,
  salary,
  jobType,
  sourceName,
  postedAtIso = null,
  postedLabel = null,
  applyUrl = null,
  saved = false,
  disabled = false,
  loading = false,
  error,
  statusNote,
  onSave,
  onDismiss,
  onReport,
  onApply,
  onViewDetails,
  onIntent,
  className,
}: ProductJobCardProps) {
  const [optimisticSaved, setOptimisticSaved] = useState(saved)
  const [locale, setLocale] = useState<string | undefined>(undefined)

  useEffect(() => {
    setOptimisticSaved(saved)
  }, [saved])

  useEffect(() => {
    setLocale(typeof navigator !== "undefined" ? navigator.language : undefined)
  }, [])

  if (loading) {
    return (
      <article
        className={cn("space-y-3 rounded-card border border-hairline bg-surface-raised p-3", className)}
        aria-busy="true"
        aria-label="Loading job"
      >
        <Skeleton className="h-5 w-3/4 rounded-control" />
        <Skeleton className="h-4 w-1/3 rounded-control" />
        <Skeleton className="h-4 w-2/3 rounded-control" />
        <Skeleton className="h-4 w-1/2 rounded-control" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-11 w-28 rounded-control" />
          <Skeleton className="h-11 w-32 rounded-control" />
          <Skeleton className="size-11 rounded-control" />
        </div>
      </article>
    )
  }

  const mark = MARK_COPY[employerMark]
  const chips: { key: string; icon: React.ReactNode; label: string }[] = []
  if (isKnownLocation(location)) {
    chips.push({ key: "location", icon: <MapPin className="size-3.5" aria-hidden />, label: location })
  }
  if (isKnownRemote(remoteType)) {
    chips.push({ key: "remote", icon: <Wifi className="size-3.5" aria-hidden />, label: remoteType })
  }
  if (isKnownSalary(salary)) {
    chips.push({ key: "salary", icon: <Banknote className="size-3.5" aria-hidden />, label: salaryText(salary) })
  }
  if (jobType?.trim()) {
    chips.push({ key: "type", icon: <Briefcase className="size-3.5" aria-hidden />, label: jobType.trim() })
  }

  const relative =
    formatPostedRelative(postedAtIso, Date.now(), locale) ??
    (postedLabel?.trim() ? postedLabel.trim() : null)
  const exact = formatPostedExactLocal(postedAtIso, locale)
  const applyLabel = `Apply on ${sourceName} ↗`

  function handleSave() {
    setOptimisticSaved((current) => !current)
    onSave?.()
  }

  return (
    <article
      className={cn(
        "rounded-card border border-hairline bg-surface-raised p-3 shadow-flat",
        disabled && "opacity-60",
        className,
      )}
      onMouseEnter={onIntent}
      onFocus={onIntent}
    >
      {error ? (
        <p className="mb-2 rounded-control bg-danger-wash px-2 py-1 text-role-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {/* Row 1 — title */}
      <h2 className="line-clamp-2 text-role-body font-semibold text-ink" title={title}>
        {title}
      </h2>

      {/* Row 2 — company + employer mark */}
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-hairline pb-2">
        <p className="truncate text-role-body-small text-ink" title={company}>
          {company}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex min-h-11 items-center text-role-caption underline-offset-2 hover:underline",
                FOCUS_RING,
                mark.className,
              )}
            >
              {mark.label}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-2 shadow-overlay">
            <p className="text-role-body-small font-medium text-ink">{mark.label}</p>
            <p className="text-role-body-small text-ink-muted">{mark.explanation}</p>
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 3 — fact chips or one quiet unknown line */}
      <div className="mt-2 min-h-8">
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <FactChip key={chip.key} icon={chip.icon} label={chip.label} />
            ))}
          </div>
        ) : (
          <p className="text-role-caption text-ink-subtle">Some details not listed by the source</p>
        )}
      </div>

      {/* Row 4 — via Source · posted … (once) */}
      <p className="mt-2 border-t border-hairline pt-2 text-role-caption text-ink-muted">
        <span>via {sourceName}</span>
        {relative ? (
          <>
            <span aria-hidden> · </span>
            <span title={exact ?? undefined}>posted {relative}</span>
          </>
        ) : null}
      </p>

      {statusNote ? <p className="mt-1 text-role-caption text-ink-muted">{statusNote}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={disabled}
          onClick={onViewDetails}
          className="min-h-11 rounded-control"
        >
          View details
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !applyUrl}
          onClick={onApply}
          className="min-h-11 rounded-control"
        >
          <span className="inline-flex items-center gap-1.5">
            {applyLabel}
            <ExternalLink className="size-3.5" aria-hidden />
          </span>
        </Button>
        <IconButton
          type="button"
          label={optimisticSaved ? "Remove saved job" : "Save job"}
          disabled={disabled}
          variant="ghost"
          onClick={handleSave}
          aria-pressed={optimisticSaved}
          className="min-h-11 min-w-11"
        >
          {optimisticSaved ? (
            <BookmarkCheck className="size-4 text-accent" aria-hidden />
          ) : (
            <Bookmark className="size-4" aria-hidden />
          )}
        </IconButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              type="button"
              label="More actions"
              disabled={disabled}
              variant="ghost"
              className="min-h-11 min-w-11"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-control border-hairline shadow-overlay">
            <DropdownMenuItem
              className="min-h-11"
              onSelect={() => {
                onDismiss?.()
              }}
            >
              Dismiss
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11"
              onSelect={() => {
                onReport?.()
              }}
            >
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
