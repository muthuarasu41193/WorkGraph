export type JobCardData = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  workMode?: string;
  isRemote?: boolean;
  experience?: string;
  employmentType?: string;
  matchPercent?: number;
  matchedSkills?: string[];
  skills?: string[];
  missingSkills?: string[];
  postedAgo?: string;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  companyLogo?: string;
  /** Hidden job / feed source label (e.g. Reddit, Hacker News) */
  source?: string;
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
  skills?: string[];
  postedAgo?: string;
  employmentType?: string;
  source?: string;
  sourceUrl?: string;
  companyLogo?: string;
}): JobCardData {
  const isRemote =
    job.workMode?.toLowerCase() === "remote" ||
    job.location.toLowerCase().includes("remote");

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchPercent: job.matchPercent,
    salaryRange: job.salaryRange,
    workMode: job.workMode,
    isRemote,
    applyUrl: job.applyUrl,
    matchedSkills: job.matchedSkills,
    skills: job.skills ?? job.matchedSkills,
    postedAgo: job.postedAgo,
    employmentType: job.employmentType,
    source: job.source,
    sourceUrl: job.sourceUrl,
    companyLogo: job.companyLogo,
  };
}
