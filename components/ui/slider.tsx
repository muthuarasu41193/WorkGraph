"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

type SliderProps = Omit<React.ComponentProps<typeof SliderPrimitive.Root>, "value" | "defaultValue" | "onValueChange"> & {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  preview?: PreviewState
  error?: boolean
  readOnly?: boolean
}

const Slider = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(function Slider(
  { className, value, defaultValue, onValueChange, preview, error, readOnly, disabled, min = 0, max = 100, ...props },
  ref,
) {
  const current = value ?? defaultValue ?? [min]
  return (
    <SliderPrimitive.Root
      ref={ref}
      min={min}
      max={max}
      value={value}
      defaultValue={defaultValue}
      onValueChange={readOnly || preview === "readonly" ? undefined : onValueChange}
      disabled={disabled || preview === "disabled"}
      data-preview={preview}
      data-readonly={readOnly || preview === "readonly" ? "true" : undefined}
      aria-invalid={error || preview === "error" || undefined}
      aria-busy={preview === "loading" || undefined}
      className={lockClass(
        className,
        "relative flex w-full touch-none items-center py-3 select-none",
        "data-disabled:opacity-50 data-[preview=disabled]:opacity-50",
        "data-[readonly=true]:opacity-80",
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-sunken">
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full bg-accent data-[preview=error]:bg-danger",
            (error || preview === "error") && "bg-danger",
            preview === "loading" && "opacity-40",
          )}
        />
      </SliderPrimitive.Track>
      {current.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={current.length > 1 ? (index === 0 ? "Minimum" : "Maximum") : "Value"}
          className={cn(
            "block size-11 rounded-full border border-hairline bg-surface-raised shadow-flat",
            "transition-colors duration-base ease-standard",
            FOCUS_RING,
            "hover:border-ink data-[preview=hover]:border-ink data-[preview=active]:bg-surface-sunken",
            "data-[preview=focus]:ring-2 data-[preview=focus]:ring-accent",
            "disabled:pointer-events-none",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
})

type RangeSliderProps = Omit<SliderProps, "value" | "defaultValue" | "onValueChange"> & {
  value?: [number, number]
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
}

const RangeSlider = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, RangeSliderProps>(
  function RangeSlider({ value, defaultValue = [20, 80], onValueChange, ...props }, ref) {
    return (
      <Slider
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next) => onValueChange([next[0] ?? 0, next[1] ?? 0]) : undefined}
        {...props}
      />
    )
  },
)

export { Slider, RangeSlider }
