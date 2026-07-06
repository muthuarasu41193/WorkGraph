import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { inputVariants } from "@/components/ui/input-styles"
import { cn } from "@/lib/utils"

export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        className={cn(inputVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input, inputVariants }
