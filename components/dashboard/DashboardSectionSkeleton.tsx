import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading section">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
