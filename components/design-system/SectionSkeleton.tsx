import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SectionSkeletonProps = {
  variant?: "section" | "dashboard";
  className?: string;
};

export default function SectionSkeleton({ variant = "section", className }: SectionSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-10 w-72 max-w-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading section">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
