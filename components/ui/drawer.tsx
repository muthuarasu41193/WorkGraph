"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { X } from "lucide-react"

import { lockClass } from "@/lib/primitive"
import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close
const DrawerPortal = DrawerPrimitive.Portal

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-overlay bg-scrim/40 motion-reduce:transition-none", className)}
      {...props}
    />
  )
})

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(function DrawerContent({ className, children, ...props }, ref) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={lockClass(
          className,
          "fixed inset-x-0 bottom-0 z-modal mt-24 flex max-h-[85vh] flex-col rounded-t-overlay border border-hairline bg-surface-raised p-4 text-ink shadow-overlay",
          "duration-slow ease-standard motion-reduce:transition-none",
        )}
        {...props}
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-hairline" aria-hidden />
        {children}
        <DrawerPrimitive.Close
          className={cn(
            "absolute top-3 end-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted hover:bg-surface-sunken hover:text-ink",
          )}
          aria-label="Close"
        >
          <X className="size-4" />
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title className={lockClass(className, "text-role-subheading text-ink")} {...props} />
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={lockClass(className, "measure text-role-body-small text-ink-muted")}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
}
