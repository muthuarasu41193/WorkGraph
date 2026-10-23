import { cn } from "@/lib/utils"
import { FOCUS_RING } from "@/lib/focus-ring"

/** Shared premium form control styles for inputs, textareas, and selects. */
export const formFieldClasses = cn(
  "w-full min-w-0 rounded-md border border-border-default bg-surface px-3 py-2 font-sans text-sm font-normal tracking-body",
  "transition-colors duration-base ease-standard",
  FOCUS_RING,
  "placeholder:text-ink-subtle",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-50",
  "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger",
  "dark:border-border-default dark:bg-surface dark:disabled:bg-surface-active",
)

export const formSelectTriggerClasses = cn(
  formFieldClasses,
  "flex items-center justify-between gap-2 whitespace-nowrap",
  "data-placeholder:text-fg-tertiary",
)

export const formCheckboxClasses = cn(
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm",
  "border border-hairline bg-surface-raised transition-colors duration-base ease-standard",
  FOCUS_RING,
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger aria-invalid:bg-danger-wash",
  "data-checked:border-accent data-checked:bg-accent data-checked:text-accent-ink",
  "dark:border-border-default dark:bg-surface",
)
