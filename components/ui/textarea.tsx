import * as React from "react"

import { formFieldClasses } from "@/lib/form-field-styles"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        formFieldClasses,
        "field-sizing-content min-h-24 resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
