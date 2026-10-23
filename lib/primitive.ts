import { cn } from "@/lib/utils"
import { FOCUS_RING } from "@/lib/focus-ring"

export type PreviewState =
  | "hover"
  | "active"
  | "focus"
  | "disabled"
  | "loading"
  | "error"
  | "selected"
  | "readonly"

const COLOR_UTILITY =
  /^(?:bg|text|fill|stroke|from|to|via|caret|decoration|outline|ring|border|shadow)-(?:ink|surface|accent|positive|caution|danger|hairline|brand|fg|primary|secondary|destructive|muted|foreground|background|popover|card|scrim|warning|success|info|white|black|current|transparent)(?:[^\s]*)?$/

/** Layout classes pass through. Colour utilities are dropped so a caller cannot restyle a primitive off the token system. */
export function passthroughClass(className?: string) {
  if (!className) return undefined
  const kept = className.split(/\s+/).filter((token) => {
    if (!token) return false
    const bare = token.replace(/^(?:[\w-]+:)+/, "")
    if (/^(?:bg|text|fill|stroke|from|to|via|ring|border|outline|shadow)-\[/.test(bare)) return false
    if (COLOR_UTILITY.test(bare)) return false
    return true
  })
  return kept.join(" ") || undefined
}

export function previewData(preview?: PreviewState) {
  return preview ? { "data-preview": preview } : {}
}

export const controlClass = cn(
  "min-h-11 min-w-11 rounded-control border border-hairline bg-surface-raised text-role-body-small text-ink",
  "transition-colors duration-base ease-standard",
  FOCUS_RING,
  "hover:border-ink-muted data-[preview=hover]:border-ink-muted data-[preview=hover]:bg-surface-sunken",
  "data-[preview=active]:bg-surface-sunken data-[preview=focus]:ring-2 data-[preview=focus]:ring-accent data-[preview=focus]:ring-offset-2 data-[preview=focus]:ring-offset-surface",
  "disabled:cursor-not-allowed disabled:opacity-60 data-[preview=disabled]:cursor-not-allowed data-[preview=disabled]:opacity-60",
  "aria-invalid:border-danger aria-invalid:bg-danger-wash data-[preview=error]:border-danger data-[preview=error]:bg-danger-wash",
  "data-[readonly=true]:border-dashed data-[readonly=true]:bg-surface-sunken data-[preview=readonly]:border-dashed data-[preview=readonly]:bg-surface-sunken",
)

export function lockClass(className: string | undefined, ...base: Array<string | undefined>) {
  return cn(...base, passthroughClass(className))
}
