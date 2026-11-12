import { cookies } from "next/headers";

import { getSessionUser } from "@/lib/auth/session-server";
import { recordEvent } from "@/lib/metrics/record";
import { checkSubscription } from "@/lib/subscription";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import {
  ALERT_MAX_PER_USER,
  type AlertCreateInput,
  type AlertFrequency,
  type AlertUpdateInput,
} from "@/lib/validation/alerts";
import { parseJobSearchQuery } from "@/lib/validation/job-search";
import { ValidationError } from "@/lib/validation/errors";

import type { JobAlert } from "./types";

export class AlertsApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const ALERT_SELECT =
  "id, user_id, name, query, min_match, frequency, discreet, last_sent_at, created_at, updated_at";

function mapAlertRow(row: Record<string, unknown>): JobAlert {
  const frequency = row.frequency;
  const freq: AlertFrequency =
    frequency === "daily" || frequency === "weekly" || frequency === "off" ? frequency : "weekly";
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: typeof row.name === "string" ? row.name : "",
    query: typeof row.query === "string" ? row.query : "",
    min_match: typeof row.min_match === "number" ? row.min_match : 40,
    frequency: freq,
    discreet: row.discreet !== false,
    last_sent_at: typeof row.last_sent_at === "string" ? row.last_sent_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

/** Normalize and re-parse so stored queries match what /jobs would show. */
export function normalizeAlertQuery(raw: string): string {
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const parsed = parseJobSearchQuery(params);
  const out = new URLSearchParams();
  if (parsed.q) out.set("q", parsed.q);
  if (parsed.sources.length) out.set("src", parsed.sources.join(","));
  if (parsed.dateWindow) out.set("date", parsed.dateWindow);
  if (parsed.locationMode) out.set("locMode", parsed.locationMode);
  if (parsed.locationQuery) out.set("loc", parsed.locationQuery);
  if (parsed.company) out.set("company", parsed.company);
  if (parsed.jobTypes.length) out.set("type", parsed.jobTypes.join(","));
  // Preserve non-catalog client filters that users save from /jobs.
  for (const key of [
    "match",
    "skillPick",
    "skills",
    "exp",
    "salMin",
    "salMax",
    "ccy",
    "salPeriod",
    "companySize",
    "industry",
    "benefits",
    "visa",
    "easy",
    "reqSkills",
    "sort",
  ]) {
    const value = params.get(key);
    if (value) out.set(key, value);
  }
  return out.toString().slice(0, 500);
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AlertsApiError("Unauthorized", 401);
  if (!supabaseConfigured()) {
    throw new AlertsApiError("Supabase is not configured", 503);
  }
  const supabase = createServerSupabaseClient(await cookies());
  return { user, supabase };
}

export type AlertFrequencyDeps = {
  readSubscription?: typeof checkSubscription;
};

/** Daily digests require an active WorkGraph Pass. Weekly and off are free. */
export async function assertAlertFrequencyAllowed(
  userId: string,
  frequency: AlertFrequency,
  deps?: AlertFrequencyDeps,
): Promise<void> {
  if (frequency !== "daily") return;
  const read = deps?.readSubscription ?? checkSubscription;
  const status = await read(userId);
  if (!status.isActive || status.tier === "free") {
    throw new AlertsApiError(
      "Daily alerts require an active WorkGraph Pass. Choose weekly or turn alerts off.",
      403,
    );
  }
}

/** Max 10 alerts per user — enforced in the API (not only by DB constraints). */
export function rejectIfAlertLimitReached(count: number | null | undefined): void {
  if ((count ?? 0) >= ALERT_MAX_PER_USER) {
    throw new AlertsApiError(`You can save up to ${ALERT_MAX_PER_USER} alerts.`, 400);
  }
}

export async function listAlertsForUser(): Promise<JobAlert[]> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("job_alerts")
    .select(ALERT_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new AlertsApiError("Could not load alerts. Please try again.", 500);
  return (data ?? []).map((row) => mapAlertRow(row as Record<string, unknown>));
}

export async function createAlertForUser(input: AlertCreateInput): Promise<JobAlert> {
  const { user, supabase } = await requireUser();
  await assertAlertFrequencyAllowed(user.id, input.frequency);

  const { count, error: countError } = await supabase
    .from("job_alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) throw new AlertsApiError("Could not create alert. Please try again.", 500);
  rejectIfAlertLimitReached(count);

  const query = normalizeAlertQuery(input.query);
  const { data, error } = await supabase
    .from("job_alerts")
    .insert({
      user_id: user.id,
      name: input.name,
      query,
      min_match: input.min_match,
      frequency: input.frequency,
      discreet: input.discreet,
    })
    .select(ALERT_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AlertsApiError("You already have an alert with that name.", 409);
    }
    throw new AlertsApiError("Could not create alert. Please try again.", 500);
  }
  return mapAlertRow(data as Record<string, unknown>);
}

export async function getAlertForUser(id: string): Promise<JobAlert> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("job_alerts")
    .select(ALERT_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new AlertsApiError("Could not load alert. Please try again.", 500);
  if (!data) throw new AlertsApiError("Alert not found", 404);
  return mapAlertRow(data as Record<string, unknown>);
}

export async function updateAlertForUser(id: string, patch: AlertUpdateInput): Promise<JobAlert> {
  const { user, supabase } = await requireUser();

  if (patch.frequency !== undefined) {
    await assertAlertFrequencyAllowed(user.id, patch.frequency);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("job_alerts")
    .select(ALERT_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw new AlertsApiError("Could not load alert. Please try again.", 500);
  if (!existing) throw new AlertsApiError("Alert not found", 404);

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.query !== undefined) updates.query = normalizeAlertQuery(patch.query);
  if (patch.min_match !== undefined) updates.min_match = patch.min_match;
  if (patch.frequency !== undefined) updates.frequency = patch.frequency;
  if (patch.discreet !== undefined) updates.discreet = patch.discreet;

  if (Object.keys(updates).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  const { data, error } = await supabase
    .from("job_alerts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(ALERT_SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new AlertsApiError("You already have an alert with that name.", 409);
    }
    throw new AlertsApiError("Could not update alert. Please try again.", 500);
  }
  if (!data) throw new AlertsApiError("Alert not found", 404);
  if (patch.frequency === "off") {
    await recordEvent("digest_unsubscribed", user.id);
  }
  return mapAlertRow(data as Record<string, unknown>);
}

export async function deleteAlertForUser(id: string): Promise<void> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("job_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) throw new AlertsApiError("Could not delete alert. Please try again.", 500);
  if (!data) throw new AlertsApiError("Alert not found", 404);
}
