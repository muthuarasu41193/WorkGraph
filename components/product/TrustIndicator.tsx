import { cn } from "@/lib/utils"

/**
 * A named reason for the trust band. Caution is a full sentence on a caution wash, not an error and not a generic badge.
 */
export type TrustIndicatorProps = {
  tone: "clear" | "caution" | "positive"
  reason: string
  loading?: boolean
  error?: string
  className?: string
}

const TONE_CLASS = {
  clear: "border-hairline bg-surface-sunken text-ink",
  caution: "border-caution bg-caution-wash text-caution",
  positive: "border-positive bg-positive-wash text-positive",
} as const

export function TrustIndicator({ tone, reason, loading = false, error, className }: TrustIndicatorProps) {
  if (loading) {
    return <div className={cn("h-11 w-full rounded-control bg-surface-sunken", className)} aria-hidden />
  }
  if (error) {
    return (
      <p className={cn("rounded-control bg-danger-wash px-3 py-2 text-role-body-small text-danger", className)} role="alert">
        {error}
      </p>
    )
  }
  return (
    <p className={cn("rounded-control border px-3 py-2 text-role-body-small font-medium", TONE_CLASS[tone], className)}>
      {reason}
    </p>
  )
}
