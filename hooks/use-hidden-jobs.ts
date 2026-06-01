"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HiddenJobsQuery, HiddenJobsResponse, HiddenOpportunity } from "@/lib/hidden-opportunities/types";

export type HiddenJobsFilters = {
  q: string;
  source: HiddenJobsQuery["source"] | "";
  remote: boolean;
  country: string;
  postedWithinDays: number | null;
  sort: "newest" | "relevant";
};

const DEFAULT_FILTERS: HiddenJobsFilters = {
  q: "",
  source: "",
  remote: false,
  country: "",
  postedWithinDays: null,
  sort: "relevant",
};

function buildSearchParams(filters: HiddenJobsFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.source) params.set("source", filters.source);
  if (filters.remote) params.set("remote", "true");
  if (filters.country.trim()) params.set("country", filters.country.trim());
  if (filters.postedWithinDays) params.set("postedWithinDays", String(filters.postedWithinDays));
  params.set("sort", filters.sort);
  return params.toString();
}

export function useHiddenJobs(initialFilters: Partial<HiddenJobsFilters> = {}) {
  const [filters, setFilters] = useState<HiddenJobsFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [data, setData] = useState<HiddenJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => buildSearchParams(filters), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hidden-jobs?${queryKey}`, { cache: "no-store" });
      const json = (await res.json()) as HiddenJobsResponse & { error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const opportunities: HiddenOpportunity[] = data?.opportunities ?? [];

  return {
    filters,
    setFilters,
    opportunities,
    meta: data?.meta ?? null,
    loading,
    error,
    reload: load,
  };
}
