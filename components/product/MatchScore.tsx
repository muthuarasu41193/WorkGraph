"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type MatchRequirement = {
  label: string
  met: boolean
}

/**
 * Score plus a one-line reason. Expands to met and unmet requirements.
 * The 20px mark is the shape; the sentence is required, so the score is never a bare percentage.
 */
export type MatchScoreProps = {
  score: number
  reason: string
  requirements?: MatchRequirement[]
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** When true, the percentage is hidden. Use this when the role was not scored. */
  unscored?: boolean
  /**
   * Accent fills the meter on the public feed. Neutral uses ink so a match
   * score does not read as the apply stamp.
   */
  tone?: "accent" | "neutral"
  loading?: boolean
  error?: string
  className?: string
}

export function MatchScore({
  score,
  reason,
  requirements = [],
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  unscored = false,
  tone = "accent",
  loading = false,
  error,
  className,
}: MatchScoreProps) {
  const [openUncontrolled, setOpen] = useState(defaultExpanded)
  const open = expanded ?? openUncontrolled
  const safeScore = Math.max(0, Math.min(100, Math.round(score)))

  if (loading) {
    return <div className={cn("h-11 w-56 rounded-control bg-surface-sunken", className)} aria-hidden />
  }

  if (error) {
    return (
      <p className={cn("rounded-control bg-danger-wash px-2 py-1 text-role-caption text-danger", className)} role="alert">
        {error}
      </p>
    )
  }

  if (unscored) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="text-role-caption text-ink">{reason}</p>
        {requirements.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {requirements.map((item) => (
              <li key={item.label} className={cn("text-role-caption", item.met ? "text-positive" : "text-ink-muted")}>
                {item.met ? "Met" : "Not met"}: {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-2 rounded-control text-left hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        aria-expanded={open}
        onClick={() => {
          const next = !open
          setOpen(next)
          onExpandedChange?.(next)
        }}
      >
        <span
          className="relative size-5 shrink-0 overflow-hidden rounded-control border border-hairline bg-surface-sunken"
          aria-hidden
        >
          <span
            className={cn("absolute inset-x-0 bottom-0", tone === "neutral" ? "bg-ink" : "bg-accent")}
            style={{ height: `${safeScore}%` }}
          />
        </span>
        <span className="min-w-0 text-role-caption text-ink">
          <span className="font-medium tabular-nums">{safeScore}</span>
          <span className="text-ink-muted"> — {reason}</span>
        </span>
      </button>
      {open && requirements.length > 0 ? (
        <ul className="mt-1 space-y-1 pl-7">
          {requirements.map((item) => (
            <li key={item.label} className={cn("text-role-caption", item.met ? "text-positive" : "text-ink-muted")}>
              {item.met ? "Met" : "Not met"}: {item.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
