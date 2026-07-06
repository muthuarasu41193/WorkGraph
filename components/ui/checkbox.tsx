"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { inputFocusRingClass } from "@/components/ui/input-styles"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-[var(--border-strong)] bg-[var(--surface-primary)]",
        "transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        inputFocusRingClass,
        "group-has-disabled/field:opacity-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        "data-[state=checked]:border-[var(--text-primary)] data-[state=checked]:bg-[var(--text-primary)] data-[state=checked]:text-[var(--surface-primary)]",
        "data-[state=indeterminate]:border-[var(--text-primary)] data-[state=indeterminate]:bg-[var(--text-primary)] data-[state=indeterminate]:text-[var(--surface-primary)]",
        "dark:border-[var(--border-strong)] dark:bg-[var(--surface-secondary)] dark:data-[state=checked]:border-[var(--text-primary)] dark:data-[state=checked]:bg-[var(--text-primary)]",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-3"
      >
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
