import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { motion } from "@/lib/motion"

const spinnerVariants = cva(motion.loading, {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-5",
      lg: "size-8",
      xl: "size-10",
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

function Spinner({
  className,
  size,
  label = "Loading",
  ...props
}: React.ComponentProps<typeof Loader2> &
  VariantProps<typeof spinnerVariants> & {
    label?: string
  }) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      data-slot="spinner"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
