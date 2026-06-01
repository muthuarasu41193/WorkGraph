import type { HiddenJobsQuery, HiddenJobAnalyticsBody, HiddenOpportunitySource } from "./types";
import { HIDDEN_OPPORTUNITY_SOURCES } from "./types";

const MAX_QUERY_LENGTH = 120;
const MAX_LIMIT = 300;

export function parseHiddenJobsQuery(searchParams: URLSearchParams): HiddenJobsQuery {
  const q = searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH) || undefined;
  const sourceRaw = searchParams.get("source")?.trim().toLowerCase();
  const source = HIDDEN_OPPORTUNITY_SOURCES.includes(sourceRaw as HiddenOpportunitySource)
    ? (sourceRaw as HiddenOpportunitySource)
    : undefined;

  const remote = searchParams.get("remote") === "1" || searchParams.get("remote") === "true";
  const country = searchParams.get("country")?.trim().slice(0, 64) || undefined;

  const postedWithinDaysRaw = searchParams.get("postedWithinDays");
  let postedWithinDays: number | undefined;
  if (postedWithinDaysRaw) {
    const n = Number.parseInt(postedWithinDaysRaw, 10);
    if (Number.isFinite(n) && n > 0 && n <= 365) postedWithinDays = n;
  }

  const sortRaw = searchParams.get("sort");
  const sort = sortRaw === "newest" ? "newest" : "relevant";

  const limitRaw = searchParams.get("limit");
  let limit = 200;
  if (limitRaw) {
    const n = Number.parseInt(limitRaw, 10);
    if (Number.isFinite(n)) limit = Math.min(Math.max(n, 1), MAX_LIMIT);
  }

  return { q, source, remote, country, postedWithinDays, sort, limit };
}

export function parseAnalyticsBody(body: unknown): HiddenJobAnalyticsBody | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body" };
  }
  const record = body as Record<string, unknown>;
  const opportunityId = String(record.opportunityId ?? "").trim().slice(0, 256);
  const event = record.event;
  const source = record.source != null ? String(record.source).trim().slice(0, 64) : undefined;

  if (!opportunityId) return { error: "opportunityId is required" };
  if (event !== "view" && event !== "click" && event !== "save") {
    return { error: "event must be view, click, or save" };
  }

  return { opportunityId, event, source };
}
