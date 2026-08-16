import { cn } from "@/lib/utils"

/** Consistent keyboard focus ring — red-500, 2px, with offset. */
export const FOCUS_RING =
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"

export const INTERACTIVE_COLORS = "transition-colors duration-150 ease-out"

export const BUTTON_PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:active:scale-100"

export const cardHoverLift =
  "transition-[box-shadow,border-color,background-color] duration-150 ease-out hover:shadow-sm motion-reduce:hover:shadow-none"

export function interactiveClass(...classNames: Array<string | undefined>) {
  return cn(INTERACTIVE_COLORS, FOCUS_RING, ...classNames)
}
