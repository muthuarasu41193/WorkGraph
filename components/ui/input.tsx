import * as React from "react"

import { formFieldClasses } from "@/lib/form-field-styles"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        formFieldClasses,
        "h-auto file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--wg-text-secondary)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
