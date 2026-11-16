import type { PrepRoleDefinition } from "./roles";
import type { PrepPackGuideCandidate, PrepPackGuideMatch, PrepPackSkill } from "./types";

export const PREP_PACK_GUIDE_LIMIT = 5;
/** Minimum score for a published guide to appear in the pack. */
export const PREP_PACK_GUIDE_MIN_SCORE = 8;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textIncludesTerm(haystack: string, term: string): boolean {
  if (!term || !haystack) return false;
  if (term.length <= 3) {
    return new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(haystack);
  }
  return haystack.includes(term);
}

function guideHaystack(guide: PrepPackGuideCandidate): string {
  return normalize(
    [
      guide.role,
      guide.level ?? "",
      guide.company,
      guide.interview_round ?? "",
      ...(guide.skills ?? []),
      ...guide.roundNames,
    ].join(" "),
  );
}

/**
 * Score published Interview Vault guides against extracted skills and selected role.
 * Deterministic and transparent: reasons list which skills/role tokens matched.
 */
export function matchPrepPackGuides(input: {
  guides: PrepPackGuideCandidate[];
  skills: PrepPackSkill[];
  role: PrepRoleDefinition | null;
  limit?: number;
  minScore?: number;
}): PrepPackGuideMatch[] {
  const limit = input.limit ?? PREP_PACK_GUIDE_LIMIT;
  const minScore = input.minScore ?? PREP_PACK_GUIDE_MIN_SCORE;
  const skillNames = input.skills.map((s) => s.name);

  const scored: PrepPackGuideMatch[] = [];

  for (const guide of input.guides) {
    const hay = guideHaystack(guide);
    const why: string[] = [];
    let score = 0;

    if (input.role) {
      const roleHay = normalize(guide.role);
      for (const alias of input.role.aliases) {
        if (textIncludesTerm(roleHay, alias) || textIncludesTerm(hay, alias)) {
          score += 18;
          why.push(`Role match: ${input.role.label}`);
          break;
        }
      }
      // Soft family hit: any alias token word overlap on guide.role
      if (!why.some((w) => w.startsWith("Role match:"))) {
        const labelToken = normalize(input.role.label).split(" ")[0] ?? "";
        if (labelToken.length >= 4 && textIncludesTerm(roleHay, labelToken)) {
          score += 10;
          why.push(`Role family: ${input.role.label}`);
        }
      }
    }

    const matchedSkills: string[] = [];
    for (const skill of skillNames) {
      const term = normalize(skill);
      if (term.length < 2) continue;
      if (textIncludesTerm(hay, term)) {
        score += 6;
        matchedSkills.push(skill);
      }
    }
    if (matchedSkills.length) {
      const shown = matchedSkills.slice(0, 4);
      const more = matchedSkills.length - shown.length;
      why.push(
        more > 0
          ? `Skills mentioned: ${shown.join(", ")} (+${more} more)`
          : `Skills mentioned: ${shown.join(", ")}`,
      );
    }

    if (score < minScore) continue;

    scored.push({
      id: guide.id,
      company: guide.company,
      role: guide.role,
      level: guide.level,
      difficulty: guide.difficulty,
      rounds: guide.rounds,
      avg_rating: guide.avg_rating,
      price_inr: guide.price_inr,
      href: `/interview-vault/${guide.id}`,
      why,
      score,
      interview_round: guide.interview_round,
      skills: guide.skills ?? [],
      content_confirmed_at: guide.content_confirmed_at,
      last_confirmed_label: guide.last_confirmed_label,
      stale: guide.stale,
      stale_label: guide.stale_label,
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.company.localeCompare(b.company))
    .slice(0, limit);
}
