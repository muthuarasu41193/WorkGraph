import * as React from "react"

import { formFieldClasses } from "@/lib/form-field-styles"
import type { PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { error?: boolean; loading?: boolean; preview?: PreviewState }
>(function Textarea({ className, error, loading, preview, disabled, readOnly, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-preview={preview}
      {...props}
      disabled={Boolean(disabled || preview === "disabled")}
      readOnly={Boolean(readOnly || preview === "readonly")}
      aria-invalid={error || preview === "error" ? true : props["aria-invalid"]}
      aria-busy={loading || preview === "loading" ? true : undefined}
      className={cn(
        formFieldClasses,
        "field-sizing-content min-h-24 resize-y",
        (error || preview === "error") && "border-danger bg-danger-wash",
        (loading || preview === "loading") && "cursor-progress opacity-70",
        (readOnly || preview === "readonly") && "border-dashed bg-surface-sunken",
        className,
      )}
    />
  )
})

export { Textarea }
