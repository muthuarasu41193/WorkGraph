export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  headline: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  photo_url: string | null;
  years_of_experience: number | null;
  skills: string[];
  education: Education[];
  work_experience: WorkExperience[];
  certifications: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  resume_raw_text: string | null;
  ats_score: number | null;
  ats_feedback: ATSFeedback | null;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface ATSFeedback {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keyword_density: string;
  formatting_score: number;
  content_score: number;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  source: string | null;
  source_url: string | null;
  match_score: number | null;
  shortlist_probability: string | null;
  shortlist_reasons: unknown | null;
  missing_skills: string[];
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}
