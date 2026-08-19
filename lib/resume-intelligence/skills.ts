import { LIMITS } from "@/lib/validation/primitives";

import type { ConfidentSkill } from "./schema";
import { evidenceConfidence, roundConfidence } from "./text";

/** Canonical skill display names. Aliases collapse into the canonical key. */
export const SKILL_CANONICAL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  react: "React",
  reactjs: "React",
  "react.js": "React",
  "react native": "React Native",
  "react-native": "React Native",
  vue: "Vue",
  vuejs: "Vue",
  angular: "Angular",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  java: "Java",
  kotlin: "Kotlin",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  ruby: "Ruby",
  rails: "Ruby on Rails",
  php: "PHP",
  sql: "SQL",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  redis: "Redis",
  graphql: "GraphQL",
  aws: "AWS",
  "amazon web services": "AWS",
  azure: "Azure",
  gcp: "GCP",
  "google cloud": "GCP",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  terraform: "Terraform",
  git: "Git",
  linux: "Linux",
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "machine learning": "Machine Learning",
  ml: "Machine Learning",
  "data science": "Data Science",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  rest: "REST",
  "c#": "C#",
  csharp: "C#",
  ".net": ".NET",
  "c++": "C++",
};

const SOFT_SKILLS = new Set([
  "communication",
  "leadership",
  "teamwork",
  "collaboration",
  "problem solving",
  "problem-solving",
  "time management",
  "mentoring",
  "stakeholder management",
  "presentation",
  "negotiation",
  "adaptability",
  "critical thinking",
  "ownership",
  "coaching",
]);

function skillKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function canonicalizeSkillName(raw: string): { canonical: string; display: string } | null {
  const key = skillKey(raw);
  if (!key || key.length > LIMITS.skill) return null;
  const display = SKILL_CANONICAL[key];
  if (display) return { canonical: skillKey(display), display };
  if (key.length < 2) return null;
  const titled = raw.trim().replace(/\s+/g, " ");
  return { canonical: key, display: titled };
}

export function classifySkill(canonical: string): ConfidentSkill["category"] {
  if (SOFT_SKILLS.has(canonical)) return "soft";
  if (SKILL_CANONICAL[canonical] || Object.values(SKILL_CANONICAL).some((d) => skillKey(d) === canonical)) {
    return "technical";
  }
  return "other";
}

export function skillAliases(canonical: string, display: string): string[] {
  const aliases = [canonical, display];
  for (const [alias, name] of Object.entries(SKILL_CANONICAL)) {
    if (skillKey(name) === canonical || alias === canonical) aliases.push(alias, name);
  }
  return [...new Set(aliases)];
}

/**
 * Keep skills that are actually present in the resume. Drop invented names.
 */
export function normalizeSkills(rawSkills: unknown, sourceLower: string): ConfidentSkill[] {
  const incoming: string[] = [];
  if (Array.isArray(rawSkills)) {
    for (const item of rawSkills) {
      if (typeof item === "string") incoming.push(item);
      else if (item && typeof item === "object" && "skill" in item && typeof (item as { skill: unknown }).skill === "string") {
        incoming.push((item as { skill: string }).skill);
      }
    }
  }

  const seen = new Set<string>();
  const out: ConfidentSkill[] = [];

  for (const raw of incoming) {
    const canon = canonicalizeSkillName(raw);
    if (!canon || seen.has(canon.canonical)) continue;
    const aliases = skillAliases(canon.canonical, canon.display);
    const confidence = evidenceConfidence(sourceLower, canon.display, aliases);
    if (confidence == null) continue;
    seen.add(canon.canonical);
    out.push({
      skill: canon.display,
      canonical: canon.canonical,
      confidence: roundConfidence(confidence),
      category: classifySkill(canon.canonical),
    });
    if (out.length >= LIMITS.skills) break;
  }

  return out;
}

export function partitionSkills(skills: ConfidentSkill[]): {
  skills: ConfidentSkill[];
  technical_skills: ConfidentSkill[];
  soft_skills: ConfidentSkill[];
} {
  return {
    skills,
    technical_skills: skills.filter((s) => s.category === "technical"),
    soft_skills: skills.filter((s) => s.category === "soft"),
  };
}
