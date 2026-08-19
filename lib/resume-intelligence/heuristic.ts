import { LIMITS } from "@/lib/validation/primitives";

import { SKILL_CANONICAL, canonicalizeSkillName } from "./skills";
import type { ConfidentValue } from "./schema";
import { evidenceConfidence, firstNonEmptyLine, roundConfidence, textIncludesTerm } from "./text";

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /^(professional\s+)?summary$|^profile$|^about( me)?$/i,
  skills: /^(technical\s+)?skills?$|^technologies$|^tech stack$/i,
  experience: /^(work\s+)?experience$|^employment( history)?$|^professional experience$/i,
  education: /^education$|^academics?$/i,
  projects: /^projects?$|^selected projects$/i,
  achievements: /^(key\s+)?achievements$|^awards$|^highlights$/i,
  certifications: /^certifications?$|^licenses?$/i,
};

const INDUSTRY_TERMS: Array<{ key: string; display: string }> = [
  { key: "fintech", display: "Fintech" },
  { key: "healthcare", display: "Healthcare" },
  { key: "education", display: "Education" },
  { key: "retail", display: "Retail" },
  { key: "manufacturing", display: "Manufacturing" },
  { key: "consulting", display: "Consulting" },
  { key: "telecommunications", display: "Telecommunications" },
  { key: "logistics", display: "Logistics" },
  { key: "aerospace", display: "Aerospace" },
  { key: "hospitality", display: "Hospitality" },
  { key: "e-commerce", display: "E-commerce" },
  { key: "ecommerce", display: "E-commerce" },
  { key: "nonprofit", display: "Nonprofit" },
  { key: "media", display: "Media" },
  { key: "energy", display: "Energy" },
  { key: "real estate", display: "Real Estate" },
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-_%]+\/?/i;
const GITHUB_RE = /https?:\/\/(?:www\.)?github\.com\/[\w\-]+\/?/i;
const URL_RE = /https?:\/\/[^\s)>\]]+/i;

function collectSection(text: string, header: RegExp): string {
  const lines = text.split("\n");
  const items: string[] = [];
  let capturing = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (capturing && items.length > 0) {
        // keep blank as separator within section
      }
      continue;
    }
    const isHeader = Object.values(SECTION_HEADERS).some((re) => re.test(trimmed));
    if (header.test(trimmed) && trimmed.length < 80) {
      capturing = true;
      const after = trimmed.split(/[:–-]/).slice(1).join(":").trim();
      if (after) items.push(after);
      continue;
    }
    if (capturing && isHeader) break;
    if (capturing) items.push(trimmed);
  }
  return items.join("\n");
}

function splitList(text: string): string[] {
  return text
    .split(/[,;|•·\n]/)
    .map((item) => item.replace(/^[\s\-*•]+/, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 120);
}

export type HeuristicExtract = {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string;
  summary: string | null;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  work_experience: Array<{ title: string; company: string; duration: string; description: string }>;
  certifications: string[];
  projects: Array<{ name: string; description: string }>;
  achievements: string[];
  industries: string[];
  target_roles: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  employment_notes: string[];
};

function extractName(text: string, email: string | null): string {
  const first = firstNonEmptyLine(text);
  if (!first || first.length > 80) return "";
  if (EMAIL_RE.test(first) || URL_RE.test(first)) return "";
  if (/^(resume|curriculum vitae|cv)\b/i.test(first)) return "";
  if (email && first.toLowerCase().includes(email.toLowerCase())) return "";
  if (first.split(/\s+/).length >= 2 && first.split(/\s+/).length <= 5) return first;
  return "";
}

function extractExperience(text: string): HeuristicExtract["work_experience"] {
  const section = collectSection(text, SECTION_HEADERS.experience);
  if (!section) return [];
  const blocks = section.split(/\n(?=[A-Z])/).slice(0, LIMITS.experienceItems);
  const out: HeuristicExtract["work_experience"] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines[0]) continue;
    const header = lines[0];
    let title = header;
    let company = "";
    const at = header.split(/\s+at\s+|,\s+/i);
    if (at.length >= 2) {
      title = at[0].trim();
      company = at.slice(1).join(" ").trim();
    }
    const durationLine =
      lines.find((line) => /(?:19|20)\d{2}|present|current/i.test(line) && line.length < 80) ?? "";
    out.push({
      title: title.slice(0, LIMITS.jobTitle),
      company: company.slice(0, LIMITS.company),
      duration: durationLine.slice(0, LIMITS.duration),
      description: lines.slice(1).filter((l) => l !== durationLine).join(" ").slice(0, LIMITS.description),
    });
  }
  return out;
}

function extractEducation(text: string): HeuristicExtract["education"] {
  const section = collectSection(text, SECTION_HEADERS.education);
  if (!section) return [];
  const out: HeuristicExtract["education"] = [];
  for (const line of section.split("\n")) {
    const trimmed = line.replace(/^[\s\-*•]+/, "").trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/,\s*/);
    out.push({
      degree: (parts[0] ?? "").slice(0, LIMITS.jobTitle),
      institution: (parts[1] ?? "").slice(0, LIMITS.company),
      year: (trimmed.match(/(?:19|20)\d{2}/)?.[0] ?? "").slice(0, LIMITS.duration),
    });
    if (out.length >= LIMITS.educationItems) break;
  }
  return out;
}

