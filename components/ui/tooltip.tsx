"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { lockClass } from "@/lib/primitive"

function TooltipProvider({
  delayDuration = 180,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentProps<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={lockClass(
          className,
          "z-tooltip max-w-xs rounded-control bg-ink px-2 py-1 text-role-caption text-surface shadow-overlay",
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
})

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
