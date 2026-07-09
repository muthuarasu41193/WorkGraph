import type { JobFeedSource } from "./job-dashboard";

const PLATFORM_LABELS: Record<string, string> = {
  greenhouse: "Apply on Greenhouse",
  lever: "Apply on Lever",
  linkedin: "Apply on LinkedIn",
  indeed: "Apply on Indeed",
  workday: "Apply on Workday",
  ashby: "Apply on Ashby",
  smartrecruiters: "Apply on SmartRecruiters",
  jobvite: "Apply on Jobvite",
  bamboohr: "Apply on BambooHR",
  icims: "Apply on iCIMS",
  taleo: "Apply on Taleo",
  glassdoor: "Apply on Glassdoor",
  usajobs: "Apply on USAJobs",
  adzuna: "Apply on Adzuna",
  company: "Apply on Company Site",
  workgraph: "Apply on Company Site",
  other: "Apply on Company Site",
  default: "Apply Now",
};

export function getApplyLabel(source?: JobFeedSource | string | null): string {
  if (!source) return PLATFORM_LABELS.company;
  const key = String(source).toLowerCase();
  return PLATFORM_LABELS[key] ?? PLATFORM_LABELS.default;
}

/** @deprecated Use getApplyLabel — external apply only, no Easy Apply. */
export function applyButtonLabel(source?: JobFeedSource, _isEasyApply?: boolean): string {
  return getApplyLabel(source);
}
