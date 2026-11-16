import { extractJobSkills } from "@/lib/job-requirements";
import { canonicalizeSkillName } from "@/lib/resume-intelligence/skills";

import { getPrepRoleById, inferPrepRoleFromText, type PrepRoleDefinition } from "./roles";
import type { PrepPackSkill } from "./types";

export const PREP_PACK_SKILL_LIMIT = 24;

function displaySkill(raw: string): string {
  const canon = canonicalizeSkillName(raw);
  const trimmed = (canon?.display ?? raw).trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  // Title-case unknown taxonomy leftovers (e.g. curated "css" / "html").
  if (trimmed === trimmed.toLowerCase() && !trimmed.includes(" ")) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

/**
 * Build a skills-to-role breakdown from an optional JD and/or curated role.
 * Uses deterministic taxonomy matching only (extractJobSkills + role focus list).
 */
export function extractPrepPackSkills(input: {
  jobDescription?: string | null;
  roleId?: string | null;
}): {
  skills: PrepPackSkill[];
  role: PrepRoleDefinition | null;
} {
  const jd = typeof input.jobDescription === "string" ? input.jobDescription.trim() : "";
  const selected = getPrepRoleById(input.roleId ?? null);
  const inferred = !selected && jd ? inferPrepRoleFromText(jd) : null;
  const role = selected ?? inferred;

  const fromJd = jd ? extractJobSkills("", jd) : [];
  const seen = new Set<string>();
  const skills: PrepPackSkill[] = [];

  for (const raw of fromJd) {
    const name = displaySkill(raw);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    skills.push({ name, source: "job_description" });
    if (skills.length >= PREP_PACK_SKILL_LIMIT) break;
  }

  if (role) {
    for (const raw of role.focusSkills) {
      if (skills.length >= PREP_PACK_SKILL_LIMIT) break;
      const name = displaySkill(raw);
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      skills.push({ name, source: "role_focus" });
    }
  }

  return { skills, role };
}
