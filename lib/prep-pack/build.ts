import { extractPrepPackSkills } from "./extract";
import { buildPrepPackChecklist } from "./checklist";
import { matchPrepPackGuides } from "./match-guides";
import type { PrepPackGuideCandidate, PrepPackResult } from "./types";

export const PREP_PACK_ESTIMATE_NOTICE =
  "Skill matches and gaps are an estimate from the text and role you provided. They are not a hiring probability or a judgment of you.";

/**
 * Pure pack builder. Callers supply published Interview Vault candidates.
 * Does not call external AI providers.
 */
export function buildPrepPack(input: {
  jobDescription?: string | null;
  roleId?: string | null;
  guides: PrepPackGuideCandidate[];
}): PrepPackResult {
  const { skills, role } = extractPrepPackSkills({
    jobDescription: input.jobDescription,
    roleId: input.roleId,
  });

  const guides = matchPrepPackGuides({
    guides: input.guides,
    skills,
    role,
  });

  const matchedCandidates = input.guides.filter((g) => guides.some((m) => m.id === g.id));

  const checklist = buildPrepPackChecklist({
    role,
    skills,
    matchedGuides: matchedCandidates,
  });

  return {
    role: role ? { id: role.id, label: role.label } : null,
    skills,
    guides,
    checklist,
    estimateNotice: PREP_PACK_ESTIMATE_NOTICE,
    status: guides.length === 0 ? "no_matches" : "ok",
  };
}
