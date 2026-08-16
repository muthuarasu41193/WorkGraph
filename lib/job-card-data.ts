import type { JobFeedSource, RecommendedJobCard } from "./job-dashboard";

export type JobCardData = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  workMode?: string;
  experience?: string;
  employmentType?: string;
  matchPercent?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  postedAgo?: string;
  applyUrl?: string | null;
  companyLogo?: string;
  source?: JobFeedSource;
  sourceLabel?: string;
  isEasyApply?: boolean;
  description?: string;
};

const SOURCE_LABELS: Record<JobFeedSource, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  adzuna: "Adzuna",
  usajobs: "USAJobs",
  workday: "Workday",
  smartrecruiters: "SmartRecruiters",
  ashby: "Ashby",
  jobvite: "Jobvite",
  bamboohr: "BambooHR",
  icims: "iCIMS",
  taleo: "Taleo",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  x: "X",
  remoteok: "RemoteOK",
  remotejobs: "RemoteJobs.org",
  hackernews: "Hacker News",
  jobicy: "Jobicy",
  arbeitnow: "Arbeitnow",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  levels: "Levels.fyi",
  facebook: "Facebook",
  rss: "RSS",
  workgraph: "Company Site",
  other: "Company Site",
};

const ATS_HOSTS = new Set([
  "greenhouse.io",
  "boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "jobs.ashbyhq.com",
  "jobvite.com",
  "bamboohr.com",
  "icims.com",
  "taleo.net",
]);

export function formatJobSource(source: JobFeedSource): string {
  return SOURCE_LABELS[source] ?? "Company Site";
}

export function clearbitLogoUrl(company: string, applyUrl?: string | null): string | undefined {
  try {
    if (applyUrl?.trim()) {
      const host = new URL(applyUrl).hostname.replace(/^www\./, "");
      if (host && !ATS_HOSTS.has(host) && !host.endsWith(".greenhouse.io") && !host.endsWith(".lever.co")) {
        return `https://logo.clearbit.com/${host}`;
      }
    }
  } catch {
    /* ignore invalid URLs */
  }

  const slug = company
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!slug) return undefined;
  return `https://logo.clearbit.com/${slug}.com`;
}

export { getApplyLabel, applyButtonLabel } from "./job-apply";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

export function formatSalaryChip(
  salary?: {
    minK: number;
    maxK: number;
    currency: string;
    period: "year" | "hour";
  } | null,
): string | undefined {
  if (!salary || salary.minK <= 0 || salary.maxK <= 0) return undefined;
  const symbol = CURRENCY_SYMBOLS[salary.currency] ?? `${salary.currency} `;
  const format = (value: number) =>
    salary.period === "hour" ? `${symbol}${value}` : `${symbol}${value}k`;
  const suffix = salary.period === "hour" ? "/hr" : "";
  if (salary.minK === salary.maxK) return `${format(salary.minK)}${suffix}`;
  return `${format(salary.minK)}–${format(salary.maxK)}${suffix}`;
}

function workModeFromLocation(
  mode?: "remote" | "hybrid" | "onsite" | string | null,
): string | undefined {
  if (mode === "remote") return "Remote";
  if (mode === "hybrid") return "Hybrid";
  if (mode === "onsite") return "On-site";
  return undefined;
}

export function jobCardFromMatch(job: {
  id: string;
  title: string;
  company: string;
  location: string;
  matchPercent: number;
  salaryRange?: string;
  workMode?: string;
  applyUrl?: string;
  matchedSkills?: string[];
  postedAgo?: string;
}): JobCardData {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchPercent: job.matchPercent,
    salaryRange: job.salaryRange,
    workMode: job.workMode,
    applyUrl: job.applyUrl,
    matchedSkills: job.matchedSkills,
    postedAgo: job.postedAgo,
    companyLogo: clearbitLogoUrl(job.company, job.applyUrl),
  };
}

export function recommendedJobToCardData(
  job: RecommendedJobCard,
  options: {
    matchPercent: number;
    experienceLevel?: string | null;
    primaryJobType?: string | null;
    locationMode?: "remote" | "hybrid" | "onsite" | string | null;
    salaryRange?: string | null;
    salary?: {
      minK: number;
      maxK: number;
      currency: string;
      period: "year" | "hour";
    } | null;
    isEasyApply?: boolean;
    missingSkills?: string[];
  },
): JobCardData {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchPercent: options.matchPercent,
    postedAgo: job.postedAgo,
    applyUrl: job.applyUrl,
    companyLogo: clearbitLogoUrl(job.company, job.applyUrl),
    source: job.source,
    sourceLabel: formatJobSource(job.source),
    experience: options.experienceLevel ?? undefined,
    employmentType: options.primaryJobType ?? undefined,
    workMode: workModeFromLocation(options.locationMode),
    salaryRange: options.salaryRange ?? formatSalaryChip(options.salary),
    isEasyApply: options.isEasyApply,
    description: job.description,
    matchedSkills: job.matchedSkills,
    missingSkills: options.missingSkills,
  };
}
