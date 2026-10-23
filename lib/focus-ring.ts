import { cn } from "@/lib/utils"

/** Focus ring uses the accent token. 2px ring, offset by the page surface. */
export const FOCUS_RING =
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"

export const INTERACTIVE_COLORS = "transition-colors duration-base ease-standard"

export const BUTTON_PRESS =
  "transition-transform duration-fast ease-standard active:scale-[0.98] motion-reduce:active:scale-100"

export const cardHoverLift =
  "transition-colors duration-base ease-standard"

export function interactiveClass(...classNames: Array<string | undefined>) {
  return cn(INTERACTIVE_COLORS, FOCUS_RING, ...classNames)
}
