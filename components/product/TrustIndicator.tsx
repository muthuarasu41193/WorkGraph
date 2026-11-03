"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * One explainable label. Warning colour is reserved for a payment request.
 * Other labels stay neutral.
 */
export type TrustFlagDisplay = {
  code: string
  label: string
  explanation: string
  warning?: boolean
}

/**
 * A named reason for the trust band. Caution is a full sentence on a caution wash, not an error and not a generic badge.
 * When flags are present, at most two labels are shown, each with a Why tooltip.
 */
export type TrustIndicatorProps = {
  tone: "clear" | "caution" | "positive"
  reason: string
  flags?: TrustFlagDisplay[]
  loading?: boolean
  error?: string
  className?: string
}

const TONE_CLASS = {
  clear: "border-hairline bg-surface-sunken text-ink",
  caution: "border-caution bg-caution-wash text-caution",
  positive: "border-positive bg-positive-wash text-positive",
} as const

export function TrustIndicator({ tone, reason, flags, loading = false, error, className }: TrustIndicatorProps) {
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
  const shown = (flags ?? []).slice(0, 2)
  if (shown.length > 0) {
    return (
      <TooltipProvider>
        <ul className={cn("flex flex-col gap-1", className)}>
          {shown.map((flag) => (
            <li
              key={flag.code}
              className={cn(
                "flex items-center justify-between gap-2 rounded-control border px-3 py-1 text-role-body-small font-medium",
                flag.warning ? "border-caution bg-caution-wash text-caution" : "border-hairline bg-surface-sunken text-ink",
              )}
            >
              <span>{flag.label}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="min-h-11 shrink-0 px-1 text-role-caption underline" aria-label={`Why: ${flag.explanation}`}>
                    Why?
                  </button>
                </TooltipTrigger>
                <TooltipContent>{flag.explanation}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    )
  }
  return (
    <p className={cn("rounded-control border px-3 py-2 text-role-body-small font-medium", TONE_CLASS[tone], className)}>
      {reason}
    </p>
  )
}
