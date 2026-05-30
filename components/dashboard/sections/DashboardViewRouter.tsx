"use client";

import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import HiddenJobsSection from "./HiddenJobsSection";
import InterviewVaultSection from "./InterviewVaultSection";
import JobNewsSection from "./JobNewsSection";

type SectionMap = Record<DashboardRouteId, ReactNode>;

type Props = {
  sections: SectionMap;
};

function DashboardViewInner({ sections }: Props) {
  const { activeRoute } = useDashboardNavigation();
  return <div key={activeRoute}>{sections[activeRoute]}</div>;
}

export default function DashboardViewRouter(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <DashboardViewInner {...props} />
    </Suspense>
  );
}

export { HiddenJobsSection, InterviewVaultSection, JobNewsSection };
