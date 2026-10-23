"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { FreshnessIndicator, type FreshnessIndicatorProps } from "@/components/product/FreshnessIndicator"
import { MatchScore, type MatchScoreProps } from "@/components/product/MatchScore"
import { SalaryDisplay, type SalaryFigure } from "@/components/product/SalaryDisplay"
import { SourceAttribution, type SourceAttributionProps } from "@/components/product/SourceAttribution"
import { TrustIndicator, type TrustIndicatorProps } from "@/components/product/TrustIndicator"

/**
 * Scanning card for the public jobs feed. Compact and expanded share the same actions, which stay in the tab order
 * without opening the card. The profile jobs tab composes MatchScore, SalaryDisplay, FreshnessIndicator, and
 * SourceAttribution inside components/design-system/JobCard, which also carries the summary and resume detail.
 */
export type ProductJobCardProps = {
  title: string
  company: string
  companyVerified?: boolean
  location: string
  remoteType: string
  salary: SalaryFigure
  match: MatchScoreProps
  freshness: FreshnessIndicatorProps
  source: SourceAttributionProps
  trust?: TrustIndicatorProps
  description?: string
  expanded?: boolean
  saved?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  onSave?: () => void
  onDismiss?: () => void
  onApply?: () => void
  /** Names the destination. Defaults to Apply so existing callers stay unchanged. */
  applyLabel?: string
  /** Inline state such as saved or already in the tracker. */
  statusNote?: string
  /** Hover or focus on the card. The feed uses this to prefetch the detail route. */
  onIntent?: () => void
  className?: string
}

export function ProductJobCard({
  title,
  company,
  companyVerified = false,
  location,
  remoteType,
  salary,
  match,
  freshness,
  source,
  trust,
  description,
  expanded = false,
  saved = false,
  disabled = false,
  loading = false,
  error,
  onSave,
  onDismiss,
  onApply,
  applyLabel = "Apply on the listing",
  statusNote,
  onIntent,
  className,
}: ProductJobCardProps) {
  if (loading) {
    return (
      <article className={cn("space-y-2 rounded-card border border-hairline bg-surface-raised p-3", className)} aria-hidden>
        <div className="h-4 w-2/3 rounded-control bg-surface-sunken" />
        <div className="h-3 w-1/3 rounded-control bg-surface-sunken" />
        <div className="h-3 w-1/2 rounded-control bg-surface-sunken" />
        <div className="h-11 w-full rounded-control bg-surface-sunken" />
      </article>
    )
  }

  return (
    <article
      className={cn("rounded-card border border-hairline bg-surface-raised p-3 shadow-flat", disabled && "opacity-60", className)}
      onMouseEnter={onIntent}
      onFocus={onIntent}
    >
      {error ? (
        <p className="mb-2 rounded-control bg-danger-wash px-2 py-1 text-role-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-role-body line-clamp-2 font-semibold text-ink" title={title}>
            {title}
          </h2>
          <p className="text-role-caption truncate text-ink" title={company}>
            {company}
            {" · "}
            <Link href="/trust#verified-employer" className={companyVerified ? "text-positive" : "text-ink-muted"}>
              {companyVerified ? "Company domain verified" : "Company not verified"}
            </Link>
          </p>
          <p className="text-role-caption truncate text-ink-subtle" title={`${location} · ${remoteType}`}>
            {location} · {remoteType}
          </p>
        </div>
        <MatchScore {...match} />
      </div>
      <div className="mt-2 space-y-1">
        <SalaryDisplay salary={salary} />
        <FreshnessIndicator {...freshness} />
        <SourceAttribution {...source} />
        {trust ? <TrustIndicator {...trust} /> : null}
      </div>
      {expanded && description ? (
        <p className="measure text-role-body-small mt-3 line-clamp-3 text-ink-muted" title={description}>
          {description}
        </p>
      ) : null}
      {statusNote ? <p className="mt-2 text-role-caption text-ink-muted">{statusNote}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="inline-flex min-h-11 min-w-20 items-center rounded-control border border-hairline px-3 text-role-caption hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          aria-pressed={saved}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center rounded-control border border-hairline px-3 text-role-caption hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          Dismiss
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onApply}
          className="inline-flex min-h-11 items-center rounded-control bg-accent px-3 text-role-caption text-accent-ink hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
        >
          {applyLabel}
        </button>
      </div>
    </article>
  )
}
