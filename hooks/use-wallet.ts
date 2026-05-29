"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WalletSummary, WalletTransaction } from "../packages/shared/types/phase3";
import { workgraphApiEnabled } from "../lib/workgraph-api";

type WalletPayload = WalletSummary & { transactions: WalletTransaction[] };

async function fetchWallet(): Promise<WalletPayload> {
  const res = await fetch("/api/v2/wallet", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load wallet");
  return res.json() as Promise<WalletPayload>;
}

export function useWallet() {
  return useQuery({
    queryKey: ["workgraph", "wallet"],
    queryFn: fetchWallet,
    enabled: workgraphApiEnabled(),
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amountCents: number) => {
      const res = await fetch("/api/v2/wallet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Payout request failed");
      }
      return res.json() as Promise<WalletSummary>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workgraph", "wallet"] });
      void qc.invalidateQueries({ queryKey: ["workgraph", "dashboard"] });
    },
  });
}
