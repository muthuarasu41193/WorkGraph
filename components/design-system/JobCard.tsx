"use client";

import { useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import ResumeIntelligenceDialog from "@/components/talent-intelligence/ResumeIntelligenceDialog";
import {
  applyButtonLabel,
  type JobCardData,
} from "@/lib/job-card-data";
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

function matchPillClass(percent: number): string {
  if (percent > 80) return "bg-[#F0FDF4] text-[#16A34A]";
  if (percent >= 60) return "bg-[#EFF6FF] text-[#2563EB]";
  return "bg-[#F9FAFB] text-[#6B7280]";
}

function CompanyLogo({ company, logoUrl }: { company: string; logoUrl?: string }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-[10px] border border-[#F1F5F9] object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#F1F5F9] bg-gray-100 text-xs font-medium text-gray-500"
      aria-hidden
    >
      {companyInitials(company)}
    </span>
  );
}

function MetaSeparator() {
  return <span className="text-gray-300" aria-hidden> · </span>;
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
  const applyLabel = applyButtonLabel(job.source, job.isEasyApply);

  const subtitleParts = [job.company, job.location, job.employmentType || job.workMode].filter(Boolean);

  const metaParts: string[] = [];
  if (job.sourceLabel) metaParts.push(`via ${job.sourceLabel}`);
  if (job.postedAgo) metaParts.push(job.postedAgo);
  if (job.experience) metaParts.push(job.experience);

  const showSkillGaps = Boolean(job.missingSkills && job.missingSkills.length > 0);
  const jobDescription = job.description?.trim() || job.title;

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
      className={cn("job-card wg-job-card-enter group", className)}
    >
      {onSave ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave(job.id);
          }}
          aria-label={saved ? "Remove from saved" : "Save job"}
          className={cn(
            "job-card__bookmark absolute right-5 top-[18px] rounded-md p-1 text-gray-400 transition-colors hover:text-indigo-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
            saved && "opacity-100 text-indigo-600",
          )}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        </button>
      ) : null}

      <div className="job-card__header flex items-start gap-2.5 pr-6">
        <CompanyLogo company={job.company} logoUrl={job.companyLogo} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold leading-tight text-[#111827]">
                {job.title}
              </h3>
              {subtitleParts.length > 0 ? (
                <p className="mt-0.5 truncate text-[13px] leading-tight text-gray-500">
                  {subtitleParts.join(" · ")}
                </p>
              ) : null}
            </div>

            {job.matchPercent !== undefined ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight tabular-nums",
                  matchPillClass(job.matchPercent),
                )}
              >
                {job.matchPercent}% match
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <hr className="job-card__divider" />

      {metaParts.length > 0 ? (
        <p className="job-card__meta">
          {metaParts.map((part, i) => (
            <span key={part}>
              {i > 0 ? <MetaSeparator /> : null}
              {i === 0 && job.sourceLabel ? (
                <span className="font-medium text-gray-600">{part}</span>
              ) : (
                part
              )}
            </span>
          ))}
        </p>
      ) : null}

      {showSkillGaps ? (
        <div className="job-card__skill-gaps">
          <p className="text-[11px] leading-tight text-gray-400">Skill gaps</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {job.missingSkills!.map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] leading-tight text-gray-500"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "job-card__footer flex flex-wrap items-center gap-2",
          hasResume && canApply ? "justify-between" : "justify-end",
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {hasResume ? (
          <ResumeIntelligenceDialog
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
            jobDescription={jobDescription}
            hasResume={hasResume}
            variant="ghost"
            size="sm"
            triggerClassName="!min-h-0 h-auto gap-1 px-0 py-0 text-[13px] font-normal leading-tight text-gray-500 shadow-none hover:bg-transparent hover:text-indigo-600"
          />
        ) : null}

        {canApply ? (
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.stopPropagation();
              onApplyClick?.();
            }}
            className="job-card__apply-btn inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            {applyLabel}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </a>
        ) : null}
      </div>

      {children ? <div className="job-card__expanded">{children}</div> : null}
    </article>
  );
}
