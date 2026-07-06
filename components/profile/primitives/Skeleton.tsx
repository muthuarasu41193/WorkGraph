"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton as UiSkeleton } from "@/components/ui/skeleton";

export function Skeleton({ className = "" }: { className?: string }) {
  return <UiSkeleton className={className} />;
}

export function SkeletonCard() {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="space-y-3 p-6">
        <UiSkeleton className="h-4 w-1/3" />
        <UiSkeleton className="h-3 w-full" />
        <UiSkeleton className="h-3 w-5/6" />
        <UiSkeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
