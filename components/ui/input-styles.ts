import { cva, type VariantProps } from "class-variance-authority"

/** Subtle keyboard focus — thin ring, no heavy offset */
export const inputFocusRingClass =
  "outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]/20 focus-visible:ring-offset-0 focus-visible:shadow-[var(--shadow-sm)]"

export const inputInvalidClass =
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50"

export const inputDisabledClass =
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--surface-secondary)]/60 disabled:opacity-50"

export const inputVariants = cva(
  [
    "w-full min-w-0 rounded-[var(--radius-md)] border",
    "text-body text-foreground placeholder:text-muted-foreground",
    "transition-[color,background-color,border-color,box-shadow,ring] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
    inputFocusRingClass,
    inputInvalidClass,
    inputDisabledClass,
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-input bg-[var(--surface-primary)] dark:bg-input/30",
        ghost:
          "border-transparent bg-transparent shadow-none hover:bg-[var(--surface-secondary)]/50 focus-visible:bg-[var(--surface-secondary)] focus-visible:border-[var(--border-default)]",
      },
      size: {
        sm: "h-[var(--input-height-sm)] px-2.5 py-1 text-body",
        md: "h-[var(--input-height-md)] px-3 py-1.5 text-body-lg md:text-body",
        lg: "h-[var(--input-height-lg)] px-4 py-2 text-body-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
)

export const textareaVariants = cva(
  [
    "field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border",
    "px-3 py-2 text-body-lg md:text-body text-foreground placeholder:text-muted-foreground",
    "transition-[color,background-color,border-color,box-shadow,ring] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
    inputFocusRingClass,
    inputInvalidClass,
    inputDisabledClass,
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-input bg-[var(--surface-primary)] dark:bg-input/30",
        ghost:
          "border-transparent bg-transparent shadow-none resize-y focus-visible:bg-[var(--surface-secondary)] focus-visible:border-[var(--border-default)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export const searchVariants = cva(
  [
    "w-full min-w-0 border text-body text-foreground placeholder:text-muted-foreground",
    "transition-[color,background-color,border-color,box-shadow,ring] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
    inputFocusRingClass,
    inputInvalidClass,
    inputDisabledClass,
  ].join(" "),
  {
    variants: {
      shape: {
        rounded: "rounded-[var(--radius-md)]",
        pill: "rounded-full",
      },
      size: {
        sm: "h-[var(--input-height-sm)] py-1 text-body",
        md: "h-[var(--input-height-md)] py-1.5 text-body-lg md:text-body",
        lg: "h-11 py-2 text-body-lg",
      },
    },
    defaultVariants: {
      shape: "rounded",
      size: "md",
    },
  },
)

export type InputVariantProps = VariantProps<typeof inputVariants>
export type TextareaVariantProps = VariantProps<typeof textareaVariants>
export type SearchVariantProps = VariantProps<typeof searchVariants>
