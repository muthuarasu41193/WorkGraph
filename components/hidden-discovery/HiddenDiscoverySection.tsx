"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radar, RefreshCw } from "lucide-react";
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            id="hidden-discovery-heading"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            <Radar className="h-7 w-7 text-primary" />
            Hidden Jobs Discovery
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Community hiring signals from Reddit, Hacker News, and GitHub — not duplicated from your
            Jobs page (ATS listings stay under Jobs).
          </p>
          {meta ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {meta.filtered} shown · {meta.total} unique ·{" "}
              {meta.cached ? `cached until ${meta.expiresAt ? new Date(meta.expiresAt).toLocaleTimeString() : "—"}` : "fresh fetch"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
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

      <Card className="wg-dash-section-card border-blue-200/50 bg-muted/30">
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Quick start</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Wait a few seconds while we load posts from Reddit, Hacker News, and GitHub.</li>
            <li>Use <strong>Search</strong> or filters (Remote, Source, Date) to narrow results.</li>
            <li>Click <strong>View Original Source</strong> to open the listing on Reddit, HN, GitHub, or the company site.</li>
            <li>Click <strong>Save</strong> to bookmark roles you want to revisit (stored in your browser).</li>
          </ol>
          <p className="text-xs">
            Bookmark this page:{" "}
            <code className="rounded bg-muted px-1 py-0.5">/discovery</code> or{" "}
            <code className="rounded bg-muted px-1 py-0.5">/profile?view=job-discovery</code>
          </p>
        </CardContent>
      </Card>

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
        <ul className="space-y-3">
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
