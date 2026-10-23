"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"

import { FOCUS_RING } from "@/lib/focus-ring"
import { lockClass, type PreviewState } from "@/lib/primitive"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentProps<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={lockClass(className, "border-b border-hairline")}
      {...props}
    />
  )
})

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentProps<typeof AccordionPrimitive.Trigger> & { preview?: PreviewState }
>(function AccordionTrigger({ className, children, preview, disabled, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        disabled={disabled || preview === "disabled"}
        data-preview={preview}
        aria-invalid={preview === "error" || undefined}
        className={lockClass(
          className,
          "group flex min-h-11 flex-1 items-center justify-between gap-2 py-3 text-left text-role-subheading text-ink",
          "data-[state=open]:[&_svg]:rotate-180",
          "transition-colors duration-base ease-standard",
          FOCUS_RING,
          "hover:text-accent data-[preview=hover]:text-accent",
          "data-[state=open]:text-accent data-[preview=selected]:text-accent",
          "disabled:cursor-not-allowed disabled:text-ink-subtle disabled:opacity-60",
          "aria-invalid:text-danger data-[preview=error]:text-danger",
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 transition-transform duration-base ease-standard group-data-[state=open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentProps<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-role-body text-ink-muted"
      {...props}
    >
      <div className={lockClass(className, "measure pb-4")}>{children}</div>
    </AccordionPrimitive.Content>
  )
})

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
