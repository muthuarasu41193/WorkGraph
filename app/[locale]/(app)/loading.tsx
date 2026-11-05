import { DelayedSkeleton } from "@/components/states/DelayedSkeleton"
import { PageSkeleton } from "@/components/states/PageSkeleton"

export default function AppSegmentLoading() {
  return (
    <DelayedSkeleton label="Loading this page">
      <PageSkeleton />
    </DelayedSkeleton>
  )
}
