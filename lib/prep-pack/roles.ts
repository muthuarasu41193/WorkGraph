/**
 * Curated role templates for visitors who have not pasted a job description.
 * Skills are labeled as role-template estimates, not JD-extracted requirements.
 */

export type RoleTemplate = {
  id: string;
  title: string;
  seniority: string;
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  practiceTopics: string[];
  searchTerms: string[];
};

export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    seniority: "Mid-level",
    summary: "General product engineering interview prep across coding and system design.",
    requiredSkills: ["data structures", "algorithms", "system design", "debugging", "git"],
    preferredSkills: ["TypeScript", "Python", "SQL", "cloud services"],
    practiceTopics: ["coding interview", "system design basics", "behavioral STAR stories"],
    searchTerms: ["software engineer", "backend", "fullstack", "full stack"],
  },
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    seniority: "Mid-level",
    summary: "UI engineering prep covering component design, accessibility, and web performance.",
    requiredSkills: ["JavaScript", "HTML", "CSS", "React", "accessibility"],
    preferredSkills: ["TypeScript", "testing", "performance", "design systems"],
    practiceTopics: ["component architecture", "state management", "accessibility checks"],
    searchTerms: ["frontend", "front end", "react", "ui engineer"],
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    seniority: "Mid-level",
    summary: "API and services prep covering data modeling, reliability, and service design.",
    requiredSkills: ["APIs", "databases", "SQL", "concurrency", "observability"],
    preferredSkills: ["distributed systems", "caching", "message queues", "Python", "Go"],
    practiceTopics: ["API design", "database schema trade-offs", "incident response stories"],
    searchTerms: ["backend", "platform engineer", "services", "api"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    seniority: "Mid-level",
    summary: "Analytics interview prep covering SQL, metrics, and stakeholder communication.",
    requiredSkills: ["SQL", "Excel", "data visualization", "metrics", "stakeholder management"],
    preferredSkills: ["Python", "A/B testing", "Looker", "Tableau"],
    practiceTopics: ["SQL case questions", "metric definition", "dashboard critique"],
    searchTerms: ["data analyst", "analytics", "business analyst"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    seniority: "Mid-level",
    summary: "Product interview prep covering discovery, prioritization, and execution stories.",
    requiredSkills: ["product discovery", "prioritization", "roadmapping", "stakeholder management"],
    preferredSkills: ["A/B testing", "SQL", "user research", "go-to-market"],
    practiceTopics: ["product sense", "execution stories", "metrics trade-offs"],
    searchTerms: ["product manager", "pm", "product owner"],
  },
  {
    id: "designer",
    title: "Product Designer",
    seniority: "Mid-level",
    summary: "Design interview prep covering portfolio critique, process, and collaboration.",
    requiredSkills: ["user research", "interaction design", "prototyping", "design critique"],
    preferredSkills: ["Figma", "design systems", "accessibility", "usability testing"],
    practiceTopics: ["portfolio walkthrough", "design critique", "cross-functional stories"],
    searchTerms: ["product designer", "ux designer", "ui designer"],
  },
] as const;

export function getRoleTemplate(id: string): RoleTemplate | null {
  return ROLE_TEMPLATES.find((role) => role.id === id) ?? null;
}
