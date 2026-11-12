import { extractJobSkills } from "@/lib/job-requirements";
import { parseJobDescription } from "@/lib/talent-intelligence/services/job-description-parser";
import type { VaultExperienceListItem } from "@/lib/vault";
import { buildChecklist } from "./checklist";
import { matchVaultGuides } from "./match-guides";
import { getRoleTemplate } from "./roles";
import type { ComposePrepPackInput, PrepPackResult, PrepPackSkill } from "./types";

export const PREP_PACK_DISCLAIMERS = [
  "Skill lists and practice topics are estimates for preparation. They are not a hiring probability or a judgment of your worth.",
  "Interview Vault guides are firsthand contributor reports. Outcomes and details are not independently verified unless a specific trust label says otherwise.",
  "Paying for a guide or a premium feature does not guarantee an interview or an offer.",
] as const;

const MAX_JD_CHARS = 20_000;
const MIN_JD_CHARS = 40;

export function validateComposeInput(input: ComposePrepPackInput): string | null {
  const hasJd = Boolean(input.jobDescription?.trim());
  const hasRole = Boolean(input.roleTemplateId?.trim());
  if (hasJd === hasRole) {
    return "Provide either a job description or a role template, not both or neither.";
  }
  if (hasJd) {
    const jd = input.jobDescription!.trim();
    if (jd.length < MIN_JD_CHARS) return "Paste a longer job description so we can extract useful requirements.";
    if (jd.length > MAX_JD_CHARS) return `Job description must be at most ${MAX_JD_CHARS} characters.`;
  }
  if (hasRole && !getRoleTemplate(input.roleTemplateId!.trim())) {
    return "Unknown role template.";
  }
  return null;
}

function uniqueSkills(skills: PrepPackSkill[]): PrepPackSkill[] {
  const seen = new Set<string>();
  const out: PrepPackSkill[] = [];
  for (const skill of skills) {
    const key = skill.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  return out;
}

export function composePrepPack(
  input: ComposePrepPackInput,
  guides: VaultExperienceListItem[],
  now = Date.now(),
): PrepPackResult {
  const error = validateComposeInput(input);
  if (error) throw new Error(error);

  if (input.roleTemplateId) {
    const role = getRoleTemplate(input.roleTemplateId.trim())!;
    const requirements = uniqueSkills([
      ...role.requiredSkills.map(
        (name): PrepPackSkill => ({ name, source: "role_template", kind: "required" }),
      ),
      ...role.preferredSkills.map(
        (name): PrepPackSkill => ({ name, source: "role_template", kind: "preferred" }),
      ),
    ]);
    const practice_topics = role.practiceTopics.map(
      (name): PrepPackSkill => ({ name, source: "estimate", kind: "practice" }),
    );
    const matched = matchVaultGuides({
      guides,
      searchTerms: [...role.searchTerms, ...role.requiredSkills, role.title],
      companyHint: input.companyHint ?? null,
      now,
    });

    return {
      title: role.title,
      company: input.companyHint?.trim() || null,
      seniority: role.seniority,
      input_mode: "role_template",
      role_template_id: role.id,
      requirements,
      guides: matched,
      checklist: buildChecklist({
        skills: requirements,
        hasGuides: matched.length > 0,
        company: input.companyHint?.trim() || null,
        inputMode: "role_template",
      }),
      practice_topics,
      disclaimers: [...PREP_PACK_DISCLAIMERS],
    };
  }

  const jd = input.jobDescription!.trim().slice(0, MAX_JD_CHARS);
  const parsed = parseJobDescription(jd, {
    title: input.titleHint,
    company: input.companyHint,
  });
  const extracted = extractJobSkills(parsed.title ?? "", jd);

  const requirements = uniqueSkills([
    ...parsed.requiredSkills.map(
      (name): PrepPackSkill => ({ name, source: "job_description", kind: "required" }),
    ),
    ...parsed.preferredSkills.map(
      (name): PrepPackSkill => ({ name, source: "job_description", kind: "preferred" }),
    ),
    ...extracted
      .filter(
        (name) =>
          !parsed.requiredSkills.some((s) => s.toLowerCase() === name.toLowerCase()) &&
          !parsed.preferredSkills.some((s) => s.toLowerCase() === name.toLowerCase()),
      )
      .map((name): PrepPackSkill => ({ name, source: "job_description", kind: "required" })),
  ]).slice(0, 30);

  const practice_topics = uniqueSkills(
    requirements.slice(0, 8).map((skill) => ({
      name: skill.name,
      source: "estimate" as const,
      kind: "practice" as const,
    })),
  );

  if (parsed.responsibilities[0]) {
    practice_topics.push({
      name: `Walk through how you would approach: ${parsed.responsibilities[0].slice(0, 120)}`,
      source: "estimate",
      kind: "practice",
    });
  }

  const searchTerms = [
    parsed.title ?? "",
    parsed.company ?? "",
    ...requirements.map((s) => s.name),
  ].filter(Boolean);

  const matched = matchVaultGuides({
    guides,
    searchTerms,
    companyHint: parsed.company,
    now,
  });

  return {
    title: parsed.title,
    company: parsed.company,
    seniority: parsed.seniority,
    input_mode: "job_description",
    role_template_id: null,
    requirements,
    guides: matched,
    checklist: buildChecklist({
      skills: requirements,
      hasGuides: matched.length > 0,
      company: parsed.company,
      inputMode: "job_description",
    }),
    practice_topics: practice_topics.slice(0, 10),
    disclaimers: [...PREP_PACK_DISCLAIMERS],
  };
}

/** Public share payload: drop anything that could reconstruct a pasted JD. */
export function toShareablePack(pack: PrepPackResult): Omit<PrepPackResult, "share_id"> {
  return {
    title: pack.title,
    company: pack.company,
    seniority: pack.seniority,
    input_mode: pack.input_mode,
    role_template_id: pack.role_template_id,
    requirements: pack.requirements,
    guides: pack.guides,
    checklist: pack.checklist,
    practice_topics: pack.practice_topics,
    disclaimers: pack.disclaimers,
  };
}
