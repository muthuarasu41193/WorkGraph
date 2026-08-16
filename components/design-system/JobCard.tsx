"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import ResumeIntelligenceDialog from "@/components/talent-intelligence/ResumeIntelligenceDialog";
import JobApplyButton from "@/components/design-system/JobApplyButton";
import { type JobCardData } from "@/lib/job-card-data";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";
import "./job-card.css";

export type { JobCardData } from "@/lib/job-card-data";

type Props = {
  job: JobCardData;
  index?: number;
  id?: string;
  saved?: boolean;
  onSave?: (id: string) => void;
  onClick?: () => void;
  onApplyClick?: () => void;
  hasResume?: boolean;
  className?: string;
  children?: React.ReactNode;
};

function companyInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "CO";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function matchBadgeClass(percent: number): string {
  if (percent >= 80) return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (percent >= 60) return "border-red-100 bg-red-50 text-red-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function isUsefulChip(value?: string): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  return normalized !== "see listing" && normalized !== "—" && normalized !== "-";
}

function CompanyLogo({ company, logoUrl }: { company: string; logoUrl?: string }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-md bg-slate-100 object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[12px] font-semibold text-slate-700"
      aria-hidden
    >
      {companyInitials(company)}
    </span>
  );
}

function JobChip({ children }: { children: string }) {
  return (
    <span className="rounded-[6px] bg-slate-50 px-1.5 py-px text-[11px] leading-tight text-slate-600">
      {children}
    </span>
  );
}

function MatchBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11.5px] font-semibold leading-tight tabular-nums",
        matchBadgeClass(percent),
        className,
      )}
    >
      {percent}% match
    </span>
  );
}

function BookmarkButton({
  saved,
  onSave,
}: {
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSave();
      }}
      aria-label={saved ? "Remove from saved" : "Save job"}
      className={cn(
        "job-card__bookmark wg-touch-target -mr-0.5 -mt-0.5 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
        saved && "opacity-100 text-slate-700",
      )}
    >
      <Bookmark className={cn(iconClass("inline"), saved && "fill-current")} />
    </button>
  );
}

export function JobCardSkeleton() {
  return (
    <article className="job-card" aria-hidden>
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-md wg-skeleton-shimmer" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 w-28 rounded wg-skeleton-shimmer" />
            <div className="h-3 w-36 rounded wg-skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-2/3 max-w-[240px] rounded wg-skeleton-shimmer" />
          <div className="h-5 w-16 shrink-0 rounded-[6px] wg-skeleton-shimmer" />
        </div>
        <div className="h-10 w-full rounded-lg wg-skeleton-shimmer" />
      </div>

      <div className="hidden md:flex md:items-start md:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-md wg-skeleton-shimmer" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-4 w-2/3 max-w-[240px] rounded wg-skeleton-shimmer" />
            <div className="h-3 w-1/2 max-w-[200px] rounded wg-skeleton-shimmer" />
            <div className="flex gap-1.5 pt-0.5">
              <div className="h-5 w-16 rounded-[6px] wg-skeleton-shimmer" />
              <div className="h-5 w-14 rounded-[6px] wg-skeleton-shimmer" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="h-5 w-16 rounded-[6px] wg-skeleton-shimmer" />
          <div className="h-9 w-[5.5rem] rounded-lg wg-skeleton-shimmer" />
        </div>
      </div>
    </article>
  );
}

export default function JobCard({
  job,
  index = 0,
  id,
  saved = false,
  onSave,
  onClick,
  onApplyClick,
  hasResume = false,
  className,
  children,
}: Props) {
  const applyHref = job.applyUrl?.trim();
  const canApply = Boolean(applyHref);
  const jobDescription = job.description?.trim() || job.title;
  const workType = job.workMode || job.employmentType;

  const metaParts = [job.company, job.location, workType].filter((part, i, arr) => {
    const value = part?.trim();
    return Boolean(value) && arr.findIndex((item) => item?.trim() === value) === i;
  });

  const locationMeta = [job.location, workType].filter((part, i, arr) => {
    const value = part?.trim();
    return Boolean(value) && arr.findIndex((item) => item?.trim() === value) === i;
  });

  const chips = [job.salaryRange, job.experience, job.postedAgo].filter(isUsefulChip);
  const showSkillGaps = Boolean(job.missingSkills && job.missingSkills.length > 0);

  function renderExtras() {
    return (
      <>
        {chips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <JobChip key={chip}>{chip}</JobChip>
            ))}
          </div>
        ) : null}

        {showSkillGaps ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.missingSkills!.map((skill) => (
              <span
                key={skill}
                className="rounded-[6px] border border-slate-200 bg-white px-1.5 py-0.5 text-[11.5px] leading-tight text-slate-500"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        {hasResume ? (
          <div
            className="mt-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ResumeIntelligenceDialog
              jobId={job.id}
              jobTitle={job.title}
              company={job.company}
              jobDescription={jobDescription}
              hasResume={hasResume}
              triggerClassName="analyze-btn"
            />
          </div>
        ) : null}
      </>
    );
  }

  function renderApply(className?: string) {
    if (!canApply || !applyHref) return null;
    return (
      <JobApplyButton
        jobId={job.id}
        company={job.company}
        title={job.title}
        applyUrl={applyHref}
        source={job.source}
        onClick={onApplyClick}
        className={className}
      />
    );
  }

  return (
    <article
      id={id}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn("job-card wg-job-card-enter group min-w-0", onClick && "cursor-pointer", className)}
    >
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start gap-2.5">
          <CompanyLogo company={job.company} logoUrl={job.companyLogo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-snug text-slate-700">{job.company}</p>
            {locationMeta.length > 0 ? (
              <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-500">
                {locationMeta.join(" · ")}
              </p>
            ) : null}
          </div>
          {onSave ? <BookmarkButton saved={saved} onSave={() => onSave(job.id)} /> : null}
        </div>

        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-snug tracking-tight text-slate-900">
            {job.title}
          </h3>
          {job.matchPercent !== undefined ? <MatchBadge percent={job.matchPercent} /> : null}
        </div>

        {renderExtras()}

        {canApply ? (
          <div
            className="w-full"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {renderApply("w-full")}
          </div>
        ) : null}
      </div>

      <div className="hidden md:flex md:items-start md:gap-2.5">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <CompanyLogo company={job.company} logoUrl={job.companyLogo} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-snug tracking-tight text-slate-900">
                {job.title}
              </h3>
              {onSave ? <BookmarkButton saved={saved} onSave={() => onSave(job.id)} /> : null}
            </div>
            {metaParts.length > 0 ? (
              <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-500">
                {metaParts.join(" · ")}
              </p>
            ) : null}
            {renderExtras()}
          </div>
        </div>

        {job.matchPercent !== undefined || canApply ? (
          <div
            className="flex shrink-0 flex-col items-end gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {job.matchPercent !== undefined ? <MatchBadge percent={job.matchPercent} /> : null}
            {renderApply()}
          </div>
        ) : null}
      </div>

      {children ? <div className="job-card__expanded">{children}</div> : null}
    </article>
  );
}
