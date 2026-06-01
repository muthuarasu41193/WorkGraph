"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { HiddenJobsQuery, HiddenJobsResponse } from "@/lib/hidden-opportunities/types";

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

async function fetchHiddenJobs(queryString: string): Promise<HiddenJobsResponse> {
  const res = await fetch(`/api/hidden-jobs?${queryString}`);
  const json = (await res.json()) as HiddenJobsResponse & { error?: string };
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

export function useHiddenJobs(initialFilters: Partial<HiddenJobsFilters> = {}) {
  const [filters, setFilters] = useState<HiddenJobsFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const queryKey = useMemo(() => buildSearchParams(filters), [filters]);

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["hidden-jobs", queryKey],
    queryFn: () => fetchHiddenJobs(queryKey),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
  });

  return {
    filters,
    setFilters,
    opportunities: data?.opportunities ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: () => void refetch(),
  };
}
