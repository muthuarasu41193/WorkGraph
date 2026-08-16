import { cn } from "@/lib/utils"
import { FOCUS_RING } from "@/lib/focus-ring"

/** Shared premium form control styles for inputs, textareas, and selects. */
export const formFieldClasses = cn(
  "w-full min-w-0 rounded-md border border-border-default bg-surface px-4 py-2.5 font-sans text-sm font-normal tracking-body",
  "transition-colors duration-150 ease-out",
  FOCUS_RING,
  "placeholder:text-fg-tertiary",
  "disabled:cursor-not-allowed disabled:bg-surface-active disabled:opacity-50",
  "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500",
  "dark:border-border-default dark:bg-surface dark:disabled:bg-surface-active",
)

export const formSelectTriggerClasses = cn(
  formFieldClasses,
  "flex items-center justify-between gap-2 whitespace-nowrap",
  "data-placeholder:text-fg-tertiary",
)

export const formCheckboxClasses = cn(
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm",
  "border border-border-default bg-surface transition-colors duration-150 ease-out",
  FOCUS_RING,
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-checked:border-brand data-checked:bg-brand data-checked:text-white",
  "dark:border-border-default dark:bg-surface",
)
