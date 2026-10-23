"use client";

import { useState, type ReactNode } from "react";
import { Bookmark } from "lucide-react";
import JobApplyButton from "@/components/design-system/JobApplyButton";
import { type JobCardData } from "@/lib/job-card-data";
import { formatJobFreshness } from "@/lib/job-freshness";
import { jobSourceName } from "@/lib/job-apply";
import { matchReason } from "@/lib/job-match-reason";
import { buildJobSummary, jobSummaryLabel } from "@/lib/job-summary";
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
  /** Kept so callers can still pass it. Analyze Resume renders on the detail panel, not the card. */
  hasResume?: boolean;
  className?: string;
  children?: ReactNode;
};

function companyInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "CO";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function neutralMatchClass(percent: number): string {
  if (percent >= 75) return "border-hairline bg-surface-sunken text-ink";
  if (percent >= 40) return "border-hairline bg-surface text-ink-muted";
  return "border-hairline bg-surface text-ink-subtle";
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
        className="h-9 w-9 shrink-0 rounded-md bg-surface-sunken object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="text-role-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken font-semibold text-ink"
      aria-hidden
    >
      {companyInitials(company)}
    </span>
  );
}

function JobChip({ children }: { children: string }) {
  return (
    <span className="text-role-caption rounded-control bg-surface-sunken px-1.5 py-px leading-tight text-ink-muted tabular-nums">
      {children}
    </span>
  );
}

function MatchMark({ percent, reason }: { percent: number; reason: string }) {
  return (
    <div className="shrink-0 text-right">
      <span
        className={cn(
          "text-role-caption inline-flex whitespace-nowrap rounded-control border px-2 py-0.5 font-semibold leading-tight tabular-nums",
          neutralMatchClass(percent),
        )}
      >
        {percent}% match
      </span>
      <p className="mt-1 max-w-40 text-role-caption font-normal text-ink-muted">{reason}</p>
    </div>
  );
}

function BookmarkButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSave();
      }}
      aria-label={saved ? "Remove from saved" : "Save job"}
      className={cn(
        "job-card__bookmark wg-touch-target shrink-0 rounded-md p-1 text-ink-subtle transition-colors hover:text-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline focus-visible:ring-offset-1",
        saved && "text-ink",
      )}
    >
      <Bookmark className={cn(iconClass("inline"), saved && "fill-current")} />
    </button>
  );
}

export function JobCardSkeleton() {
  return (
    <article className="job-card" aria-hidden>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-md wg-skeleton-shimmer" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 max-w-[240px] rounded wg-skeleton-shimmer" />
          <div className="h-3 w-1/2 max-w-[200px] rounded wg-skeleton-shimmer" />
          <div className="h-3 w-3/4 max-w-[280px] rounded wg-skeleton-shimmer" />
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-5 w-16 rounded-control wg-skeleton-shimmer" />
            <div className="h-5 w-14 rounded-control wg-skeleton-shimmer" />
          </div>
          <div className="h-8 w-full rounded wg-skeleton-shimmer" />
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
  className,
  children,
}: Props) {
  const applyHref = job.applyUrl?.trim();
  const canApply = Boolean(applyHref);
  const sourceName = jobSourceName(job.source, job.company);
  const salaryText = job.salaryRange?.trim() || "Salary not disclosed";
  const freshness = formatJobFreshness(job.postedAtIso);
  const meta = [salaryText, `via ${sourceName}`, freshness].filter((part): part is string => Boolean(part));
  const chips = [job.workMode, job.employmentType, job.experience, job.location].filter(isUsefulChip);
  const summary = buildJobSummary({
    description: job.description,
    company: job.company,
    generatedSummary: job.generatedSummary,
  });
  const matchedCount = job.matchedSkills?.length ?? 0;
  const reason =
    job.matchPercent !== undefined ? matchReason(matchedCount, job.profileSkillCount ?? 0) : null;

  function renderApply(extraClass?: string) {
    if (!canApply || !applyHref) return null;
    return (
      <JobApplyButton
        jobId={job.id}
        company={job.company}
        title={job.title}
        applyUrl={applyHref}
        source={job.source}
        onClick={onApplyClick}
        className={extraClass}
      />
    );
  }

  return (
    <article
      id={id}
      style={{ animationDelay: `calc(var(--duration-fast) * ${index} / 3)` }}
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
      <div className="flex items-start gap-2.5">
        <CompanyLogo company={job.company} logoUrl={job.companyLogo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-sans text-role-body-small line-clamp-2 min-w-0 flex-1 font-semibold text-ink" title={job.title}>
              {job.title}
            </h3>
            {job.matchPercent !== undefined && reason ? (
              <MatchMark percent={job.matchPercent} reason={reason} />
            ) : null}
          </div>
          <p className="font-sans text-role-caption mt-0.5 truncate text-ink-muted" title={job.company}>
            {job.company}
          </p>
          <p className="text-role-caption mt-1 text-ink-muted">{meta.join(" · ")}</p>
          {chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <JobChip key={chip}>{chip}</JobChip>
              ))}
            </div>
          ) : null}
          {summary ? (
            <p className="measure text-role-body-small mt-2 text-ink-muted">
              <span className="font-medium text-ink">{jobSummaryLabel(summary.kind)}. </span>
              {summary.text}
            </p>
          ) : null}
          {job.missingSkills && job.missingSkills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-role-caption rounded-control border border-hairline bg-surface-raised px-1.5 py-0.5 leading-tight text-ink-subtle"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {onSave || canApply ? (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {onSave ? <BookmarkButton saved={saved} onSave={() => onSave(job.id)} /> : <span />}
          {renderApply()}
        </div>
      ) : null}

      {children ? <div className="job-card__expanded">{children}</div> : null}
    </article>
  );
}
