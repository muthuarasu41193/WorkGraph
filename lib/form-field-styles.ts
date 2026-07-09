import { cn } from "@/lib/utils"

/** Shared premium form control styles for inputs, textareas, and selects. */
export const formFieldClasses = cn(
  "w-full min-w-0 rounded-lg border border-[var(--wg-border)] bg-white px-4 py-2.5 font-sans text-sm font-normal",
  "transition-all duration-200 outline-none",
  "placeholder:text-[var(--wg-placeholder)]",
  "focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-[var(--wg-bg-secondary)] disabled:opacity-50",
  "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100",
  "dark:border-[var(--wg-border)] dark:bg-[var(--wg-bg)] dark:disabled:bg-[var(--wg-bg-secondary)]",
  "dark:focus-visible:border-red-400 dark:focus-visible:ring-red-500/20",
)

export const formSelectTriggerClasses = cn(
  formFieldClasses,
  "flex items-center justify-between gap-2 whitespace-nowrap",
  "data-placeholder:text-[var(--wg-placeholder)]",
)

export const formCheckboxClasses = cn(
  "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px]",
  "border border-[var(--wg-border)] bg-white transition-all duration-200 outline-none",
  "focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-checked:border-red-600 data-checked:bg-red-600 data-checked:text-white",
  "dark:border-[var(--wg-border)] dark:bg-[var(--wg-bg)]",
)
