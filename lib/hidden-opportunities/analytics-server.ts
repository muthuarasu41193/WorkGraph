import { createClient } from "@supabase/supabase-js";
import type { HiddenJobAnalyticsBody } from "./types";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function recordHiddenJobAnalytics(
  userId: string | null,
  body: HiddenJobAnalyticsBody,
): Promise<{ ok: boolean; persisted: boolean }> {
  const supabase = serviceClient();
  if (!supabase) {
    return { ok: true, persisted: false };
  }

  const { error } = await supabase.from("hidden_job_analytics").insert({
    user_id: userId,
    opportunity_id: body.opportunityId,
    event_type: body.event,
    source: body.source ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (body.event === "save" && userId) {
    await supabase.from("hidden_job_saves").upsert(
      {
        user_id: userId,
        opportunity_id: body.opportunityId,
        source: body.source ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,opportunity_id" },
    );
  }

  return { ok: true, persisted: true };
}

export async function listSavedOpportunityIds(userId: string): Promise<Set<string>> {
  const supabase = serviceClient();
  if (!supabase) return new Set();

  const { data, error } = await supabase
    .from("hidden_job_saves")
    .select("opportunity_id")
    .eq("user_id", userId);

  if (error || !data) return new Set();
  return new Set(data.map((row) => String(row.opportunity_id)));
}
