import type { PrepRoleDefinition } from "./roles";
import type { PrepPackChecklistItem, PrepPackGuideCandidate, PrepPackSkill } from "./types";

export const PREP_PACK_CHECKLIST_LIMIT = 18;

const GENERIC_ROUNDS = [
  "Recruiter screen",
  "Technical or skills interview",
  "Hiring manager",
] as const;

function itemId(round: string, index: number): string {
  const slug = round
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "round"}-${index}`;
}

function uniqueRoundNames(guides: PrepPackGuideCandidate[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const guide of guides) {
    for (const name of guide.roundNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
      if (out.length >= 8) return out;
    }
  }
  return out;
}

/**
 * Rule-based preparation checklist.
 * Prefers round names from matched published guides; otherwise uses the
 * curated role template (or a short generic set).
 */
export function buildPrepPackChecklist(input: {
  role: PrepRoleDefinition | null;
  skills: PrepPackSkill[];
  matchedGuides: PrepPackGuideCandidate[];
}): PrepPackChecklistItem[] {
  const fromGuides = uniqueRoundNames(input.matchedGuides);
  const rounds =
    fromGuides.length > 0
      ? fromGuides
      : input.role?.defaultRounds?.length
        ? [...input.role.defaultRounds]
        : [...GENERIC_ROUNDS];

  const focus = input.skills.slice(0, 6).map((s) => s.name);
  const focusPhrase = focus.length
    ? focus.slice(0, 3).join(", ")
    : input.role?.label ?? "this role";

  const items: PrepPackChecklistItem[] = [];
  let index = 0;

  for (const round of rounds) {
    if (items.length >= PREP_PACK_CHECKLIST_LIMIT) break;
    items.push({
      id: itemId(round, index++),
      round,
      text: `Skim what this ${round.toLowerCase()} usually covers for ${input.role?.label ?? "the role"}.`,
    });
    if (items.length >= PREP_PACK_CHECKLIST_LIMIT) break;
    items.push({
      id: itemId(round, index++),
      round,
      text: `Prepare one concrete example that shows ${focusPhrase}.`,
    });
  }

  if (items.length < PREP_PACK_CHECKLIST_LIMIT) {
    items.push({
      id: itemId("general", index++),
      round: "General",
      text: "Write three questions you will ask about the team, scope, and success metrics.",
    });
  }

  if (items.length < PREP_PACK_CHECKLIST_LIMIT && focus.length) {
    items.push({
      id: itemId("general", index++),
      round: "General",
      text: `Review gaps around ${focus.slice(0, 4).join(", ")}. This list is an estimate from the posting and role, not a hiring judgment.`,
    });
  }

  return items.slice(0, PREP_PACK_CHECKLIST_LIMIT);
}
