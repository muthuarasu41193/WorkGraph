import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import PageHero from "@/components/design-system/PageHero";
import { Button } from "@/components/ui/button";
import { dashboardHref } from "@/lib/dashboard-routes";

export default function HomeWelcomeHeader({
  greeting,
  displayName,
  newMatches,
  hiddenJobs,
  resumeScore,
  applicationScore,
  careerHealth,
}: {
  greeting: string;
  displayName: string;
  newMatches?: number;
  hiddenJobs?: number;
  resumeScore?: number;
  applicationScore?: number;
  careerHealth?: number;
}) {
  return (
    <PageHero
      greeting={`${greeting}, ${displayName}`}
      title="Let's accelerate your career."
      subtitle="WorkGraph helps you make better career decisions — discover hidden jobs, improve your resume, and apply strategically."
      metrics={[
        ...(newMatches !== undefined
          ? [{ label: "new matches", value: newMatches, accent: true }]
          : []),
        ...(hiddenJobs !== undefined
          ? [{ label: "hidden jobs", value: hiddenJobs }]
          : []),
        ...(resumeScore !== undefined
          ? [{ label: "Resume Score", value: `${resumeScore}%` }]
          : []),
        ...(applicationScore !== undefined
          ? [{ label: "App Success", value: `${applicationScore}%` }]
          : []),
        ...(careerHealth !== undefined
          ? [{ label: "Career Health", value: `${careerHealth}%` }]
          : []),
      ]}
      cta={
        <Button asChild size="default" className="gap-2">
          <Link href={dashboardHref("jobs")}>
            View Recommended Jobs
            <ArrowRight className={iconClass()} />
          </Link>
        </Button>
      }
    />
  );
}
