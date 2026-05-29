"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { DashboardSnapshot, WalletSummary } from "../packages/shared/types/phase3";
import { useDashboardStore } from "../stores/dashboard-store";
import { workgraphApiEnabled } from "../lib/workgraph-api";

type DashboardPayload = {
  dashboard: DashboardSnapshot;
  wallet: WalletSummary;
};

async function fetchDashboard(): Promise<DashboardPayload | null> {
  if (!workgraphApiEnabled()) return null;
  const res = await fetch("/api/v2/dashboard", { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<DashboardPayload>;
}

export function useDashboardData(enabled = true) {
  const setDashboardData = useDashboardStore((s) => s.setDashboardData);

  const query = useQuery({
    queryKey: ["workgraph", "dashboard"],
    queryFn: fetchDashboard,
    enabled: enabled && workgraphApiEnabled(),
  });

  useEffect(() => {
    if (query.data) {
      setDashboardData(query.data.dashboard, query.data.wallet);
    }
  }, [query.data, setDashboardData]);

  return query;
}
