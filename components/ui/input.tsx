import * as React from "react"

import { formFieldClasses } from "@/lib/form-field-styles"
import type { PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { error?: boolean; loading?: boolean; preview?: PreviewState }
>(function Input({ className, type, error, loading, preview, disabled, readOnly, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      data-preview={preview}
      {...props}
      disabled={Boolean(disabled || preview === "disabled")}
      readOnly={Boolean(readOnly || preview === "readonly")}
      aria-invalid={error || preview === "error" ? true : props["aria-invalid"]}
      aria-busy={loading || preview === "loading" ? true : undefined}
      className={cn(
        formFieldClasses,
        "h-auto file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink-muted",
        (error || preview === "error") && "border-danger bg-danger-wash",
        (loading || preview === "loading") && "cursor-progress opacity-70",
        (readOnly || preview === "readonly") && "border-dashed bg-surface-sunken",
        preview === "hover" && "border-ink-muted",
        preview === "focus" && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
        className,
      )}
    />
  )
})

export { Input }
