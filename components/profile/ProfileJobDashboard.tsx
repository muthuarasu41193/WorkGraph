"use client";

import type { ReactNode } from "react";
import { Bookmark, CheckCircle2, Sparkles } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { formatCatalogUpdated } from "@/lib/catalog-updated";
import type { JobPipelineCounts } from "../../lib/job-dashboard";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
  matchedListings: number;
  /** Newest jobs.created_at. Omitted from the UI when null. */
  catalogUpdatedAt?: string | null;
};

type DashboardFilter = "matched" | "applied" | "saved";

function triggerFilter(filter: DashboardFilter) {
  document.querySelector("#recommended-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent("wg:job-filter", { detail: { filter } }));
}

function SummaryStat({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-1 text-role-caption text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {icon}
      <span className="font-semibold tabular-nums text-ink">{value.toLocaleString()}</span>
      <span>{label}</span>
    </button>
  );
}

/**
 * Slim counts for the Jobs page. Sync stays on the ingest worker; this row only
 * reports the last catalog write when one exists.
 */
export default function ProfileJobDashboard({
  stats,
  profileCompleteness,
  matchedListings,
  catalogUpdatedAt = null,
}: Props) {
  const updatedLabel = formatCatalogUpdated(catalogUpdatedAt);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Job summary">
      <SummaryStat
        label="matches"
        value={matchedListings}
        icon={<Sparkles className={iconClass("inline")} aria-hidden />}
        onClick={() => triggerFilter("matched")}
      />
      <SummaryStat
        label="saved"
        value={stats.saved}
        icon={<Bookmark className={iconClass("inline")} aria-hidden />}
        onClick={() => triggerFilter("saved")}
      />
      <SummaryStat
        label="applied"
        value={stats.applied}
        icon={<CheckCircle2 className={iconClass("inline")} aria-hidden />}
        onClick={() => triggerFilter("applied")}
      />
      {updatedLabel ? <p className="text-role-caption text-ink-subtle">{updatedLabel}</p> : null}
      {profileCompleteness < 100 ? (
        <p className="text-role-caption text-ink-subtle">Profile {profileCompleteness}% complete</p>
      ) : null}
    </div>
  );
}
