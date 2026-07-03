"use client";

import {
  Bookmark,
  Building2,
  Clock,
  GitCompare,
  MapPin,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

type Props = {
  job: JobCardData;
  index?: number;
  onSave?: (id: string) => void;
  onCompare?: (id: string) => void;
  saved?: boolean;
  className?: string;
};

function CompanyAvatar({ company, logo }: { company: string; logo?: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-[var(--dash-border)]"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-[var(--dash-text-secondary)] ring-1 ring-[var(--dash-border)]">
      {company.charAt(0).toUpperCase()}
    </span>
  );
}

function matchColor(percent: number) {
  if (percent >= 80) return "text-emerald-600 bg-emerald-50";
  if (percent >= 60) return "text-[var(--dash-accent)] bg-[var(--dash-accent-soft)]";
  return "text-amber-600 bg-amber-50";
}

export default function JobCard({
  job,
  index = 0,
  onSave,
  onCompare,
  saved = false,
  className,
}: Props) {
  return (
    <article
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        "wg-dash-section-card wg-dash-card-lift wg-job-card-enter group overflow-hidden",
        className,
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          <CompanyAvatar company={job.company} logo={job.companyLogo} />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--dash-text-secondary)]">{job.company}</p>
                <h3 className="mt-0.5 text-sm font-semibold leading-snug text-[var(--dash-text)] sm:text-base">
                  {job.title}
                </h3>
              </div>
              {job.matchPercent !== undefined ? (
                <span
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums",
                    matchColor(job.matchPercent),
                  )}
                >
                  {job.matchPercent}% match
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--dash-text-secondary)]">
              {job.salaryRange ? <span className="font-medium text-[var(--dash-text)]">{job.salaryRange}</span> : null}
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {job.location}
              </span>
              {job.workMode ? (
                <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-medium">
                  {job.workMode}
                </Badge>
              ) : null}
              {job.experience ? <span>{job.experience}</span> : null}
              {job.employmentType ? <span>{job.employmentType}</span> : null}
              {job.postedAgo ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden />
                  {job.postedAgo}
                </span>
              ) : null}
            </div>

            {job.matchedSkills && job.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {job.matchedSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
                {job.missingSkills?.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-[var(--dash-text-secondary)]"
                  >
                    +{skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--dash-border)] pt-4">
          {job.applyUrl ? (
            <Button asChild size="sm" className="wg-dash-compact-btn">
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                <Zap className="h-3.5 w-3.5" />
                Apply
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="wg-dash-compact-btn" disabled>
              <Building2 className="h-3.5 w-3.5" />
              View details
            </Button>
          )}
          {onSave ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="wg-dash-compact-btn"
              onClick={() => onSave(job.id)}
              aria-label={saved ? "Remove from saved" : "Save job"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current text-[var(--dash-accent)]")} />
              {saved ? "Saved" : "Save"}
            </Button>
          ) : null}
          {onCompare ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="wg-dash-compact-btn ml-auto"
              onClick={() => onCompare(job.id)}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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
