/**
 * Server-only aggregates for /admin/metrics. Uses the service role.
 * Returns zeros when Supabase or the table is unavailable.
 */
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

import { PRODUCT_EVENT_NAMES, type ProductEventName } from "./events";

export type EventWindowCounts = Record<ProductEventName, { d7: number; d30: number }>;

export type FunnelStage = {
  stage: string;
  event: ProductEventName;
  d7: number;
  d30: number;
};

export type MetricsSnapshot = {
  events: EventWindowCounts;
  funnel: FunnelStage[];
  revenueInr7: number;
  revenueInr30: number;
  revenueInrAll: number;
  activePasses: number;
  paidPassCount7: number;
  paidPassCount30: number;
};

const FUNNEL: Array<{ stage: string; event: ProductEventName }> = [
  { stage: "Signup", event: "signup" },
  { stage: "Resume uploaded", event: "resume_uploaded" },
  { stage: "Tailoring run", event: "tailoring_run" },
  { stage: "Pass checkout", event: "pass_checkout_started" },
  { stage: "Pass purchased", event: "pass_purchased" },
];

function emptyEvents(): EventWindowCounts {
  const out = {} as EventWindowCounts;
  for (const name of PRODUCT_EVENT_NAMES) {
    out[name] = { d7: 0, d30: 0 };
  }
  return out;
}

function emptySnapshot(): MetricsSnapshot {
  const events = emptyEvents();
  return {
    events,
    funnel: FUNNEL.map((row) => ({
      stage: row.stage,
      event: row.event,
      d7: 0,
      d30: 0,
    })),
    revenueInr7: 0,
    revenueInr30: 0,
    revenueInrAll: 0,
    activePasses: 0,
    paidPassCount7: 0,
    paidPassCount30: 0,
  };
}

function daysAgoIso(days: number, now: Date): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function paiseToInr(paise: number): number {
  if (!Number.isFinite(paise) || paise <= 0) return 0;
  return Math.round(paise) / 100;
}

export async function loadMetricsSnapshot(now = new Date()): Promise<MetricsSnapshot> {
  const admin = createSupabaseAdminClient();
  if (!admin) return emptySnapshot();

  const since7 = daysAgoIso(7, now);
  const since30 = daysAgoIso(30, now);
  const snapshot = emptySnapshot();

  try {
    const { data: rows, error } = await admin
      .from("product_events")
      .select("event, created_at")
      .gte("created_at", since30)
      .limit(50_000);

    if (!error && Array.isArray(rows)) {
      for (const row of rows) {
        const event = typeof row.event === "string" ? row.event : "";
        if (!(event in snapshot.events)) continue;
        const created = typeof row.created_at === "string" ? row.created_at : "";
        if (!created) continue;
        const bucket = snapshot.events[event as ProductEventName];
        bucket.d30 += 1;
        if (created >= since7) bucket.d7 += 1;
      }
    }

    snapshot.funnel = FUNNEL.map((row) => ({
      stage: row.stage,
      event: row.event,
      d7: snapshot.events[row.event].d7,
      d30: snapshot.events[row.event].d30,
    }));
  } catch {
    // keep zeros
  }

  try {
    const { data: payments, error } = await admin
      .from("payments")
      .select("amount_paise, status, created_at")
      .eq("status", "paid")
      .limit(50_000);

    if (!error && Array.isArray(payments)) {
      let sum7 = 0;
      let sum30 = 0;
      let sumAll = 0;
      let count7 = 0;
      let count30 = 0;
      for (const row of payments) {
        const amount = typeof row.amount_paise === "number" ? row.amount_paise : 0;
        const created = typeof row.created_at === "string" ? row.created_at : "";
        sumAll += amount;
        if (created >= since30) {
          sum30 += amount;
          count30 += 1;
        }
        if (created >= since7) {
          sum7 += amount;
          count7 += 1;
        }
      }
      snapshot.revenueInr7 = paiseToInr(sum7);
      snapshot.revenueInr30 = paiseToInr(sum30);
      snapshot.revenueInrAll = paiseToInr(sumAll);
      snapshot.paidPassCount7 = count7;
      snapshot.paidPassCount30 = count30;
    }
  } catch {
    // keep zeros
  }

  try {
    const nowIso = now.toISOString();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .neq("subscription_tier", "free")
      .limit(50_000);

    if (!error && Array.isArray(profiles)) {
      let active = 0;
      for (const row of profiles) {
        const tier = typeof row.subscription_tier === "string" ? row.subscription_tier : "free";
        if (tier === "free") continue;
        const expires = row.subscription_expires_at;
        if (expires == null || expires === "") {
          active += 1;
          continue;
        }
        if (typeof expires === "string" && expires > nowIso) active += 1;
      }
      snapshot.activePasses = active;
    }
  } catch {
    // keep zeros
  }

  return snapshot;
}
