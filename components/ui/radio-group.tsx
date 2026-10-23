"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass, type PreviewState } from "@/lib/primitive"

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentProps<typeof RadioGroupPrimitive.Root> & { preview?: PreviewState }
>(function RadioGroup({ className, preview, disabled, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-preview={preview}
      disabled={disabled || preview === "disabled"}
      aria-invalid={preview === "error" || undefined}
      className={lockClass(className, "grid gap-2", preview === "error" ? "rounded-control bg-danger-wash p-2" : undefined)}
      {...props}
    />
  )
})

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentProps<typeof RadioGroupPrimitive.Item> & { preview?: PreviewState }
>(function RadioGroupItem({ className, preview, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-preview={preview}
      className={lockClass(
        className,
        "wg-touch-target aspect-square size-5 rounded-full border border-hairline bg-surface-raised text-accent",
        "transition-colors duration-base ease-standard",
        FOCUS_RING,
        "hover:border-ink data-[preview=hover]:border-ink",
        "data-[preview=active]:bg-surface-sunken data-[preview=focus]:ring-2 data-[preview=focus]:ring-accent",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent-wash data-[preview=selected]:border-accent data-[preview=selected]:bg-accent-wash",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block size-2.5 rounded-full bg-accent" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})

export { RadioGroup, RadioGroupItem }
