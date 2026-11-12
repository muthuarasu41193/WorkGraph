import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Matches the virtual row height used by the jobs feed list. */
export const JOB_FEED_ROW_HEIGHT = 420

export function JobFeedSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div
      className={cn("space-y-2 p-2", className)}
      aria-busy="true"
      aria-label="Loading roles"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-card border border-hairline bg-surface-raised p-3"
          style={{ minHeight: JOB_FEED_ROW_HEIGHT - 16 }}
        >
          <Skeleton className="h-5 w-2/3 rounded-control" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-control" />
          <Skeleton className="mt-2 h-3 w-1/2 rounded-control" />
          <Skeleton className="mt-4 h-3 w-2/5 rounded-control" />
          <Skeleton className="mt-2 h-3 w-1/2 rounded-control" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-control" />
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-11 w-20 rounded-control" />
            <Skeleton className="h-11 w-24 rounded-control" />
            <Skeleton className="h-11 flex-1 rounded-control" />
          </div>
        </div>
      ))}
    </div>
  )
}
