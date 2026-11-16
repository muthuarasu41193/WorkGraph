"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Radar, RefreshCw } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import CommunitySourceFilterChips, {
  type CommunitySourceFilter,
} from "./CommunitySourceFilterChips";
import HiddenDiscoveryFilters from "./HiddenDiscoveryFilters";
import HiddenOpportunityCard, {
  type CommunityPostCardModel,
} from "./HiddenOpportunityCard";
import { useHiddenJobs } from "@/hooks/use-hidden-jobs";
import { useHiddenJobAnalytics } from "@/hooks/use-hidden-job-analytics";
import {
  readSavedOpportunityIds,
  toggleSavedOpportunity,
} from "@/lib/hidden-opportunities/saved-storage";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import EmptyState from "@/components/design-system/EmptyState";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RecommendedJobCard } from "@/lib/job-dashboard";
import { resolveJobSourceIconKey } from "@/lib/source-icons";

function opportunityToCard(opportunity: {
  id: string;
  source: string;
  title: string;
  company?: string;
  location?: string;
  url: string;
  author?: string;
  postedAt: string;
  category?: string;
}): CommunityPostCardModel {
  return {
    id: opportunity.id,
    source: opportunity.source,
    title: opportunity.title,
    company: opportunity.company,
    location: opportunity.location,
    url: opportunity.url,
    author: opportunity.author,
    postedAt: opportunity.postedAt,
    category: opportunity.category,
  };
}

function communityJobToCard(job: RecommendedJobCard): CommunityPostCardModel {
  return {
    id: `community:${job.id}`,
    source: job.source,
    title: job.title,
    company: job.company,
    location: job.location || undefined,
    url: job.applyUrl || "#",
    postedAt: job.postedAtIso || new Date().toISOString(),
  };
}

function isLinkedInPost(job: RecommendedJobCard): boolean {
  return resolveJobSourceIconKey(job.source, job.applyUrl) === "linkedin";
}

export default function HiddenDiscoverySection() {
  const { userId, communityPosts } = useDashboardContext();
  const { filters, setFilters, opportunities, meta, loading, error, reload } = useHiddenJobs();
  const { trackView, trackClick, trackSave } = useHiddenJobAnalytics();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<CommunitySourceFilter>(
    filters.source === "reddit" ? "reddit" : "all",
  );

  useEffect(() => {
    setSavedIds(readSavedOpportunityIds(userId));
  }, [userId]);

  const linkedInCards = useMemo(
    () => communityPosts.filter(isLinkedInPost).map(communityJobToCard),
    [communityPosts],
  );

  const visible = useMemo(() => {
    const hiddenCards = opportunities.map(opportunityToCard);
    let rows: CommunityPostCardModel[];

    if (sourceFilter === "linkedin") {
      rows = linkedInCards;
    } else if (sourceFilter === "reddit") {
      rows = hiddenCards;
    } else {
      const seen = new Set(hiddenCards.map((row) => row.url));
      rows = [
        ...hiddenCards,
        ...linkedInCards.filter((row) => row.url === "#" || !seen.has(row.url)),
      ];
    }

    if (!showSavedOnly) return rows;
    return rows.filter((row) => savedIds.has(row.id));
  }, [opportunities, linkedInCards, sourceFilter, showSavedOnly, savedIds]);

  const handleSourceFilterChange = useCallback(
    (next: CommunitySourceFilter) => {
      setSourceFilter(next);
      if (next === "reddit") {
        setFilters((f) => ({ ...f, source: "reddit" }));
        return;
      }
      // All + LinkedIn: clear API source so Reddit/HN/GitHub still load under All;
      // LinkedIn rows come from synced community posts.
      setFilters((f) => ({ ...f, source: "" }));
    },
    [setFilters],
  );

  const handleToggleSave = useCallback(
    (opportunityId: string, source?: string) => {
      const nowSaved = toggleSavedOpportunity(userId, opportunityId);
      setSavedIds(readSavedOpportunityIds(userId));
      if (nowSaved) trackSave(opportunityId, source);
    },
    [userId, trackSave],
  );

  const handleViewSource = useCallback(
    (url: string, opportunityId: string, source?: string) => {
      trackClick(opportunityId, source);
      if (url && url !== "#") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [trackClick],
  );

  const showProviderFeed = sourceFilter !== "linkedin";

  return (
    <section className="space-y-[var(--layout-stack-group)]" aria-labelledby="hidden-discovery-heading">
      <header className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="hidden-discovery-heading"
            className="text-role-subheading font-semibold tracking-tight text-ink"
          >
            Community posts
          </h1>
          <p className="mt-[var(--space-1)] text-role-caption text-ink-muted">
            Hiring posts from Reddit, LinkedIn, and more.
            {meta && showProviderFeed ? (
              <span>
                {" "}
                · {meta.filtered.toLocaleString()} indexed
                {meta.cached && meta.expiresAt
                  ? ` · cached until ${new Date(meta.expiresAt).toLocaleTimeString()}`
                  : ""}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-[var(--space-2)]">
          <Button
            type="button"
            variant={showSavedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSavedOnly((v) => !v)}
          >
            Saved ({savedIds.size})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void reload()}
            loading={loading}
            disabled={sourceFilter === "linkedin"}
          >
            <RefreshCw className={iconClass()} />
            Refresh
          </Button>
        </div>
      </header>

      <CommunitySourceFilterChips value={sourceFilter} onChange={handleSourceFilterChange} />

      <HiddenDiscoveryFilters filters={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} />

      {error && showProviderFeed ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {showProviderFeed && meta?.providerErrors && Object.keys(meta.providerErrors).length > 0 ? (
        <Alert>
          <AlertDescription className="text-role-body">
            Some sources could not be reached ({Object.keys(meta.providerErrors).join(", ")}). Other
            sources still loaded. If Reddit is missing, restart the app or click Refresh after deploy.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && showProviderFeed && visible.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : !loading && visible.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No opportunities match"
          description={
            sourceFilter === "linkedin"
              ? "LinkedIn community posts will appear here once sync adds them to your catalog."
              : "Try broadening your search, source, or date range to see more hidden roles."
          }
        />
      ) : (
        <ul className="flex flex-col gap-[var(--layout-card-gap)]">
          {visible.map((opportunity) => (
            <li key={opportunity.id}>
              <HiddenOpportunityCard
                opportunity={opportunity}
                saved={savedIds.has(opportunity.id)}
                onToggleSave={() => handleToggleSave(opportunity.id, opportunity.source)}
                onViewSource={() =>
                  handleViewSource(opportunity.url, opportunity.id, opportunity.source)
                }
                onVisible={() => trackView(opportunity.id, opportunity.source)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
