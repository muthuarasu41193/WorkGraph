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

/** Sources that are the employer's own careers site, not a job board. */
const EMPLOYER_SITE_SOURCES = new Set(["company", "workgraph"]);

const UNKNOWN_SOURCES = new Set(["", "other"]);

const HOST_PREFIX = /^(?:www|jobs|boards|careers|apply|job-boards)\./;

function titleCaseSource(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Hostname with a leading www/jobs/boards/careers label removed. Null when the URL has no host. */
export function applyHostName(applyUrl?: string | null): string | null {
  const raw = applyUrl?.trim();
  if (!raw) return null;
  let hostname = "";
  try {
    hostname = new URL(raw).hostname;
  } catch {
    try {
      hostname = new URL(`https://${raw}`).hostname;
    } catch {
      return null;
    }
  }
  hostname = hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) return null;
  let guard = 0;
  while (HOST_PREFIX.test(hostname) && hostname.includes(".") && guard < 3) {
    hostname = hostname.replace(HOST_PREFIX, "");
    guard += 1;
  }
  return hostname || null;
}

function employerName(company?: string | null): string | null {
  const name = company?.trim();
  if (!name || name.toLowerCase() === "company") return null;
  return name;
}

/**
 * Name used in both "via {source}" and "Apply on {source}".
 * A known board keeps its board name. An employer careers site uses the employer.
 * An unknown source uses the apply URL hostname, for example greenhouse.io.
 */
export function jobSourceName(
  source?: JobFeedSource | string | null,
  company?: string | null,
  applyUrl?: string | null,
): string {
  const key = String(source ?? "").trim().toLowerCase();
  if (SOURCE_NAMES[key]) return SOURCE_NAMES[key];
  if (EMPLOYER_SITE_SOURCES.has(key)) {
    return employerName(company) ?? applyHostName(applyUrl) ?? "the listing";
  }
  if (!UNKNOWN_SOURCES.has(key)) return titleCaseSource(key);
  return applyHostName(applyUrl) ?? "the listing";
}

export function getApplyLabel(
  source?: JobFeedSource | string | null,
  company?: string | null,
  applyUrl?: string | null,
): string {
  return `Apply on ${jobSourceName(source, company, applyUrl)}`;
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
