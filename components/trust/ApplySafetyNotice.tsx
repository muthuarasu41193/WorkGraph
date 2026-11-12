import { APPLY_SAFETY_NOTICE } from "@/lib/accountability"
import { cn } from "@/lib/utils"

/** Inline notice shown next to external Apply controls. */
export function ApplySafetyNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-role-caption text-ink-muted", className)} role="note">
      {APPLY_SAFETY_NOTICE}
    </p>
  )
}
