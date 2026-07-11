import { cn } from "@/lib/utils"

/** Standard stroke width for Lucide line icons */
export const ICON_STROKE_WIDTH = 2 as const

const childSvgBase =
  "[&_svg.lucide]:pointer-events-none [&_svg.lucide]:shrink-0 [&_svg.lucide]:text-inherit [&_svg.lucide]:stroke-[length:var(--wg-icon-stroke)]"

const childSvgInline =
  `${childSvgBase} [&_svg.lucide:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-5`

const childSvgStandalone =
  `${childSvgBase} [&_svg.lucide:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-6`

export const WG_ICON = {
  /** 20px — inline with text, buttons, nav */
  inline: "wg-icon wg-icon--inline size-5",
  /** 24px — tiles, empty states, feature headers */
  standalone: "wg-icon wg-icon--standalone size-6",
  stroke: ICON_STROKE_WIDTH,
  /** Parent: child Lucide SVGs default to inline size and inherit color */
  childInline: childSvgInline,
  /** Parent: child Lucide SVGs default to standalone size */
  childStandalone: childSvgStandalone,
} as const

export function iconClass(
  size: "inline" | "standalone" = "inline",
  className?: string,
) {
  return cn(size === "inline" ? WG_ICON.inline : WG_ICON.standalone, className)
}
