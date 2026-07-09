"use client";

import {
  Brain,
  Eye,
  HeartPulse,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import InsightCard from "@/components/design-system/InsightCard";
import SectionHeader from "@/components/design-system/SectionHeader";
import { dashboardHref } from "@/lib/dashboard-routes";

type Props = {
  resumeScore?: number;
  applicationScore?: number;
  careerHealth?: number;
  recruiterVisibility?: number;
};

export default function HomeIntelligenceGrid({
  resumeScore = 78,
  applicationScore = 64,
  careerHealth = 82,
  recruiterVisibility = 71,
}: Props) {
  return (
    <section aria-labelledby="intelligence-grid-heading" className="space-y-4">
      <SectionHeader
        title="AI Career Intelligence"
        description="Your personalized insights — intelligence before listings."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InsightCard
          title="Resume Score"
          description="Excellent keyword optimization. Fix 2 high-impact gaps to reach 95%."
          icon={Brain}
          score={`${resumeScore}%`}
          badge="AI"
          variant="accent"
          action={
            <Button asChild size="sm" variant="outline" className="wg-dash-compact-btn w-full">
              <Link href={dashboardHref("resume-intelligence")}>Improve resume</Link>
            </Button>
          }
        />
        <InsightCard
          title="Application Success"
          description="Your response rate is above average. Focus on high-match roles."
          icon={Target}
          score={`${applicationScore}%`}
          badge="Score"
          action={
            <Button asChild size="sm" variant="outline" className="wg-dash-compact-btn w-full">
              <Link href={dashboardHref("applications")}>View pipeline</Link>
            </Button>
          }
        />
        <InsightCard
          title="Career Health"
          description="Strong skill alignment. 3 skill gaps identified for target roles."
          icon={HeartPulse}
          score={`${careerHealth}%`}
          badge="Trending"
          variant="success"
          action={
            <Button asChild size="sm" variant="outline" className="wg-dash-compact-btn w-full">
              <Link href={dashboardHref("workgraph-direct")}>View insights</Link>
            </Button>
          }
        />
        <InsightCard
          title="Hidden Jobs Discovery"
          description="Uncover roles from Reddit, HN, and GitHub before they hit job boards."
          icon={Sparkles}
          badge="Exclusive"
          action={
            <Button asChild size="sm" variant="outline" className="wg-dash-compact-btn w-full">
              <Link href={dashboardHref("job-discovery")}>Discover hidden jobs</Link>
            </Button>
          }
        />
        <InsightCard
          title="Recruiter Visibility"
          description="Your profile appeared in recruiter searches this week."
          icon={Eye}
          score={`${recruiterVisibility}%`}
          badge="Weekly"
        />
        <InsightCard
          title="Weekly Progress"
          description="+4 applications, 2 interviews scheduled, resume score up 6%."
          icon={TrendingUp}
          badge="This week"
        />
      </div>
    </section>
  );
}
