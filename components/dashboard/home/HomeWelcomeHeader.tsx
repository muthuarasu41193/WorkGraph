import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import PageHero from "@/components/design-system/PageHero";
import { Button } from "@/components/ui/button";
import { dashboardHref } from "@/lib/dashboard-routes";

export default function HomeWelcomeHeader({
  greeting,
  displayName,
}: {
  greeting: string;
  displayName: string;
}) {
  return (
    <PageHero
      greeting={`${greeting}, ${displayName}`}
      title="Let's accelerate your career."
      subtitle="WorkGraph helps you make better career decisions — discover hidden jobs, improve your resume, and apply strategically."
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
