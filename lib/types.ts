export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  headline: string | null;
  phone: string | null;
  location: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}

export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  job_url: string | null;
  status: JobApplicationStatus;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}
