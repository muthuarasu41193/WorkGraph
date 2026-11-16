/**
 * Server-only product event recorder. Never throws: validation and write failures
 * log a stable error code and return { ok: false }.
 */
import { z } from "zod";

import { logErrorCode } from "@/lib/security/log";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { uuidSchema } from "@/lib/validation/primitives";

import { BLOCKED_PROP_KEYS, PRODUCT_EVENT_NAME_SET, type ProductEventName } from "./events";

const MAX_PROPS_BYTES = 1024;
const MAX_PROP_KEYS = 12;
const PROP_KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;
const PROP_ENUM_RE = /^[a-zA-Z0-9_]{1,40}$/;

const propValueSchema = z.union([
  z.boolean(),
  z.number().finite().gte(-1_000_000_000).lte(1_000_000_000),
  z.string().regex(PROP_ENUM_RE),
]);

export type RecordEventResult = { ok: true } | { ok: false; reason: string };

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate props: small enums/numbers/booleans only. Rejects PII-looking keys
 * (including `email`) and oversized payloads.
 */
export function validateEventProps(props: unknown): Record<string, string | number | boolean> | null {
  if (props === undefined || props === null) return {};
  if (typeof props !== "object" || Array.isArray(props)) return null;

  const entries = Object.entries(props as Record<string, unknown>);
  if (entries.length > MAX_PROP_KEYS) return null;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, raw] of entries) {
    if (!PROP_KEY_RE.test(key)) return null;
    if (BLOCKED_PROP_KEYS.has(key)) return null;
    if (key.includes("email") || key.includes("phone") || key.includes("resume")) return null;

    const parsed = propValueSchema.safeParse(raw);
    if (!parsed.success) return null;
    if (typeof parsed.data === "string" && looksLikeEmail(parsed.data)) return null;
    out[key] = parsed.data;
  }

  try {
    if (JSON.stringify(out).length > MAX_PROPS_BYTES) return null;
  } catch {
    return null;
  }
  return out;
}

export function isKnownProductEvent(event: string): event is ProductEventName {
  return PRODUCT_EVENT_NAME_SET.has(event);
}

/**
 * Insert one product_events row via the service role. Safe to call from any
 * server success path. Never throws.
 */
export async function recordEvent(
  event: string,
  userId?: string | null,
  props?: Record<string, unknown> | null,
): Promise<RecordEventResult> {
  try {
    if (!isKnownProductEvent(event)) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "unknown_event" };
    }

    const safeProps = validateEventProps(props ?? {});
    if (safeProps === null) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "invalid_props" };
    }

    let safeUserId: string | null = null;
    if (userId != null && userId !== "") {
      const id = uuidSchema.safeParse(userId);
      if (!id.success) {
        logErrorCode("metrics/record", "metrics_record_failed");
        return { ok: false, reason: "invalid_user" };
      }
      safeUserId = id.data;
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "unconfigured" };
    }

    const { error } = await admin.from("product_events").insert({
      event,
      user_id: safeUserId,
      props: safeProps,
    });

    if (error) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "insert_failed" };
    }

    return { ok: true };
  } catch {
    logErrorCode("metrics/record", "metrics_record_failed");
    return { ok: false, reason: "unexpected" };
  }
}

/**
 * Record signup at most once per user (best-effort). Used from auth callback /
 * sync-session so login does not inflate the funnel.
 */
export async function recordSignupOnce(userId: string): Promise<RecordEventResult> {
  try {
    const id = uuidSchema.safeParse(userId);
    if (!id.success) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "invalid_user" };
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      logErrorCode("metrics/record", "metrics_record_failed");
      return { ok: false, reason: "unconfigured" };
    }

    const { data, error } = await admin
      .from("product_events")
      .select("id")
      .eq("user_id", id.data)
      .eq("event", "signup")
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table may not exist yet; still try insert so first deploy after migration works.
      return recordEvent("signup", id.data);
    }
    if (data) return { ok: true };

    return recordEvent("signup", id.data);
  } catch {
    return recordEvent("signup", userId);
  }
}
