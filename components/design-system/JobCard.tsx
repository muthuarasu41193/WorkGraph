"use client";

import { useState, type ReactNode } from "react";
import { Bookmark } from "lucide-react";
import JobApplyButton from "@/components/design-system/JobApplyButton";
import SourceIcon from "@/components/icons/SourceIcon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { companyAvatarToneIndex, companyInitials } from "@/lib/company-avatar";
import { type JobCardData } from "@/lib/job-card-data";
import { matchReason } from "@/lib/job-match-reason";
import { parseStatedSalary } from "@/lib/salary-parse";
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
  /** Shown beside missing skills when the viewer has a resume. */
  tailorHref?: string | null;
  className?: string;
  children?: ReactNode;
};

const AVATAR_TONES = [
  "bg-surface-sunken text-ink",
  "bg-ink-wash text-ink",
  "bg-accent-wash text-ink",
  "bg-caution-wash text-ink",
  "bg-positive-wash text-ink",
] as const;

function isUsefulChip(value?: string): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  return normalized !== "see listing" && normalized !== "—" && normalized !== "-";
}

function CompanyLogo({ company, logoUrl }: { company: string; logoUrl?: string }) {
  const [failed, setFailed] = useState(false);
  const tone = AVATAR_TONES[companyAvatarToneIndex(company, AVATAR_TONES.length)] ?? AVATAR_TONES[0];

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-[8px] bg-surface-sunken object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "text-role-caption flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] font-semibold",
        tone,
      )}
      aria-hidden
    >
      {companyInitials(company)}
    </span>
  );
}

function JobChip({ children }: { children: string }) {
  return (
    <span className="text-role-caption rounded-[var(--radius-tag)] bg-surface-sunken px-1.5 py-px leading-tight text-ink-muted normal-case">
      {children}
    </span>
  );
}

function salaryLabel(job: JobCardData): string | null {
  const parsed = parseStatedSalary(job.description ?? "");
  if ((parsed.kind === "range" || parsed.kind === "single") && parsed.label?.trim()) {
    return parsed.label.trim();
  }
  const range = job.salaryRange?.trim();
  if (!range || range.toLowerCase() === "see listing") return null;
  return range;
}

function postedCaption(job: JobCardData): string | null {
  const ago = job.postedAgo?.trim();
  if (!ago) return null;
  if (/^posted\b/i.test(ago)) return ago;
  if (/^(today|yesterday|listed)/i.test(ago)) return `Posted ${ago}`;
  return `Posted ${ago}`;
}

function metaLine(job: JobCardData): string {
  return [job.company, job.location, job.workMode].filter(isUsefulChip).join(" · ");
}

function tagChips(job: JobCardData): string[] {
  return [job.workMode, job.employmentType, job.experience, job.location].filter(isUsefulChip);
}

export function JobCardSkeleton() {
  return (
    <Card size="sm" className="job-card gap-0 p-5" aria-hidden>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-[8px] wg-skeleton-shimmer" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 max-w-[240px] rounded wg-skeleton-shimmer" />
          <div className="h-3 w-1/2 max-w-[200px] rounded wg-skeleton-shimmer" />
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-5 w-16 rounded-[var(--radius-tag)] wg-skeleton-shimmer" />
            <div className="h-5 w-14 rounded-[var(--radius-tag)] wg-skeleton-shimmer" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="h-3 w-16 rounded wg-skeleton-shimmer" />
          <div className="h-5 w-14 rounded-[var(--radius-tag)] wg-skeleton-shimmer" />
          <div className="h-7 w-20 rounded wg-skeleton-shimmer" />
        </div>
      </div>
    </Card>
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
  const posted = postedCaption(job);
  const salary = salaryLabel(job);
  const matched = job.matchedSkills ?? [];
  const profileSkillCount = job.profileSkillCount ?? 0;
  const matchPercent =
    typeof job.matchPercent === "number" && job.matchPercent > 0
      ? Math.round(job.matchPercent)
      : null;
  const skillsLine =
    matched.length > 0 && profileSkillCount > 0
      ? matchReason(matched.length, profileSkillCount)
      : null;
  const meta = metaLine(job);
  const tags = tagChips(job);

  return (
    <Card
      id={id}
      size="sm"
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
      className={cn(
        "job-card wg-job-card-enter group min-w-0 gap-0 p-5",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <CompanyLogo company={job.company} logoUrl={job.companyLogo} />
          <span className="absolute -bottom-0.5 -right-0.5 rounded-md bg-surface-raised shadow-sm ring-1 ring-hairline">
            <SourceIcon
              source={job.source ?? "other"}
              url={applyHref}
              size={10}
              className="h-4 w-4 rounded-[4px]"
            />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-role-card-title line-clamp-2 min-w-0 text-ink" title={job.title}>
            {job.title}
          </h3>
          {meta ? (
            <p className="font-sans text-role-body mt-0.5 truncate text-ink-muted" title={meta}>
              {meta}
            </p>
          ) : null}
          {tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tags.map((chip) => (
                <JobChip key={chip}>{chip}</JobChip>
              ))}
            </div>
          ) : null}
          {skillsLine ? (
            <p className="text-role-caption mt-1.5 text-ink-muted">{skillsLine}</p>
          ) : null}
          {salary ? (
            <p className="text-role-caption mt-1 text-ink-subtle tabular-nums">{salary}</p>
          ) : null}
        </div>

        <div
          className="flex shrink-0 flex-col items-end gap-1.5 self-stretch"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {posted ? (
            <span className="text-role-caption whitespace-nowrap text-ink-subtle">{posted}</span>
          ) : null}
          {matchPercent != null ? (
            <Badge variant="secondary" className="bg-surface-sunken text-ink-muted">
              {matchPercent}% match
            </Badge>
          ) : null}
          {onSave || canApply ? (
            <div className="mt-auto flex items-center gap-1.5">
              {onSave ? (
                <IconButton
                  label={saved ? "Remove from saved" : "Save job"}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onSave(job.id)}
                  className={cn("text-ink-subtle hover:text-ink", saved && "text-ink")}
                >
                  <Bookmark className={cn("size-4", saved && "fill-current")} />
                </IconButton>
              ) : null}
              {canApply && applyHref ? (
                <JobApplyButton
                  jobId={job.id}
                  company={job.company}
                  title={job.title}
                  applyUrl={applyHref}
                  source={job.source}
                  onClick={onApplyClick}
                  variant="outline"
                  label="Apply"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {children ? <div className="job-card__expanded">{children}</div> : null}
    </Card>
  );
}
