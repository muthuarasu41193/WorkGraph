import { SectionSkeleton } from "@/components/landing/SectionSkeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-16 border-b border-border bg-surface/80" />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
