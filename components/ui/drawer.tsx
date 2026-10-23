"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"

import { lockClass } from "@/lib/primitive"
import { cn } from "@/lib/utils"

const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentProps<typeof DialogPrimitive.Content>
>(function DrawerContent({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-scrim/40" />
      <DialogPrimitive.Content
        ref={ref}
        className={lockClass(
          className,
          "fixed inset-x-0 bottom-0 z-modal flex max-h-[85vh] flex-col rounded-t-overlay border border-hairline bg-surface-raised p-4 text-ink shadow-overlay",
          "duration-base ease-standard",
        )}
        {...props}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" aria-hidden />
        {children}
        <DialogPrimitive.Close className={cn("absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted hover:bg-surface-sunken hover:text-ink")} aria-label="Close">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={lockClass(className, "text-role-subheading text-ink")} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={lockClass(className, "measure text-role-body-small text-ink-muted")} {...props} />
}

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription }
