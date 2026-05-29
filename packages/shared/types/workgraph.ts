/** Shared WorkGraph API types (frontend + worker). */

export type ParsedResume = {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string;
  summary: string | null;
  years_of_experience: number;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  work_experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  certifications: string[];
  projects: Array<{ name?: string; description?: string }>;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  detected_language?: string;
  profile_completeness: number;
  resume_storage_key?: string | null;
  raw_text?: string | null;
};

export type ATSFeedback = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  strengths: string[];
  weaknesses: string[];
  optimization_suggestions: string[];
  missing_skills: string[];
  weak_keywords: string[];
  keyword_density: "low" | "medium" | "high";
  formatting_score: number;
  content_score: number;
  formatting_issues?: string[];
};

export type JobMatch = {
  job_id: number;
  title: string;
  company: string;
  location: string;
  source: string;
  apply_url: string;
  similarity: number;
};

export type SubscriptionTier = "free" | "premium";

export type WorkGraphHealth = {
  status: string;
  service?: string;
};
