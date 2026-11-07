import { JobFeedSkeleton } from "@/components/jobs/JobFeedSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function JobsLoading() {
  return (
    <main aria-busy="true" aria-label="Loading job search">
      <div className="sticky top-0 z-sticky border-b border-hairline bg-surface/95 px-3 py-3 backdrop-blur-sm motion-reduce:backdrop-blur-none">
        <Skeleton className="h-4 w-24 rounded-control" />
        <Skeleton className="mt-1 h-11 w-full rounded-control" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          <Skeleton className="h-11 w-24 shrink-0 rounded-full" />
          <Skeleton className="h-11 w-28 shrink-0 rounded-full" />
          <Skeleton className="h-11 w-32 shrink-0 rounded-full" />
        </div>
      </div>
      <JobFeedSkeleton rows={5} />
    </main>
  )
}
