/**
 * Catalog fetch for alert matching — one page query per alert, filtered by `since`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { JobRow } from "@/lib/job-dashboard";
import {
  fetchLiveJobsPage,
  type JobsCatalogFilters,
} from "@/lib/jobs-catalog";

import type { AlertCatalogFetch } from "./match";
import { ALERT_MATCH_LIMIT } from "./match";

/** Pull a modest pool (enough to score down to 10 matches) posted since `since`. */
export function createAlertCatalogFetch(supabase: SupabaseClient): AlertCatalogFetch {
  return async (filters, since) => {
    const sinceIso = since.toISOString();
    const merged: JobsCatalogFilters = { ...(filters ?? {}) };
    // Prefer the stricter of alert `since` vs any dateWindow already on the query.
    const page = await fetchLiveJobsPage(supabase, {
      page: 1,
      pageSize: 100,
      pageSizeCap: 100,
      filters: merged,
    });
    const rows = page.rows ?? [];
    return rows.filter((row) => {
      if (!row.posted_at) return false;
      const posted = new Date(row.posted_at).getTime();
      return !Number.isNaN(posted) && posted >= new Date(sinceIso).getTime();
    }) as JobRow[];
  };
}

export { ALERT_MATCH_LIMIT };
