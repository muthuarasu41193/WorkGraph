import { cn } from "@/lib/utils"

/**
 * Plain-language freshness. The stale sentence uses the same size and weight as the verified one.
 */
export type FreshnessIndicatorProps = {
  status: "verified" | "stale" | "unknown"
  label: string
  loading?: boolean
  error?: string
  className?: string
}

const STATUS_CLASS = {
  verified: "text-positive",
  stale: "text-caution",
  unknown: "text-ink",
} as const

export function FreshnessIndicator({ status, label, loading = false, error, className }: FreshnessIndicatorProps) {
  if (loading) {
    return <div className={cn("h-5 w-48 rounded-control bg-surface-sunken", className)} aria-hidden />
  }
  if (error) {
    return (
      <p className={cn("text-role-body-small font-medium text-danger", className)} role="alert">
        {error}
      </p>
    )
  }
  return <p className={cn("text-role-body-small font-medium", STATUS_CLASS[status], className)}>{label}</p>
}
