import * as React from "react"

import { Button, type buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type IconButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    icon: React.ReactNode
    label: string
    iconSize?: "xs" | "sm" | "default" | "lg"
  }

const iconSizeMap = {
  xs: "icon-xs",
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
} as const

function IconButton({
  icon,
  label,
  iconSize = "default",
  className,
  size,
  ...props
}: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      size={size ?? iconSizeMap[iconSize]}
      aria-label={label}
      className={cn(className)}
      {...props}
    >
      {icon}
    </Button>
  )
}

export { IconButton }
