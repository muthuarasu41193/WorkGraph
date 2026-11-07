/**
 * Job / community source keys for brand icons.
 *
 * Prefer the schema `source` field from job rows; fall back to {@link getSourceFromUrl}
 * when the field is missing, unknown, or generic (`other` / `company` / `workgraph`).
 */
export type JobSourceIconKey =
  | "linkedin"
  | "reddit"
  | "indeed"
  | "naukri"
  | "glassdoor"
  | "x"
  | "github"
  | "google"
  | "company"
  | "other";

export const JOB_SOURCE_ICON_LABELS: Record<JobSourceIconKey, string> = {
  linkedin: "LinkedIn",
  reddit: "Reddit",
  indeed: "Indeed",
  naukri: "Naukri",
  glassdoor: "Glassdoor",
  x: "X",
  github: "GitHub",
  google: "Google",
  company: "Company site",
  other: "Other",
};

/** Official brand hex colors used when Simple Icons has no export (LinkedIn, Naukri). */
export const JOB_SOURCE_BRAND_COLORS: Record<JobSourceIconKey, string> = {
  linkedin: "#0A66C2",
  reddit: "#FF4500",
  indeed: "#003A9B",
  naukri: "#0552F0",
  glassdoor: "#00A162",
  x: "#000000",
  github: "#181717",
  google: "#4285F4",
  company: "currentColor",
  other: "currentColor",
};

const KNOWN_SCHEMA_SOURCES = new Set<string>([
  "linkedin",
  "reddit",
  "indeed",
  "naukri",
  "glassdoor",
  "x",
  "github",
  "google",
  "company",
  "other",
]);

const DOMAIN_TO_SOURCE: Array<{ match: RegExp; source: JobSourceIconKey }> = [
  { match: /(^|\.)linkedin\.com$/i, source: "linkedin" },
  { match: /(^|\.)reddit\.com$/i, source: "reddit" },
  { match: /(^|\.)indeed\.[a-z.]+$/i, source: "indeed" },
  { match: /(^|\.)naukri\.com$/i, source: "naukri" },
  { match: /(^|\.)glassdoor\.[a-z.]+$/i, source: "glassdoor" },
  { match: /(^|\.)(twitter|x)\.com$/i, source: "x" },
  { match: /(^|\.)github\.com$/i, source: "github" },
  { match: /(^|\.)google\.[a-z.]+$/i, source: "google" },
];

function parseHostname(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    try {
      return new URL(`https://${raw}`).hostname.toLowerCase().replace(/\.$/, "");
    } catch {
      return null;
    }
  }
}

/** Map a job or post URL hostname to a {@link JobSourceIconKey}. */
export function getSourceFromUrl(url?: string | null): JobSourceIconKey {
  const host = url ? parseHostname(url) : null;
  if (!host) return "other";
  for (const entry of DOMAIN_TO_SOURCE) {
    if (entry.match.test(host)) return entry.source;
  }
  return "other";
}

/**
 * Resolve the icon key: use a known schema `source` first; otherwise fall back to the URL.
 * Generic schema values (`other`, `company`, `workgraph`) also consult the URL.
 */
export function resolveJobSourceIconKey(
  source?: string | null,
  url?: string | null,
): JobSourceIconKey {
  const normalized = source?.trim().toLowerCase() ?? "";

  if (normalized === "workgraph") {
    const fromUrl = getSourceFromUrl(url);
    return fromUrl === "other" ? "company" : fromUrl;
  }

  if (KNOWN_SCHEMA_SOURCES.has(normalized)) {
    const key = normalized as JobSourceIconKey;
    if (key === "other" || key === "company") {
      const fromUrl = getSourceFromUrl(url);
      if (fromUrl !== "other") return fromUrl;
    }
    return key;
  }

  return getSourceFromUrl(url);
}
