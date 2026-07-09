"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import HiddenDiscoveryFilters from "./HiddenDiscoveryFilters";
import HiddenOpportunityCard from "./HiddenOpportunityCard";
import { useHiddenJobs } from "@/hooks/use-hidden-jobs";
import { useHiddenJobAnalytics } from "@/hooks/use-hidden-job-analytics";
import {
  readSavedOpportunityIds,
  toggleSavedOpportunity,
} from "@/lib/hidden-opportunities/saved-storage";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HiddenDiscoverySection() {
  const { userId } = useDashboardContext();
  const { filters, setFilters, opportunities, meta, loading, error, reload } = useHiddenJobs();
  const { trackView, trackClick, trackSave } = useHiddenJobAnalytics();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    setSavedIds(readSavedOpportunityIds(userId));
  }, [userId]);

  const visible = useMemo(() => {
    if (!showSavedOnly) return opportunities;
    return opportunities.filter((o) => savedIds.has(o.id));
  }, [opportunities, savedIds, showSavedOnly]);

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
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [trackClick],
  );

  return (
    <section className="space-y-4" aria-labelledby="hidden-discovery-heading">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="hidden-discovery-heading" className="text-xl font-semibold tracking-tight text-foreground">
            Unlisted Jobs
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hiring posts from Reddit, Hacker News, and GitHub.
            {meta ? (
              <span className="text-muted-foreground/80">
                {" "}
                · {meta.filtered.toLocaleString()} shown
                {meta.cached && meta.expiresAt
                  ? ` · cached until ${new Date(meta.expiresAt).toLocaleTimeString()}`
                  : ""}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant={showSavedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSavedOnly((v) => !v)}
          >
            Saved ({savedIds.size})
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </header>

      <HiddenDiscoveryFilters filters={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {meta?.providerErrors && Object.keys(meta.providerErrors).length > 0 ? (
        <Alert>
          <AlertDescription className="text-sm">
            Some sources could not be reached ({Object.keys(meta.providerErrors).join(", ")}). Other
            sources still loaded. If Reddit is missing, restart the app or click Refresh after deploy.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && visible.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Aggregating opportunities from providers…
          </CardContent>
        </Card>
      ) : null}

      {!loading && visible.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No opportunities match your filters. Try broadening search or date range.
          </CardContent>
        </Card>
      ) : (
        <ul className="hidden-discovery-feed">
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
