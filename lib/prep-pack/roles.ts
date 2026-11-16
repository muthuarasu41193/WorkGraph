/**
 * Curated role list for the free prep pack.
 * Focus skills reuse names that align with lib/job-match SKILL_ALIASES /
 * lib/job-requirements extractJobSkills where possible.
 */

export type PrepRoleDefinition = {
  id: string;
  label: string;
  /** Tokens used to detect this role from free text (JD title-ish lines). */
  aliases: string[];
  /** Skills typically emphasized for this role (estimate). */
  focusSkills: string[];
  /** Default interview rounds for the checklist when guide data is absent. */
  defaultRounds: string[];
};

export const PREP_ROLES: readonly PrepRoleDefinition[] = [
  {
    id: "software-engineer",
    label: "Software engineer",
    aliases: ["software engineer", "software developer", "sde", "swe", "full stack engineer"],
    focusSkills: ["javascript", "typescript", "python", "java", "sql", "git", "docker"],
    defaultRounds: ["Recruiter screen", "Technical screen", "Coding interview", "System design", "Hiring manager"],
  },
  {
    id: "frontend-engineer",
    label: "Frontend engineer",
    aliases: ["frontend engineer", "front-end engineer", "frontend developer", "front end developer", "ui engineer"],
    focusSkills: ["javascript", "typescript", "react", "next.js", "CSS", "HTML", "graphql"],
    defaultRounds: ["Recruiter screen", "Technical screen", "UI / coding interview", "System design", "Hiring manager"],
  },
  {
    id: "backend-engineer",
    label: "Backend engineer",
    aliases: ["backend engineer", "back-end engineer", "backend developer", "server engineer", "api engineer"],
    focusSkills: ["python", "java", "go", "sql", "postgresql", "redis", "docker", "kubernetes"],
    defaultRounds: ["Recruiter screen", "Technical screen", "Coding interview", "System design", "Hiring manager"],
  },
  {
    id: "data-scientist",
    label: "Data scientist",
    aliases: ["data scientist", "applied scientist", "ml scientist"],
    focusSkills: ["python", "sql", "machine learning", "data science", "statistics"],
    defaultRounds: ["Recruiter screen", "Technical screen", "Case / modeling", "Hiring manager"],
  },
  {
    id: "data-engineer",
    label: "Data engineer",
    aliases: ["data engineer", "analytics engineer", "etl engineer"],
    focusSkills: ["python", "sql", "spark", "airflow", "aws", "kafka"],
    defaultRounds: ["Recruiter screen", "Technical screen", "Data pipeline design", "Hiring manager"],
  },
  {
    id: "ml-engineer",
    label: "Machine learning engineer",
    aliases: ["machine learning engineer", "ml engineer", "ml ops", "mlops"],
    focusSkills: ["python", "machine learning", "pytorch", "tensorflow", "docker", "kubernetes"],
    defaultRounds: ["Recruiter screen", "Technical screen", "ML system design", "Coding interview", "Hiring manager"],
  },
  {
    id: "product-manager",
    label: "Product manager",
    aliases: ["product manager", "product owner", "pm "],
    focusSkills: ["product management", "stakeholder management", "user research", "analytics", "roadmap"],
    defaultRounds: ["Recruiter screen", "Product sense", "Execution / metrics", "Behavioral", "Hiring manager"],
  },
  {
    id: "designer",
    label: "Product designer",
    aliases: ["product designer", "ux designer", "ui designer", "design lead"],
    focusSkills: ["figma", "user research", "prototyping", "interaction design", "visual design"],
    defaultRounds: ["Recruiter screen", "Portfolio review", "Design exercise", "Hiring manager"],
  },
  {
    id: "devops-engineer",
    label: "DevOps / SRE",
    aliases: ["devops", "site reliability", "sre", "platform engineer", "infrastructure engineer"],
    focusSkills: ["kubernetes", "docker", "terraform", "aws", "linux", "ci/cd"],
    defaultRounds: ["Recruiter screen", "Technical screen", "Ops / reliability design", "Hiring manager"],
  },
  {
    id: "recruiting",
    label: "Recruiter / talent",
    aliases: ["recruiter", "talent acquisition", "talent partner", "sourcer"],
    focusSkills: ["recruiting", "talent acquisition", "sourcing", "negotiation", "stakeholder management"],
    defaultRounds: ["Recruiter screen", "Role-play / sourcing", "Hiring manager"],
  },
  {
    id: "sales",
    label: "Sales",
    aliases: ["account executive", "sales", "business development", "ae "],
    focusSkills: ["sales", "negotiation", "crm", "pipeline management", "presentation"],
    defaultRounds: ["Recruiter screen", "Pitch / role-play", "Hiring manager"],
  },
] as const;

export const PREP_ROLE_IDS = PREP_ROLES.map((role) => role.id);

export function getPrepRoleById(id: string | null | undefined): PrepRoleDefinition | null {
  if (!id) return null;
  return PREP_ROLES.find((role) => role.id === id) ?? null;
}

export function listPrepRoleOptions(): Array<{ id: string; label: string }> {
  return PREP_ROLES.map(({ id, label }) => ({ id, label }));
}

/**
 * Infer a curated role from free text using alias hits.
 * Returns null when no alias scores above others.
 */
export function inferPrepRoleFromText(text: string): PrepRoleDefinition | null {
  const hay = text.trim().toLowerCase();
  if (!hay) return null;

  let best: { role: PrepRoleDefinition; hits: number } | null = null;
  for (const role of PREP_ROLES) {
    let hits = 0;
    for (const alias of role.aliases) {
      if (hay.includes(alias.toLowerCase())) hits += 1;
    }
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { role, hits };
    }
  }
  return best?.role ?? null;
}
