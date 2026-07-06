export type JobCardData = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  workMode?: string;
  experience?: string;
  employmentType?: string;
  matchPercent?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  postedAgo?: string;
  applyUrl?: string | null;
  companyLogo?: string;
};

export function jobCardFromMatch(job: {
  id: string;
  title: string;
  company: string;
  location: string;
  matchPercent: number;
  salaryRange?: string;
  workMode?: string;
  applyUrl?: string;
  matchedSkills?: string[];
  postedAgo?: string;
}): JobCardData {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchPercent: job.matchPercent,
    salaryRange: job.salaryRange,
    workMode: job.workMode,
    applyUrl: job.applyUrl,
    matchedSkills: job.matchedSkills,
    postedAgo: job.postedAgo,
  };
}
