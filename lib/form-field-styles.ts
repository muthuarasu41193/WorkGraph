import { cn } from "@/lib/utils"

/** Shared premium form control styles for inputs, textareas, and selects. */
export const formFieldClasses = cn(
  "w-full min-w-0 rounded-md border border-border-default bg-surface px-4 py-2.5 font-sans text-sm font-normal tracking-body",
  "transition-all duration-200 ease-in-out outline-none",
  "placeholder:text-fg-tertiary",
  "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-active disabled:opacity-50",
  "aria-invalid:border-brand aria-invalid:ring-2 aria-invalid:ring-brand-100",
  "dark:border-border-default dark:bg-surface dark:disabled:bg-surface-active",
  "dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand/20",
)

export const formSelectTriggerClasses = cn(
  formFieldClasses,
  "flex items-center justify-between gap-2 whitespace-nowrap",
  "data-placeholder:text-fg-tertiary",
)

export const formCheckboxClasses = cn(
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm",
  "border border-border-default bg-surface transition-all duration-200 ease-in-out outline-none",
  "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand-100",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-checked:border-brand data-checked:bg-brand data-checked:text-white",
  "dark:border-border-default dark:bg-surface",
)
