/**
 * Alert digest runner for Vercel Cron and the session "test digest" path.
 * Service-role reads still filter by alert.user_id. No resume text in emails.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAlertCatalogFetch } from "@/lib/alerts/catalog";
import {
  buildAlertDigestEmail,
  toDigestEmailJob,
  type DigestEmailJob,
} from "@/lib/alerts/digest-email";
import { signDigestUnsubscribeToken } from "@/lib/alerts/digest-token";
import { ALERT_MATCH_LIMIT, findAlertMatches } from "@/lib/alerts/match";
import type { JobAlert } from "@/lib/alerts/types";
import { getAppBaseUrl, sendWorkgraphEmail, type SendEmailInput } from "@/lib/email/workgraph-mail";
import type { ProfileMatchInput } from "@/lib/job-match";
import { parseStatedSalary } from "@/lib/salary-parse";

/** Soft cap so a Hobby/Pro function stays within the time budget; next run resumes. */
export const DIGEST_ALERT_BATCH_CAP = 40;

/** Monday in Asia/Calcutta (IST) — weekly digests send only on this weekday. */
export const DIGEST_WEEKLY_WEEKDAY_IST = 1;

const DAILY_MIN_GAP_MS = 20 * 60 * 60 * 1000;
const WEEKLY_MIN_GAP_MS = 6 * 24 * 60 * 60 * 1000;

export type DigestAlertRow = Pick<
  JobAlert,
  "id" | "user_id" | "name" | "query" | "min_match" | "frequency" | "discreet" | "last_sent_at" | "created_at"
>;

export type DigestRunResult = {
  scanned: number;
  usersConsidered: number;
  emailsSent: number;
  emailsSkippedEmpty: number;
  emailsFailed: number;
  alertsUpdated: number;
  capped: boolean;
};

export type DigestSendFn = (input: SendEmailInput) => Promise<{ ok: true } | { ok: false; error: string }>;

export type DigestDeps = {
  now?: Date;
  batchCap?: number;
  sendEmail?: DigestSendFn;
  resolveUserEmail?: (userId: string) => Promise<string | null>;
  /** Override catalog matching (tests). Default: live catalog via admin client. */
  matchForAlert?: (
    alert: DigestAlertRow,
    profile: ProfileMatchInput | null,
    since: Date,
  ) => Promise<DigestEmailJob[]>;
};

function mapAlertRow(row: Record<string, unknown>): DigestAlertRow {
  const frequency = row.frequency;
  const freq =
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
  };
}

/** Weekday 0=Sun … 6=Sat in Asia/Calcutta. */
export function weekdayInIst(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Calcutta",
    weekday: "short",
  }).formatToParts(date);
  const wd = parts.find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd ?? ""] ?? date.getUTCDay();
}

export function isAlertDue(alert: DigestAlertRow, now: Date): boolean {
  if (alert.frequency === "off") return false;
  const last = alert.last_sent_at ? new Date(alert.last_sent_at).getTime() : null;
  const lastValid = last != null && !Number.isNaN(last) ? last : null;

  if (alert.frequency === "daily") {
    if (lastValid == null) return true;
    return now.getTime() - lastValid >= DAILY_MIN_GAP_MS;
  }

  if (alert.frequency === "weekly") {
    if (weekdayInIst(now) !== DIGEST_WEEKLY_WEEKDAY_IST) return false;
    if (lastValid == null) return true;
    return now.getTime() - lastValid >= WEEKLY_MIN_GAP_MS;
  }

  return false;
}

export function sinceForAlert(alert: DigestAlertRow, now: Date): Date {
  if (alert.last_sent_at) {
    const last = new Date(alert.last_sent_at);
    if (!Number.isNaN(last.getTime())) return last;
  }
  const days = alert.frequency === "daily" ? 1 : 7;
  return new Date(now.getTime() - days * 86_400_000);
}

/**
 * Pure selection helper for tests: filter due alerts, order stably, apply hard cap.
 * Cap is on alert rows (resume next run via unchanged last_sent_at).
 */
export function selectDueAlertsForBatch(
  alerts: DigestAlertRow[],
  now: Date,
  batchCap = DIGEST_ALERT_BATCH_CAP,
): { due: DigestAlertRow[]; capped: boolean } {
  const due = alerts
    .filter((a) => isAlertDue(a, now))
    .sort((a, b) => a.id.localeCompare(b.id) || a.user_id.localeCompare(b.user_id));
  if (due.length <= batchCap) return { due, capped: false };
  return { due: due.slice(0, batchCap), capped: true };
}

function groupByUser(alerts: DigestAlertRow[]): Map<string, DigestAlertRow[]> {
  const map = new Map<string, DigestAlertRow[]>();
  for (const alert of alerts) {
    const list = map.get(alert.user_id) ?? [];
    list.push(alert);
    map.set(alert.user_id, list);
  }
  return map;
}

