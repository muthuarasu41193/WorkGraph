import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { textareaVariants } from "@/components/ui/input-styles"
import { cn } from "@/lib/utils"

export type TextareaProps = React.ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        data-variant={variant ?? "default"}
        className={cn(textareaVariants({ variant }), className)}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
