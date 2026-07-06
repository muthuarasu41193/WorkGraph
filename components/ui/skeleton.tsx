import { cn } from "@/lib/utils"
import { motion } from "@/lib/motion"

function Skeleton({
  className,
  shimmer = false,
  ...props
}: React.ComponentProps<"div"> & { shimmer?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        shimmer ? motion.skeletonShimmer : motion.skeleton,
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
