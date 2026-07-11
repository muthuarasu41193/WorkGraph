import type { LucideIcon, LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"
import { ICON_STROKE_WIDTH, iconClass } from "@/lib/icon-styles"

type IconSize = "inline" | "standalone"

type IconProps = Omit<LucideProps, "ref"> & {
  icon: LucideIcon
  size?: IconSize
}

function Icon({
  icon: LucideIconComp,
  size = "inline",
  className,
  strokeWidth = ICON_STROKE_WIDTH,
  ...props
}: IconProps) {
  return (
    <LucideIconComp
      className={cn(iconClass(size), className)}
      strokeWidth={strokeWidth}
      aria-hidden={props["aria-hidden"] ?? true}
      {...props}
    />
  )
}

export { Icon, ICON_STROKE_WIDTH, iconClass }
export type { IconSize }
