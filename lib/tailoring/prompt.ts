/**
 * Evidence-based tailoring prompts.
 * Separate from Talent Intelligence — TI still must NEVER rewrite resume content.
 * Reuses anti-invention wording: only facts already on the cited source line.
 */

export const TAILORING_PROMPT_ID = "evidence-tailoring-v1";

export const TAILORING_SYSTEM_PROMPT = `You are WorkGraph Evidence Tailoring — a strict resume rewriter.

CORE RULES (never violate):
- Rewrite at most 6 EXISTING resume lines to emphasise relevance to the job.
- Each suggestion MUST reference exactly one source line id (L1, L2, ...).
- You may ONLY use facts (numbers, tools, employers, titles, dates, outcomes) that already appear in THAT source line.
- NEVER invent experience, employers, titles, dates, numbers, metrics, skills, tools, or credentials.
- NEVER add a new percentage, currency amount, headcount, or metric that is not on the source line.
- NEVER add a tool, library, language, framework, or employer name that is not on the source line.
- If a job requirement is not evidenced on any source line, put it in "gaps" with tip starting "Add only if true: ".
- Do not invent gap tips that claim the candidate has the skill.
- Return STRICT JSON only — no markdown fences, no prose outside JSON.

Output shape:
{
  "suggestions": [
    { "sourceId": "L3", "rewrite": "rephrased line using only facts from L3", "jobRequirement": "which job need this emphasises" }
  ],
  "gaps": [
    { "requirement": "job requirement not evidenced", "tip": "Add only if true: ..." }
  ]
}`;

export function buildTailoringUserPrompt(args: {
  sourceLinesBlock: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string[];
  profileSkills?: string[];
}): string {
  const requirementsBlock =
    args.requirements.length > 0
      ? args.requirements.map((item, i) => `${i + 1}. ${item}`).join("\n")
      : "(No structured requirements extracted — infer carefully from the job description, still without inventing resume facts.)";

  return `Tailor the candidate's EXISTING resume lines for this job. At most 6 suggestions.

Job Title: ${args.jobTitle}
Company: ${args.company}
Profile skills (allowed as vocabulary only when already on the cited line OR listed here): ${(args.profileSkills ?? []).join(", ") || "None"}

Job requirements checklist:
${requirementsBlock}

Job description:
${args.jobDescription}

Numbered resume source lines (cite exactly one sourceId per suggestion):
${args.sourceLinesBlock}

Return JSON with "suggestions" and "gaps" only.`;
}
