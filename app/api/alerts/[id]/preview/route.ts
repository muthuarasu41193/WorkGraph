import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAlertCatalogFetch } from "@/lib/alerts/catalog";
import { findAlertMatches } from "@/lib/alerts/match";
import { AlertsApiError, getAlertForUser } from "@/lib/alerts/server";
import { loadUserProfile } from "@/lib/load-profile";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  alertIdSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function previewSince(frequency: string, lastSentAt: string | null): Date {
  if (lastSentAt) {
    const last = new Date(lastSentAt);
    if (!Number.isNaN(last.getTime())) return last;
  }
  const days = frequency === "daily" ? 1 : 7;
  return new Date(Date.now() - days * 86_400_000);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(alertIdSchema, id);
    const alert = await getAlertForUser(id);
    const profile = await loadUserProfile(alert.user_id);
    const matchProfile = profile
      ? { skills: profile.skills, headline: profile.headline, summary: profile.summary }
      : null;
    const supabase = createServerSupabaseClient(await cookies());
    const since = previewSince(alert.frequency, alert.last_sent_at);
    const matches = await findAlertMatches(
      alert,
      matchProfile,
      since,
      createAlertCatalogFetch(supabase),
    );
    return NextResponse.json({
      ok: true,
      since: since.toISOString(),
      matches,
      estimateNote: "Match scores are estimates based on your profile skills, not hiring probabilities.",
    });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid alert id.", style: "ok" });
    }
    if (err instanceof AlertsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not preview alert. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not preview alert. Please try again.",
      style: "ok",
    });
  }
}
