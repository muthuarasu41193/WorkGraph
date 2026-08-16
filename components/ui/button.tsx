import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { WG_ICON } from "@/lib/icon-styles"

const premiumFocus =
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand focus-visible:outline-none"
const premiumMotion =
  "transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-sm font-medium tracking-body whitespace-nowrap outline-none select-none",
    premiumMotion,
    premiumFocus,
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    WG_ICON.childInline,
  ),
  {
    variants: {
      variant: {
        default: cn(
          "border-transparent bg-brand text-white shadow-brand",
          "enabled:hover:bg-brand-700 enabled:hover:shadow-md",
        ),
        secondary: cn(
          "border-border-default bg-surface text-fg-secondary shadow-none",
          "enabled:hover:border-border-strong enabled:hover:bg-surface-hover enabled:hover:shadow-sm",
          "dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:enabled:hover:bg-slate-800/60",
        ),
        outline:
          "border-border-default bg-surface text-fg-secondary shadow-none enabled:hover:border-border-strong enabled:hover:bg-surface-hover enabled:hover:shadow-sm aria-expanded:bg-surface-active aria-expanded:text-fg-secondary dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:enabled:hover:bg-slate-800/60",
        ghost:
          "border-transparent bg-transparent text-fg-secondary enabled:hover:bg-surface-hover enabled:hover:shadow-xs aria-expanded:bg-surface-active dark:text-slate-200 dark:enabled:hover:bg-slate-800/60",
        destructive:
          "border-transparent bg-destructive/10 text-destructive enabled:hover:bg-destructive/20 enabled:hover:shadow-sm",
        link: "border-transparent bg-transparent text-brand shadow-none transition-all duration-200 ease-in-out enabled:hover:scale-100 enabled:hover:underline underline-offset-4",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        premium: "h-auto gap-2 px-4 py-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
