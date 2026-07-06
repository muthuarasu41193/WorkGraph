import * as React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type IconButtonSize = "sm" | "md" | "lg"

type IconButtonProps = Omit<ButtonProps, "size" | "children"> & {
  icon: React.ReactNode
  label: string
  iconSize?: IconButtonSize
}

const iconSizeMap: Record<IconButtonSize, ButtonProps["size"]> = {
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
}

function IconButton({
  icon,
  label,
  iconSize = "md",
  className,
  size,
  loading,
  ...props
}: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      size={size ?? iconSizeMap[iconSize]}
      aria-label={label}
      loading={loading}
      className={cn(className)}
      {...props}
    >
      {!loading ? icon : null}
    </Button>
  )
}

export { IconButton }
export type { IconButtonProps }
