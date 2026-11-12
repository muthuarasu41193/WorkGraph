"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Bookmark } from "lucide-react";
import JobApplyButton from "@/components/design-system/JobApplyButton";
import SourceIcon from "@/components/icons/SourceIcon";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { type JobCardData } from "@/lib/job-card-data";
import { formatJobPostedCompact } from "@/lib/job-freshness";
import { parseStatedSalary } from "@/lib/salary-parse";
import { matchReason } from "@/lib/job-match-reason";
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
  /** Shown beside missing skills when the viewer has a resume. */
  tailorHref?: string | null;
  className?: string;
  children?: ReactNode;
};

const AVATAR_TONES = [
  { bg: "var(--wg-surface-sunken)", fg: "var(--wg-text-secondary)" },
  { bg: "color-mix(in srgb, var(--wg-brand-50) 80%, var(--wg-surface-sunken))", fg: "var(--wg-brand-800)" },
  { bg: "color-mix(in srgb, var(--wg-info-50) 85%, var(--wg-surface-sunken))", fg: "var(--wg-text-secondary)" },
  { bg: "color-mix(in srgb, var(--wg-success-50) 85%, var(--wg-surface-sunken))", fg: "var(--wg-text-secondary)" },
  { bg: "color-mix(in srgb, var(--wg-warning-50) 85%, var(--wg-surface-sunken))", fg: "var(--wg-text-secondary)" },
  { bg: "color-mix(in srgb, var(--wg-slate-100) 90%, var(--wg-surface-sunken))", fg: "var(--wg-text-muted)" },
] as const;

function hashCompanyName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Initials unique enough that single-word companies do not all collapse to the same pair. */
function companyInitials(name: string): string {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}\s&.+-]/gu, "");
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const second = parts[1][0] ?? "";
    return `${first}${second}`.toUpperCase();
  }
  const word = parts[0];
  if (word.length === 1) return word.toUpperCase();
  return `${word[0]}${word[word.length - 1]}`.toUpperCase();
}

function avatarTone(company: string) {
  return AVATAR_TONES[hashCompanyName(company.toLowerCase()) % AVATAR_TONES.length];
}

function isUsefulChip(value?: string): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  return normalized !== "see listing" && normalized !== "—" && normalized !== "-";
}

function salaryLabel(job: JobCardData): string | null {
  const parsed = parseStatedSalary(job.description ?? "");
  if (parsed.kind === "range" || parsed.kind === "single") {
    const label = parsed.label?.trim();
    return label || null;
  }
  const range = job.salaryRange?.trim();
  if (!range || range.toLowerCase() === "see listing") return null;
  return range;
}

function CompanyLogo({
  company,
  logoUrl,
  source,
  applyUrl,
}: {
  company: string;
  logoUrl?: string;
  source?: JobCardData["source"];
  applyUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const tone = useMemo(() => avatarTone(company), [company]);
  const initials = useMemo(() => companyInitials(company), [company]);

  return (
    <div className="job-card__logo relative shrink-0">
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt=""
          className="h-10 w-10 rounded-lg bg-surface-sunken object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="text-role-caption flex h-10 w-10 items-center justify-center rounded-lg font-semibold"
          style={{ background: tone.bg, color: tone.fg } as CSSProperties}
          aria-hidden
        >
          {initials}
        </span>
      )}
      {source || applyUrl ? (
        <span className="job-card__source-badge absolute -bottom-1 -right-1">
          <SourceIcon
            source={source ?? "other"}
            url={applyUrl}
            size={10}
            className="h-4 w-4 rounded-[4px] border border-surface bg-surface shadow-xs"
          />
        </span>
      ) : null}
    </div>
  );
}

function JobChip({ children }: { children: string }) {
  return (
    <span className="text-role-caption rounded-[var(--radius-tag)] bg-surface-sunken px-1.5 py-0.5 leading-tight text-ink-muted normal-case">
      {children}
    </span>
  );
}

function MatchPill({ percent }: { percent: number }) {
  return (
    <span className="text-role-caption inline-flex shrink-0 items-center rounded-full bg-surface-sunken px-2 py-0.5 font-medium tabular-nums text-ink-muted">
      {Math.round(percent)}% match
    </span>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="job-card gap-0 p-5 md:p-5" aria-hidden size="sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg wg-skeleton-shimmer" />
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
          <div className="h-5 w-14 rounded-full wg-skeleton-shimmer" />
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
  const postedLabel = formatJobPostedCompact(job.postedAtIso) ?? (job.postedAgo?.trim() || null);
  const salary = salaryLabel(job);
  const matched = job.matchedSkills ?? [];
  const skillsReason =
    job.matchPercent !== undefined ? matchReason(matched.length, job.profileSkillCount ?? 0) : null;
  const showMatchPill =
    typeof job.matchPercent === "number" && Number.isFinite(job.matchPercent) && job.matchPercent > 0;

  const metaParts = (() => {
    const parts: string[] = [];
    for (const value of [job.company, job.location, job.workMode]) {
      if (!isUsefulChip(value)) continue;
      if (parts.some((part) => part.toLowerCase() === value.toLowerCase())) continue;
      parts.push(value);
    }
    return parts;
  })();
  const tags = [
    job.employmentType,
    job.experience,
    skillsReason ?? undefined,
    salary ?? undefined,
  ].filter(isUsefulChip);
  // Avoid duplicating values already shown in the meta line.
  const uniqueTags = tags.filter(
    (tag) => !metaParts.some((part) => part.toLowerCase() === tag.toLowerCase()),
  );

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
        "job-card wg-job-card-enter group min-w-0 gap-0 p-5 md:p-5",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo
          company={job.company}
          logoUrl={job.companyLogo}
          source={job.source}
          applyUrl={applyHref}
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-role-card-title line-clamp-2 min-w-0 text-ink" title={job.title}>
            {job.title}
          </h3>

          {metaParts.length > 0 ? (
            <p className="text-role-body mt-0.5 truncate text-ink-muted" title={metaParts.join(" · ")}>
              {metaParts.join(" · ")}
            </p>
          ) : null}

          {uniqueTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {uniqueTags.map((tag) => (
                <JobChip key={tag}>{tag}</JobChip>
              ))}
            </div>
          ) : null}
        </div>

        <div className="job-card__aside flex shrink-0 flex-col items-end gap-1.5 self-stretch">
          {postedLabel ? (
            <span className="text-role-caption leading-tight text-ink-subtle">{postedLabel}</span>
          ) : null}
          {showMatchPill ? <MatchPill percent={job.matchPercent!} /> : null}
          <div
            className="job-card__actions mt-auto flex items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {onSave ? (
              <IconButton
                type="button"
                variant="ghost"
                size="icon-sm"
                label={saved ? "Remove from saved" : "Save job"}
                onClick={() => onSave(job.id)}
                className={cn("job-card__bookmark text-ink-subtle hover:text-ink", saved && "text-ink")}
              >
                <Bookmark className={cn(iconClass("inline"), saved && "fill-current")} />
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
              />
            ) : null}
          </div>
        </div>
      </div>

      {children ? <div className="job-card__expanded">{children}</div> : null}
    </Card>
  );
}
