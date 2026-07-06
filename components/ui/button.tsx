import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-[var(--radius-md)] border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none outline-none",
    "transition-[color,background-color,border-color,box-shadow,transform]",
    "duration-[var(--duration-fast)] ease-[var(--ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset-color)]",
    "disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]",
    "aria-disabled:pointer-events-none aria-disabled:opacity-[var(--opacity-disabled)]",
    "data-[loading=true]:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-sm)]",
          "hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]",
          "active:bg-[var(--accent-pressed)] active:shadow-none active:translate-y-px",
        ].join(" "),
        secondary: [
          "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]",
          "hover:border-[var(--border-strong)] hover:bg-[var(--interactive-hover)]",
          "active:border-[var(--border-strong)] active:bg-[var(--interactive-pressed)] active:translate-y-px",
          "aria-expanded:bg-[var(--interactive-hover)] aria-expanded:text-[var(--text-primary)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--text-primary)]",
          "hover:bg-[var(--interactive-hover)] hover:text-[var(--interactive-hover-foreground)]",
          "active:bg-[var(--interactive-pressed)] active:translate-y-px",
          "aria-expanded:bg-[var(--interactive-hover)] aria-expanded:text-[var(--text-primary)]",
        ].join(" "),
        danger: [
          "bg-[var(--danger)] text-[var(--text-on-accent)] shadow-[var(--shadow-sm)]",
          "hover:bg-[var(--danger-hover)] hover:shadow-[var(--shadow-md)]",
          "active:bg-[var(--danger-pressed)] active:shadow-none active:translate-y-px",
          "focus-visible:ring-[var(--danger)]",
        ].join(" "),
        success: [
          "bg-[var(--success)] text-[var(--text-on-accent)] shadow-[var(--shadow-sm)]",
          "hover:bg-[var(--success-hover)] hover:shadow-[var(--shadow-md)]",
          "active:bg-[var(--success-pressed)] active:shadow-none active:translate-y-px",
          "focus-visible:ring-[var(--success)]",
        ].join(" "),
        link: [
          "h-auto min-h-0 border-transparent bg-transparent p-0 text-[var(--accent)] shadow-none",
          "underline-offset-4 hover:underline",
          "active:text-[var(--accent-pressed)] active:translate-y-0",
          "focus-visible:ring-offset-1",
        ].join(" "),
      },
      size: {
        sm: [
          "h-[var(--button-height-sm)] gap-1.5 px-3 text-small",
          "has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
          "[&_svg:not([class*='size-'])]:size-3.5",
        ].join(" "),
        md: [
          "h-[var(--button-height-md)] gap-2 px-4 text-body",
          "has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
          "[&_svg:not([class*='size-'])]:size-4",
        ].join(" "),
        lg: [
          "h-[var(--button-height-lg)] gap-2 px-5 text-body-lg",
          "has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
          "[&_svg:not([class*='size-'])]:size-4",
        ].join(" "),
        icon: "size-[var(--button-height-md)] p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm":
          "size-[var(--button-height-sm)] p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg":
          "size-[var(--button-height-lg)] p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        size: ["sm", "md", "lg"],
        class: "h-auto min-h-0 px-0",
      },
      {
        variant: "link",
        size: ["icon", "icon-sm", "icon-lg"],
        class: "size-auto p-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

/** @deprecated Use primary, secondary, danger, etc. */
const VARIANT_ALIASES = {
  default: "primary",
  outline: "secondary",
  destructive: "danger",
} as const

/** @deprecated Use sm, md, lg */
const SIZE_ALIASES = {
  default: "md",
  xs: "sm",
  "icon-xs": "icon-sm",
  "icon-md": "icon",
} as const

type CanonicalVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>
type CanonicalSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>

type LegacyVariant = CanonicalVariant | keyof typeof VARIANT_ALIASES
type LegacySize = CanonicalSize | keyof typeof SIZE_ALIASES

function normalizeVariant(variant: LegacyVariant | null | undefined): CanonicalVariant {
  if (!variant) return "primary"
  if (variant in VARIANT_ALIASES) {
    return VARIANT_ALIASES[variant as keyof typeof VARIANT_ALIASES]
  }
  return variant as CanonicalVariant
}

function normalizeSize(size: LegacySize | null | undefined): CanonicalSize {
  if (!size) return "md"
  if (size in SIZE_ALIASES) {
    return SIZE_ALIASES[size as keyof typeof SIZE_ALIASES]
  }
  return size as CanonicalSize
}

type ButtonProps = Omit<React.ComponentProps<"button">, "size"> &
  Omit<VariantProps<typeof buttonVariants>, "variant" | "size"> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
    variant?: LegacyVariant
    size?: LegacySize
  }

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  const isDisabled = disabled || loading
  const resolvedVariant = normalizeVariant(variant)
  const resolvedSize = normalizeSize(size)

  const spinnerSize =
    resolvedSize === "lg" || resolvedSize === "icon-lg"
      ? "md"
      : resolvedSize === "sm" || resolvedSize === "icon-sm"
        ? "xs"
        : "sm"

  return (
    <Comp
      data-slot="button"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-loading={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={spinnerSize} className="shrink-0" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants, normalizeVariant, normalizeSize }
export type { ButtonProps, CanonicalVariant as ButtonVariant, CanonicalSize as ButtonSize, LegacyVariant, LegacySize }
