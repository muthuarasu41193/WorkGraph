/** Mock enrichment data for premium profile widgets (AI, activity, sidebar). */

export type SkillCategory = {
  id: string;
  label: string;
  skills: { name: string; endorsements: number; top?: boolean }[];
};

export type ProfileActivity = {
  id: string;
  type: "applied" | "saved" | "recruiter" | "post" | "engagement";
  title: string;
  subtitle: string;
  timeAgo: string;
};

export type SuggestedConnection = {
  id: string;
  name: string;
  role: string;
  company: string;
  mutual: number;
};

export type JobMatchPreview = {
  id: string;
  title: string;
  company: string;
  matchPercent: number;
  salaryRange: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  location: string;
};

export const MOCK_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "core",
    label: "Core",
    skills: [
      { name: "TypeScript", endorsements: 24, top: true },
      { name: "React", endorsements: 31, top: true },
      { name: "Next.js", endorsements: 18, top: true },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    skills: [
      { name: "Node.js", endorsements: 12 },
      { name: "PostgreSQL", endorsements: 9 },
      { name: "Supabase", endorsements: 7 },
    ],
  },
  {
    id: "ai",
    label: "AI & Data",
    skills: [
      { name: "LLM APIs", endorsements: 6, top: true },
      { name: "RAG pipelines", endorsements: 4 },
      { name: "Prompt engineering", endorsements: 11 },
    ],
  },
];

export const MOCK_AI_INSIGHTS = {
  missingSkills: ["Kubernetes", "GraphQL", "System design"],
  certifications: ["AWS Solutions Architect", "Google Professional Cloud Developer"],
  resumeTips: [
    "Quantify impact with metrics in your last two roles",
    "Add a dedicated Skills section aligned to target job titles",
    "Shorten summary to 3 lines for ATS parsers",
  ],
  careerGrowth: [
    "Staff engineer track fits your 6+ years in platform work",
    "Consider leading a cross-team initiative to signal scope",
  ],
  industryDemand: { trend: "+18%", label: "Full-stack + AI roles", period: "90 days" },
  salaryInsight: { range: "$165k – $210k", location: "US remote", percentile: "72nd" },
  strengthScore: 84,
};

export const MOCK_ACTIVITIES: ProfileActivity[] = [
  {
    id: "1",
    type: "applied",
    title: "Senior Software Engineer",
    subtitle: "Stripe · Applied 2h ago",
    timeAgo: "2h",
  },
  {
    id: "2",
    type: "saved",
    title: "Staff Frontend Engineer",
    subtitle: "Linear · Saved yesterday",
    timeAgo: "1d",
  },
  {
    id: "3",
    type: "recruiter",
    title: "Recruiter viewed your profile",
    subtitle: "TechCorp Talent · 3 views this week",
    timeAgo: "3d",
  },
  {
    id: "4",
    type: "post",
    title: "Shared career insight",
    subtitle: "“Breaking into AI product engineering”",
    timeAgo: "5d",
  },
];

export const MOCK_SIDEBAR = {
  analytics: { profileViews: 128, searchAppearances: 42, trend: "+12%" },
  recruiterViews: 7,
  interviews: [
    { company: "Notion", stage: "Technical", date: "Thu" },
    { company: "Vercel", stage: "Hiring manager", date: "Next week" },
  ],
  trendingSkills: ["Rust", "AI agents", "Platform engineering", "Next.js 15"],
  connections: [
    { id: "c1", name: "Alex Chen", role: "Engineering Manager", company: "Figma", mutual: 12 },
    { id: "c2", name: "Jordan Lee", role: "Staff Engineer", company: "Datadog", mutual: 8 },
    { id: "c3", name: "Sam Rivera", role: "Product Designer", company: "Linear", mutual: 5 },
  ] satisfies SuggestedConnection[],
  dailyTip: "Profiles with quantified achievements get 2× more recruiter replies.",
};

export const MOCK_JOB_MATCHES: JobMatchPreview[] = [
  {
    id: "jm1",
    title: "Senior Full Stack Engineer",
    company: "Notion",
    matchPercent: 94,
    salaryRange: "$180k – $220k",
    workMode: "Hybrid",
    location: "San Francisco, CA",
  },
  {
    id: "jm2",
    title: "Staff Software Engineer",
    company: "Linear",
    matchPercent: 89,
    salaryRange: "$190k – $240k",
    workMode: "Remote",
    location: "Remote (US)",
  },
  {
    id: "jm3",
    title: "Principal Engineer, Platform",
    company: "Stripe",
    matchPercent: 86,
    salaryRange: "$200k – $260k",
    workMode: "Hybrid",
    location: "Seattle, WA",
  },
];

export function buildCompletenessSuggestions(profile: {
  summary: string | null;
  location: string | null;
  skills: string[];
  education: unknown[];
  work_experience: unknown[];
  photo_url: string | null;
  resume_url: string | null;
}): string[] {
  const tips: string[] = [];
  if (!profile.photo_url) tips.push("Add a professional headshot");
  if (!profile.summary) tips.push("Write a concise professional summary");
  if (!profile.skills?.length) tips.push("Add at least 8 relevant skills");
  if (!profile.work_experience?.length) tips.push("Document your work experience");
  if (!profile.education?.length) tips.push("Add education credentials");
  if (!profile.resume_url) tips.push("Upload your latest resume");
  if (tips.length === 0) tips.push("Enable Open to Work for more visibility");
  return tips.slice(0, 4);
}
