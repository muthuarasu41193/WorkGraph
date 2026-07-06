"use client";

import {
  Bookmark,
  Building2,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobCardData } from "@/lib/job-card-data";
import { matchScoreClass } from "@/lib/tokens/classes";
import { cn } from "@/lib/utils";

export type { JobCardData } from "@/lib/job-card-data";

type Props = {
  job: JobCardData;
  index?: number;
  onSave?: (id: string) => void;
  onViewSource?: (id: string) => void;
  onCompare?: (id: string) => void;
  saved?: boolean;
  className?: string;
};

function CompanyLogo({ company, logo }: { company: string; logo?: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-[var(--shadow-sm)] ring-2 ring-[var(--surface-primary)]"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--interactive-hover)] text-body font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-sm)]"
    >
      {company.charAt(0).toUpperCase()}
    </span>
  );
}

function matchTier(percent: number): keyof typeof matchScoreClass {
  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  if (percent >= 40) return "low";
  return "none";
}

function MatchScoreRing({ percent }: { percent: number }) {
  const tier = matchTier(percent);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const strokeClass =
    tier === "high"
      ? "stroke-[var(--success)]"
      : tier === "medium"
        ? "stroke-[var(--accent)]"
        : tier === "low"
          ? "stroke-[var(--warning)]"
          : "stroke-[var(--text-tertiary)]";

  return (
    <div
      className="relative flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center"
      aria-label={`${percent}% resume match`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          className="stroke-[var(--surface-secondary)]"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          className={cn(strokeClass, "transition-[stroke-dashoffset] duration-500")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-caption font-bold tabular-nums leading-none text-[var(--text-primary)]">
        {percent}
      </span>
      <span className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        Match
      </span>
    </div>
  );
}

function displaySkills(job: JobCardData): string[] {
  return job.skills?.length ? job.skills : (job.matchedSkills ?? []);
}

function isRemoteJob(job: JobCardData): boolean {
  if (job.isRemote) return true;
  if (job.workMode?.toLowerCase() === "remote") return true;
  return job.location.toLowerCase().includes("remote");
}

export default function JobCard({
  job,
  index = 0,
  onSave,
  onViewSource,
  saved = false,
  className,
}: Props) {
  const skills = displaySkills(job);
  const remote = isRemoteJob(job);
  const sourceHref = job.sourceUrl?.trim() || job.applyUrl?.trim();

  return (
    <article
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        "wg-premium-job-card wg-job-card-enter group relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-300 ease-[var(--ease-out)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)]/0 via-transparent to-[var(--info-subtle)]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-[var(--accent-subtle)]/40 group-hover:to-[var(--info-subtle)]/20"
      />

      <div className="relative flex gap-4">
        <CompanyLogo company={job.company} logo={job.companyLogo} />

        <div className="min-w-0 flex-1">
          <h3 className="text-body-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent)]">
            {job.title}
          </h3>
          <p className="mt-0.5 text-body font-medium text-[var(--text-secondary)]">{job.company}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {job.location}
            </span>
            {job.salaryRange ? (
              <span className="font-semibold text-[var(--text-primary)]">{job.salaryRange}</span>
            ) : null}
          </div>
        </div>

        {job.matchPercent !== undefined ? (
          <MatchScoreRing percent={job.matchPercent} />
        ) : null}
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {remote ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-subtle)] px-2.5 py-1 text-caption font-semibold text-[var(--success)]">
            <Globe className="h-3 w-3" aria-hidden />
            Remote
          </span>
        ) : null}
        {job.employmentType ? (
          <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-caption font-medium text-[var(--text-secondary)]">
            {job.employmentType}
          </span>
        ) : null}
        {!job.employmentType && job.workMode && !remote ? (
          <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-caption font-medium text-[var(--text-secondary)]">
            {job.workMode}
          </span>
        ) : null}
        {job.postedAgo ? (
          <span className="inline-flex items-center gap-1 text-caption text-[var(--text-tertiary)]">
            <Clock className="h-3 w-3" aria-hidden />
            {job.postedAgo}
          </span>
        ) : null}
      </div>

      {skills.length > 0 ? (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-[var(--accent-subtle)]/70 px-2 py-0.5 text-caption font-medium text-[var(--accent)]"
            >
              {skill}
            </span>
          ))}
          {job.missingSkills?.slice(0, 2).map((skill) => (
            <span
              key={`miss-${skill}`}
              className="rounded-md bg-[var(--surface-secondary)] px-2 py-0.5 text-caption font-medium text-[var(--text-tertiary)]"
            >
              +{skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
        {job.source ? (
          <span className="text-caption font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            via {job.source}
          </span>
        ) : (
          <span className="text-caption text-[var(--text-tertiary)]" aria-hidden>
            &nbsp;
          </span>
        )}

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onSave ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="wg-dash-compact-btn text-[var(--text-secondary)] hover:text-[var(--accent)]"
              onClick={() => onSave(job.id)}
              aria-label={saved ? "Remove from saved" : "Save job"}
              aria-pressed={saved}
            >
              <Bookmark
                className={cn("h-3.5 w-3.5", saved && "fill-current text-[var(--accent)]")}
              />
              {saved ? "Saved" : "Save"}
            </Button>
          ) : null}

          {job.applyUrl ? (
            <Button asChild size="sm" variant="primary" className="wg-dash-compact-btn">
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                <Zap className="h-3.5 w-3.5" />
                Apply
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="wg-dash-compact-btn" disabled>
              <Building2 className="h-3.5 w-3.5" />
              Apply
            </Button>
          )}

          {sourceHref && (onViewSource || job.sourceUrl) ? (
            onViewSource ? (
              <Button
                type="button"
                size="sm"
                variant="link"
                className="wg-dash-compact-btn opacity-80 transition-opacity group-hover:opacity-100"
                onClick={() => onViewSource(job.id)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Source
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="link"
                className="wg-dash-compact-btn opacity-80 transition-opacity group-hover:opacity-100"
              >
                <a href={sourceHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Source
                </a>
              </Button>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
