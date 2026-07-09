import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const premiumFocus =
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none"
const premiumMotion =
  "transition-all duration-200 enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none",
    premiumMotion,
    premiumFocus,
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "border-transparent bg-red-600 text-white shadow-sm",
          "enabled:hover:bg-[var(--wg-primary-hover)] enabled:hover:shadow-md",
        ),
        secondary: cn(
          "border-gray-300 bg-white text-gray-700 shadow-none",
          "enabled:hover:border-[var(--wg-border-hover)] enabled:hover:bg-[var(--wg-bg-secondary)] enabled:hover:shadow-md",
          "dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:enabled:hover:bg-gray-800/60",
        ),
        outline:
          "border-gray-300 bg-white text-gray-700 shadow-none enabled:hover:border-[var(--wg-border-hover)] enabled:hover:bg-[var(--wg-bg-secondary)] enabled:hover:shadow-md aria-expanded:bg-[var(--wg-bg-secondary)] aria-expanded:text-gray-700 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:enabled:hover:bg-gray-800/60",
        ghost:
          "border-transparent bg-transparent text-gray-700 enabled:hover:bg-[var(--wg-bg-secondary)] enabled:hover:shadow-sm aria-expanded:bg-[var(--wg-bg-secondary)] dark:text-gray-200 dark:enabled:hover:bg-gray-800/60",
        destructive:
          "border-transparent bg-destructive/10 text-destructive enabled:hover:bg-destructive/20 enabled:hover:shadow-sm",
        link: "border-transparent bg-transparent text-red-600 shadow-none enabled:hover:scale-100 enabled:hover:underline underline-offset-4",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        premium: "h-auto gap-2 px-6 py-2.5 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
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
