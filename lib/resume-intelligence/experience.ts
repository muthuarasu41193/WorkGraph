import { LIMITS } from "@/lib/validation/primitives";

import { evidenceConfidence, roundConfidence } from "./text";

export type NormalizedExperience = {
  title: string;
  company: string;
  duration: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  confidence: number;
};

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const RANGE_RE =
  /((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?((?:19|20)\d{2})\s*(?:[-–—to]+)\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?((?:19|20)\d{2}|present|current|now)/i;

function toIsoMonth(monthRaw: string | undefined, year: string): string {
  const month = monthRaw ? MONTHS[monthRaw.trim().replace(/\./g, "").toLowerCase()] ?? "01" : "01";
  return `${year}-${month}`;
}

export function parseDurationRange(duration: string): {
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
} {
  const text = duration.trim();
  if (!text) return { start_date: null, end_date: null, is_current: false };

  const present = /\b(present|current|now)\b/i.test(text);
  const match = text.match(RANGE_RE);
  if (match) {
    const start = toIsoMonth(match[1], match[2]);
    const endIsPresent = /present|current|now/i.test(match[4] ?? "");
    const end = endIsPresent ? null : toIsoMonth(match[3], match[4]);
    return { start_date: start, end_date: end, is_current: present || endIsPresent };
  }

  const years = text.match(/(?:19|20)\d{2}/g);
  if (years && years.length >= 2) {
    return {
      start_date: `${years[0]}-01`,
      end_date: present ? null : `${years[1]}-01`,
      is_current: present,
    };
  }
  if (years && years.length === 1) {
    return { start_date: `${years[0]}-01`, end_date: present ? null : `${years[0]}-01`, is_current: present };
  }
  return { start_date: null, end_date: null, is_current: present };
}

function yearsBetween(start: string | null, end: string | null, isCurrent: boolean): number {
  if (!start) return 0;
  const startDate = new Date(`${start}-01T00:00:00Z`);
  const endDate = isCurrent || !end ? new Date() : new Date(`${end}-01T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth());
  return Math.max(0, Math.round(months / 12));
}

export function computeYearsFromExperience(items: NormalizedExperience[]): number {
  let total = 0;
  for (const item of items) {
    total += yearsBetween(item.start_date, item.end_date, item.is_current);
  }
  return Math.min(LIMITS.years, total);
}

function asExperienceRaw(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

export function normalizeExperience(raw: unknown, sourceLower: string): NormalizedExperience[] {
  const out: NormalizedExperience[] = [];
  for (const item of asExperienceRaw(raw)) {
    const title = typeof item.title === "string" ? item.title.trim().slice(0, LIMITS.jobTitle) : "";
    const company = typeof item.company === "string" ? item.company.trim().slice(0, LIMITS.company) : "";
    const duration = typeof item.duration === "string" ? item.duration.trim().slice(0, LIMITS.duration) : "";
    const description =
      typeof item.description === "string" ? item.description.trim().slice(0, LIMITS.description) : "";
    if (!title && !company) continue;

    const titleConf = title ? evidenceConfidence(sourceLower, title) : 0.6;
    const companyConf = company ? evidenceConfidence(sourceLower, company) : 0.6;
    if (title && titleConf == null) continue;
    if (company && companyConf == null) continue;

    const parsed = parseDurationRange(duration);
    const durationGrounded = !duration || evidenceConfidence(sourceLower, duration) != null;
    const confidence = roundConfidence(
      Math.min(titleConf ?? 0.6, companyConf ?? 0.6, durationGrounded ? 0.97 : 0.7),
    );

    out.push({
      title,
      company,
      duration: durationGrounded ? duration : "",
      description: description && evidenceConfidence(sourceLower, description.slice(0, 40)) != null ? description : "",
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      is_current: parsed.is_current,
      confidence,
    });
    if (out.length >= LIMITS.experienceItems) break;
  }
  return out;
}
