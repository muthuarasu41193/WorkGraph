import { redirect } from "next/navigation";
import { Suspense } from "react";
import HomeDashboard from "@/components/dashboard/home/HomeDashboard";
import HomeDashboardSkeleton from "@/components/dashboard/home/HomeDashboardSkeleton";
import { loadHomeDashboardPageProps } from "@/lib/home-dashboard-server";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const props = await loadHomeDashboardPageProps();
  if ("redirectTo" in props) redirect(props.redirectTo);

  return (
    <Suspense fallback={<HomeDashboardSkeleton />}>
      <HomeDashboard
        profile={props.profile}
        recommendedJobs={props.recommendedJobs}
        semanticJobMatches={props.semanticJobMatches}
        jobPipeline={props.jobPipeline}
        feedKind={props.feedKind}
      />
    </Suspense>
  );
}
