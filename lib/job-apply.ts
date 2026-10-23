import type { JobFeedSource } from "./job-dashboard";

const SOURCE_NAMES: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  workday: "Workday",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  jobvite: "Jobvite",
  bamboohr: "BambooHR",
  icims: "iCIMS",
  taleo: "Taleo",
  glassdoor: "Glassdoor",
  usajobs: "USAJobs",
  adzuna: "Adzuna",
  remoteok: "RemoteOK",
  remotejobs: "RemoteJobs.org",
  hackernews: "Hacker News",
  jobicy: "Jobicy",
  arbeitnow: "Arbeitnow",
  reddit: "Reddit",
  x: "X",
  rss: "RSS",
  levels: "Levels.fyi",
  facebook: "Facebook",
};

const EMPLOYER_SOURCES = new Set(["", "company", "workgraph", "other"]);

/** Name used in "via {source}" and "Apply on {source}". */
export function jobSourceName(source?: JobFeedSource | string | null, company?: string | null): string {
  const key = String(source ?? "").trim().toLowerCase();
  if (EMPLOYER_SOURCES.has(key)) {
    return company?.trim() || "the employer";
  }
  return SOURCE_NAMES[key] ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getApplyLabel(source?: JobFeedSource | string | null, company?: string | null): string {
  return `Apply on ${jobSourceName(source, company)}`;
}

/** @deprecated Use getApplyLabel — external apply only, no Easy Apply. */
export function applyButtonLabel(
  source?: JobFeedSource,
  companyOrLegacyFlag?: string | boolean | null,
  _isEasyApply?: boolean,
): string {
  const company = typeof companyOrLegacyFlag === "string" ? companyOrLegacyFlag : null;
  return getApplyLabel(source, company);
}