async function loadProfilesBatch(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, ProfileMatchInput | null>> {
  const out = new Map<string, ProfileMatchInput | null>();
  for (const id of userIds) out.set(id, null);
  if (userIds.length === 0) return out;

  const { data, error } = await admin
    .from("profiles")
    .select("id, skills, headline, summary")
    .in("id", userIds);

  if (error || !data) return out;

  for (const row of data as Record<string, unknown>[]) {
    const id = String(row.id);
    const skills = Array.isArray(row.skills)
      ? row.skills.filter((s): s is string => typeof s === "string")
      : [];
    out.set(id, {
      skills,
      headline: typeof row.headline === "string" ? row.headline : null,
      summary: typeof row.summary === "string" ? row.summary : null,
    });
  }
  return out;
}

async function defaultResolveUserEmail(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (!error && data.user?.email) return data.user.email.trim() || null;

  const { data: profile } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
  const email = (profile as { email?: string } | null)?.email;
  return email?.trim() || null;
}

function jobPageUrl(base: string, jobId: string): string {
  return `${base}/jobs/${encodeURIComponent(jobId)}`;
}

async function matchAlertToDigestJobs(
  admin: SupabaseClient,
  alert: DigestAlertRow,
  profile: ProfileMatchInput | null,
  since: Date,
): Promise<DigestEmailJob[]> {
  const base = getAppBaseUrl();
  const fetchCatalog = createAlertCatalogFetch(admin);
  // Capture descriptions for stated-salary labels without putting them in the email body.
  const descriptionById = new Map<string, string>();
  const wrappedFetch = async (
    filters: Parameters<typeof fetchCatalog>[0],
    sinceArg: Date,
  ) => {
    const rows = await fetchCatalog(filters, sinceArg);
    for (const row of rows) {
      const id = row.external_id || String(row.id);
      if (typeof row.description === "string") descriptionById.set(id, row.description);
    }
    return rows;
  };

  const matches = await findAlertMatches(alert, profile, since, wrappedFetch);
  return matches.map((m) => {
    const desc = descriptionById.get(m.id);
    const figure = parseStatedSalary(desc);
    const statedSalary =
      figure.kind === "range" || figure.kind === "single" ? figure.label : null;
    return toDigestEmailJob({
      title: m.title,
      company: m.company,
      location: m.location,
      statedSalary,
      postedAtIso: m.postedAtIso,
      source: m.source,
      jobUrl: jobPageUrl(base, m.id),
    });
  });
}

/**
 * Deduplicate jobs across a user's due alerts (cap ALERT_MATCH_LIMIT).
 * Prefer earlier alerts in stable id order.
 */
export function mergeJobsAcrossAlerts(perAlert: DigestEmailJob[][], limit = ALERT_MATCH_LIMIT): DigestEmailJob[] {
  const seen = new Set<string>();
  const out: DigestEmailJob[] = [];
  for (const list of perAlert) {
    for (const job of list) {
      const key = job.jobUrl || `${job.title}|${job.company}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(job);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export async function runAlertDigest(
  admin: SupabaseClient,
  deps: DigestDeps = {},
): Promise<DigestRunResult> {
  const now = deps.now ?? new Date();
  const batchCap = deps.batchCap ?? DIGEST_ALERT_BATCH_CAP;
  const send = deps.sendEmail ?? sendWorkgraphEmail;

  const { data, error } = await admin
    .from("job_alerts")
    .select("id, user_id, name, query, min_match, frequency, discreet, last_sent_at, created_at")
    .in("frequency", ["daily", "weekly"])
    .order("id", { ascending: true });

  if (error) {
    throw new Error("Could not load due alerts");
  }

  const all = (data ?? []).map((row) => mapAlertRow(row as Record<string, unknown>));
  const { due, capped } = selectDueAlertsForBatch(all, now, batchCap);
  const byUser = groupByUser(due);
  const userIds = [...byUser.keys()];

  const profiles = await loadProfilesBatch(admin, userIds);
  const base = getAppBaseUrl();

  let emailsSent = 0;
  let emailsSkippedEmpty = 0;
  let emailsFailed = 0;
  let alertsUpdated = 0;

  for (const userId of userIds) {
    const alerts = byUser.get(userId) ?? [];
    if (alerts.length === 0) continue;

    const profile = profiles.get(userId) ?? null;
    const perAlertJobs: DigestEmailJob[][] = [];
    for (const alert of alerts) {
      const since = sinceForAlert(alert, now);
      const jobs = deps.matchForAlert
        ? await deps.matchForAlert(alert, profile, since)
        : await matchAlertToDigestJobs(admin, alert, profile, since);
      perAlertJobs.push(jobs);
    }

    const jobs = mergeJobsAcrossAlerts(perAlertJobs);
    if (jobs.length === 0) {
      emailsSkippedEmpty += 1;
      continue;
    }

    const email =
      (deps.resolveUserEmail
        ? await deps.resolveUserEmail(userId)
        : await defaultResolveUserEmail(admin, userId)) ?? null;
    if (!email) {
      emailsFailed += 1;
      continue;
    }

    const discreet = alerts.some((a) => a.discreet);
    const primaryAlert = alerts[0]!;
    const unsubToken = signDigestUnsubscribeToken({
      alertId: discreet ? "all" : primaryAlert.id,
      userId,
    });
    const unsubscribeUrl = unsubToken
      ? `${base}/api/alerts/unsubscribe?token=${encodeURIComponent(unsubToken)}`
      : `${base}/alerts`;
    const manageAlertsUrl = `${base}/alerts`;

    const content = buildAlertDigestEmail({
      jobs,
      discreet,
      alertName: primaryAlert.name,
      unsubscribeUrl,
      manageAlertsUrl,
    });

    const headers: Record<string, string> = {};
    if (unsubToken) {
      headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const result = await send({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers: Object.keys(headers).length ? headers : undefined,
    });

    if (!result.ok) {
      emailsFailed += 1;
      continue;
    }

    emailsSent += 1;
    const sentAt = now.toISOString();
    for (const alert of alerts) {
      const { error: updateError } = await admin
        .from("job_alerts")
        .update({ last_sent_at: sentAt })
        .eq("id", alert.id)
        .eq("user_id", userId);
      if (!updateError) alertsUpdated += 1;
    }
  }

  return {
    scanned: all.length,
    usersConsidered: userIds.length,
    emailsSent,
    emailsSkippedEmpty,
    emailsFailed,
    alertsUpdated,
    capped,
  };
}

/**
 * Send one digest for a signed-in user's active alerts (test button).
 * Does not update last_sent_at (preview send).
 */
export async function sendTestDigestForUser(
  admin: SupabaseClient,
  userId: string,
  deps: DigestDeps = {},
): Promise<{ sent: boolean; jobCount: number; reason?: string }> {
  const now = deps.now ?? new Date();
  const send = deps.sendEmail ?? sendWorkgraphEmail;

  const { data, error } = await admin
    .from("job_alerts")
    .select("id, user_id, name, query, min_match, frequency, discreet, last_sent_at, created_at")
    .eq("user_id", userId)
    .in("frequency", ["daily", "weekly"])
    .order("id", { ascending: true });

  if (error) return { sent: false, jobCount: 0, reason: "load_failed" };
  const alerts = (data ?? []).map((row) => mapAlertRow(row as Record<string, unknown>));
  if (alerts.length === 0) return { sent: false, jobCount: 0, reason: "no_alerts" };

  const profiles = await loadProfilesBatch(admin, [userId]);
  const profile = profiles.get(userId) ?? null;
  const perAlertJobs: DigestEmailJob[][] = [];
  for (const alert of alerts) {
    const since = sinceForAlert(alert, now);
    const jobs = deps.matchForAlert
      ? await deps.matchForAlert(alert, profile, since)
      : await matchAlertToDigestJobs(admin, alert, profile, since);
    perAlertJobs.push(jobs);
  }
  const jobs = mergeJobsAcrossAlerts(perAlertJobs);
  if (jobs.length === 0) return { sent: false, jobCount: 0, reason: "no_matches" };

  const email =
    (deps.resolveUserEmail
      ? await deps.resolveUserEmail(userId)
      : await defaultResolveUserEmail(admin, userId)) ?? null;
  if (!email) return { sent: false, jobCount: jobs.length, reason: "no_email" };

  const discreet = alerts.some((a) => a.discreet);
  const primaryAlert = alerts[0]!;
  const base = getAppBaseUrl();
  const unsubToken = signDigestUnsubscribeToken({ alertId: "all", userId });
  const unsubscribeUrl = unsubToken
    ? `${base}/api/alerts/unsubscribe?token=${encodeURIComponent(unsubToken)}`
    : `${base}/alerts`;

  const content = buildAlertDigestEmail({
    jobs,
    discreet,
    alertName: primaryAlert.name,
    unsubscribeUrl,
    manageAlertsUrl: `${base}/alerts`,
  });

  const headers: Record<string, string> = {};
  if (unsubToken) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const result = await send({
    to: email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    headers: Object.keys(headers).length ? headers : undefined,
  });

  if (!result.ok) return { sent: false, jobCount: jobs.length, reason: "send_failed" };
  return { sent: true, jobCount: jobs.length };
}