function extractProjects(text: string): HeuristicExtract["projects"] {
  const section = collectSection(text, SECTION_HEADERS.projects);
  if (!section) return [];
  return section
    .split("\n")
    .map((line) => line.replace(/^[\s\-*•]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const [name, ...rest] = line.split(/\s+[—–-]\s+/);
      return {
        name: (name ?? line).slice(0, LIMITS.jobTitle),
        description: rest.join(" - ").slice(0, LIMITS.description),
      };
    });
}

export function extractFromResumeText(text: string): HeuristicExtract {
  const email = text.match(EMAIL_RE)?.[0] ?? null;
  const linkedin = text.match(LINKEDIN_RE)?.[0] ?? null;
  const github = text.match(GITHUB_RE)?.[0] ?? null;
  const websiteMatch = text.match(URL_RE);
  const website =
    websiteMatch &&
    !LINKEDIN_RE.test(websiteMatch[0]) &&
    !GITHUB_RE.test(websiteMatch[0])
      ? websiteMatch[0]
      : null;

  const locationLine =
    text.split("\n").find((line) => /\b[A-Z][a-zA-Z]+,\s*[A-Z]{2}\b/.test(line) && line.length < 80) ?? "";
  const location = locationLine.match(/\b[A-Z][a-zA-Z]+,\s*[A-Z]{2}\b/)?.[0] ?? null;

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch && !email?.includes(phoneMatch[0]) ? phoneMatch[0] : null;

  const skillsSection = collectSection(text, SECTION_HEADERS.skills);
  const skills: string[] = [];
  const seen = new Set<string>();
  for (const token of splitList(skillsSection)) {
    const canon = canonicalizeSkillName(token);
    if (!canon || seen.has(canon.canonical)) continue;
    seen.add(canon.canonical);
    skills.push(canon.display);
  }
  const lower = text.toLowerCase();
  for (const [alias, display] of Object.entries(SKILL_CANONICAL)) {
    if (textIncludesTerm(lower, alias) && !seen.has(alias) && !seen.has(display.toLowerCase())) {
      seen.add(display.toLowerCase());
      skills.push(display);
    }
  }

  const summarySection = collectSection(text, SECTION_HEADERS.summary);
  const seeking = text.match(/\bseeking\s+([^.\n]{8,80})/i)?.[1]?.trim() ?? "";
  const target_roles = seeking ? [seeking] : [];

  const bodyLower = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !Object.values(SECTION_HEADERS).some((re) => re.test(trimmed));
    })
    .join("\n")
    .toLowerCase();

  const industries: string[] = [];
  for (const term of INDUSTRY_TERMS) {
    if (bodyLower.includes(term.key) && !industries.includes(term.display)) industries.push(term.display);
  }

  const employment_notes: string[] = [];
  if (/\bremote\b/i.test(text) && /\b(seeking|open to|prefer|available)\b/i.test(text)) {
    employment_notes.push("remote");
  }
  if (/\bhybrid\b/i.test(text) && /\b(seeking|open to|prefer)\b/i.test(text)) {
    employment_notes.push("hybrid");
  }
  if (/\breloc/i.test(text)) employment_notes.push("relocate");

  const certSection = collectSection(text, SECTION_HEADERS.certifications);
  const certifications = splitList(certSection).slice(0, LIMITS.certifications);

  const achSection = collectSection(text, SECTION_HEADERS.achievements);
  const achievements = achSection
    .split("\n")
    .map((l) => l.replace(/^[\s\-*•]+/, "").trim())
    .filter((l) => l.length >= 8)
    .slice(0, 20);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = extractName(text, email);
  const headlineLine = lines.find(
    (line) =>
      line !== name &&
      line.length < 80 &&
      !EMAIL_RE.test(line) &&
      !URL_RE.test(line) &&
      /engineer|developer|designer|manager|analyst|scientist|consultant|specialist|director|lead/i.test(line),
  );
  const headline = headlineLine ?? "";

  return {
    full_name: name,
    email,
    phone,
    location,
    headline,
    summary: summarySection.replace(/\s+/g, " ").trim().slice(0, LIMITS.summary) || null,
    skills: skills.slice(0, LIMITS.skills),
    education: extractEducation(text),
    work_experience: extractExperience(text),
    certifications,
    projects: extractProjects(text),
    achievements,
    industries,
    target_roles,
    linkedin_url: linkedin,
    github_url: github,
    website_url: website,
    employment_notes,
  };
}

export function groundedString(
  sourceLower: string,
  value: unknown,
  aliases: string[] = [],
): ConfidentValue | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const confidence = evidenceConfidence(sourceLower, trimmed, aliases);
  if (confidence == null) return null;
  return { value: trimmed.slice(0, LIMITS.description), confidence: roundConfidence(confidence) };
}

export function groundedStringList(sourceLower: string, values: unknown, max: number): ConfidentValue[] {
  if (!Array.isArray(values)) return [];
  const out: ConfidentValue[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    const grounded = groundedString(sourceLower, item);
    if (!grounded) continue;
    const key = grounded.value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(grounded);
    if (out.length >= max) break;
  }
  return out;
}

