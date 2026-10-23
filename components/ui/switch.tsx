"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass, type PreviewState } from "@/lib/primitive"

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentProps<typeof SwitchPrimitive.Root> & { preview?: PreviewState; error?: boolean }
>(function Switch({ className, preview, error, disabled, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-preview={preview}
      disabled={disabled || preview === "disabled"}
      aria-invalid={error || preview === "error" || undefined}
      aria-busy={preview === "loading" || undefined}
      className={lockClass(
        className,
        "peer wg-touch-target inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-hairline bg-surface-sunken px-0.5",
        "transition-colors duration-base ease-standard",
        FOCUS_RING,
        "hover:border-ink-muted data-[preview=hover]:border-ink-muted",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[preview=selected]:border-accent data-[preview=selected]:bg-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:bg-danger-wash data-[preview=error]:border-danger data-[preview=error]:bg-danger-wash",
        "data-[readonly=true]:border-dashed",
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cnThumb}
      />
    </SwitchPrimitive.Root>
  )
})

const cnThumb =
  "pointer-events-none block size-5 rounded-full bg-surface-raised shadow-flat transition-transform duration-fast ease-standard data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"

export { Switch }
