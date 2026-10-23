import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { Button, buttonVariants } from "@/components/ui/button"
import type { PreviewState } from "@/lib/primitive"

type IconButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    label: string
    loading?: boolean
    preview?: PreviewState
  }

/** Icon-only button. `label` is the accessible name. Colour classes in className are ignored. */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "icon", children, ...props },
  ref,
) {
  return (
    <Button ref={ref} size={size} aria-label={label} {...props}>
      {children}
    </Button>
  )
})

export { IconButton }
