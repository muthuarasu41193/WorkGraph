"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
  disabled?: boolean
  loading?: boolean
  error?: boolean
  preview?: PreviewState
  className?: string
}

/** Numbered pagination. The current page is `aria-current="page"`. */
const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, pageCount, onPageChange, disabled, loading, error, preview, className },
  ref,
) {
  const isDisabled = Boolean(disabled || loading || preview === "disabled" || preview === "loading")
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  return (
    <nav ref={ref} aria-label="Pagination" data-preview={preview} className={lockClass(className, "flex flex-wrap items-center gap-1", error || preview === "error" ? "rounded-control bg-danger-wash p-1" : undefined)}>
      <button
        type="button"
        className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-hairline", FOCUS_RING, "hover:bg-surface-sunken disabled:opacity-50")}
        aria-label="Previous page"
        disabled={isDisabled || page <= 1}
        onClick={() => onPageChange?.(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? "page" : undefined}
          disabled={isDisabled}
          onClick={() => onPageChange?.(number)}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border text-role-caption tabular-nums",
            FOCUS_RING,
            number === page ? "border-accent bg-accent text-accent-ink" : "border-hairline bg-surface-raised hover:bg-surface-sunken",
            "disabled:opacity-50",
          )}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-hairline", FOCUS_RING, "hover:bg-surface-sunken disabled:opacity-50")}
        aria-label="Next page"
        disabled={isDisabled || page >= pageCount}
        onClick={() => onPageChange?.(page + 1)}
      >
        <ChevronRight className="size-4" />
      </button>
      {loading || preview === "loading" ? <span className="text-role-caption text-ink-subtle">Loading pages</span> : null}
      {error || preview === "error" ? <span className="text-role-caption text-danger">Could not load pages</span> : null}
    </nav>
  )
})

export { Pagination }
