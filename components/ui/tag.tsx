import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-caption font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-secondary text-foreground",
        accent: "border-[var(--accent)]/20 bg-[var(--accent-subtle)] text-[var(--accent)]",
        success: "border-success/20 bg-success-subtle text-success-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type TagProps = React.ComponentProps<"span"> &
  VariantProps<typeof tagVariants> & {
    onRemove?: () => void
    removeLabel?: string
  }

function Tag({
  className,
  variant,
  children,
  onRemove,
  removeLabel = "Remove",
  ...props
}: TagProps) {
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ variant }), className)}
      {...props}
    >
      {children}
      {onRemove ? (
        <IconButton
          type="button"
          variant="ghost"
          iconSize="sm"
          onClick={onRemove}
          label={removeLabel}
          className="size-5 min-h-0 opacity-70 hover:opacity-100"
          icon={<X className="size-3" aria-hidden />}
        />
      ) : null}
    </span>
  )
}

export { Tag, tagVariants }
