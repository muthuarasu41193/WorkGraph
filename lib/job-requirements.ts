/**
 * Deterministic job-requirement bullets from stored listing text.
 * No LLM. Used by evidence-based tailoring (and any caller that needs a checklist).
 */
import { parseJobDescription } from "@/lib/talent-intelligence/services/job-description-parser";

export const MAX_JOB_REQUIREMENTS = 24;
export const MAX_REQUIREMENT_CHARS = 200;

export type JobRequirement = {
  /** Short requirement label for prompts and gap tips. */
  text: string;
  /** Whether the listing framed it as required vs preferred. */
  kind: "required" | "preferred" | "qualification" | "responsibility";
};

function cleanRequirement(raw: string): string | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > MAX_REQUIREMENT_CHARS) return null;
  return text;
}

/**
 * Extract a capped, de-duplicated list of requirements from a job description.
 */
export function extractJobRequirements(
  description: string,
  hints?: { title?: string | null; company?: string | null },
): JobRequirement[] {
  const parsed = parseJobDescription(description ?? "", {
    title: hints?.title ?? undefined,
    company: hints?.company ?? undefined,
  });

  const out: JobRequirement[] = [];
  const seen = new Set<string>();

  const push = (raw: string, kind: JobRequirement["kind"]) => {
    const text = cleanRequirement(raw);
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ text, kind });
  };

  for (const skill of parsed.requiredSkills) push(skill, "required");
  for (const skill of parsed.preferredSkills) push(skill, "preferred");
  for (const item of parsed.qualifications) push(item, "qualification");
  for (const item of parsed.responsibilities) push(item, "responsibility");

  return out.slice(0, MAX_JOB_REQUIREMENTS);
}

/** Plain strings for prompts (required/preferred first). */
export function jobRequirementTexts(requirements: JobRequirement[]): string[] {
  return requirements.map((item) => item.text);
}
