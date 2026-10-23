"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass } from "@/lib/primitive"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentProps<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = "center", sideOffset = 8, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={lockClass(
          className,
          "z-overlay w-72 rounded-overlay border border-hairline bg-surface-raised p-4 text-ink shadow-overlay outline-none",
          "duration-base ease-standard",
          FOCUS_RING,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }
