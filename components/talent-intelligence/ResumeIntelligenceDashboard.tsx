"use client";

import type { ResumeIntelligenceReport } from "@/lib/talent-intelligence/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import OverallMatchScoreSection from "./sections/OverallMatchScoreSection";
import StrengthsSection from "./sections/StrengthsSection";
import MissingSkillsSection from "./sections/MissingSkillsSection";
import RecruiterExpectationsSection from "./sections/RecruiterExpectationsSection";
import ResumeImprovementsSection from "./sections/ResumeImprovementsSection";
import AchievementDiscoverySection from "./sections/AchievementDiscoverySection";
import ATSAnalysisSection from "./sections/ATSAnalysisSection";
import KeywordIntelligenceSection from "./sections/KeywordIntelligenceSection";
import RecruiterViewSection from "./sections/RecruiterViewSection";
import InterviewReadinessSection from "./sections/InterviewReadinessSection";
import CareerInsightsSection from "./sections/CareerInsightsSection";
import HonestyCheckSection from "./sections/HonestyCheckSection";

type Props = {
  report: ResumeIntelligenceReport;
  cached?: boolean;
};

export default function ResumeIntelligenceDashboard({ report, cached }: Props) {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/20 bg-primary/5">
        <Shield className={iconClass()} />
        <AlertDescription className="text-sm">
          {report.philosophyReminder}
          {cached ? " (Loaded from your saved analysis.)" : null}
        </AlertDescription>
      </Alert>

      {(report.jobTitle || report.company) && (
        <header className="rounded-xl border bg-muted/30 px-4 py-3">
          <h2 className="text-lg font-semibold">
            {report.jobTitle ?? "Role"}
            {report.company ? ` at ${report.company}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </header>
      )}

      <OverallMatchScoreSection data={report.overallMatch} />
      <StrengthsSection items={report.strengths} />
      <MissingSkillsSection data={report.missingSkills} />
      <RecruiterViewSection data={report.recruiterView} />
      <RecruiterExpectationsSection items={report.recruiterExpectations} />
      <ResumeImprovementsSection items={report.resumeImprovements} />
      <AchievementDiscoverySection items={report.achievementDiscovery} />
      <KeywordIntelligenceSection data={report.keywordIntelligence} />
      <ATSAnalysisSection data={report.atsAnalysis} />
      <InterviewReadinessSection items={report.interviewReadiness} />
      <CareerInsightsSection data={report.careerInsights} />
      <HonestyCheckSection data={report.honestyCheck} />
    </div>
  );
}
