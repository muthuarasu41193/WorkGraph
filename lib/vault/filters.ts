import type { VaultDifficulty, VaultResult } from "@/lib/vault";
import { isVaultGuideStale, VAULT_STALE_AFTER_DAYS } from "@/lib/vault/freshness";

export const VAULT_SORTS = ["relevance", "freshness"] as const;
export type VaultSort = (typeof VAULT_SORTS)[number];

export function isVaultSort(value: string): value is VaultSort {
  return (VAULT_SORTS as readonly string[]).includes(value);
}

export type VaultBrowseFilters = {
  q?: string;
  company?: string;
  role?: string;
  interview_round?: string;
  difficulty?: VaultDifficulty;
  rounds?: number;
  result?: VaultResult;
  date_from?: string;
  date_to?: string;
  sort?: VaultSort;
};

export type VaultBrowseItem = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  interview_round: string | null;
  skills: string[];
  difficulty: VaultDifficulty | null;
  rounds: number | null;
  result: VaultResult | null;
  interview_date: string | null;
  published_at: string | null;
  updated_at?: string | null;
  content_confirmed_at: string | null;
  avg_rating: number | null;
  sales_count: number;
  /** Optional relevance score when sorting by relevance (higher is better). */
  relevanceScore?: number;
};

function norm(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesVaultBrowseFilters(item: VaultBrowseItem, filters: VaultBrowseFilters): boolean {
  const q = filters.q?.trim();
  if (q) {
    const hay = norm(
      [item.company, item.role, item.level ?? "", item.interview_round ?? "", ...item.skills].join(" "),
    );
    if (!hay.includes(norm(q))) return false;
  }
  if (filters.company?.trim()) {
    if (!norm(item.company).includes(norm(filters.company))) return false;
  }
  if (filters.role?.trim()) {
    if (!norm(item.role).includes(norm(filters.role))) return false;
  }
  if (filters.interview_round?.trim()) {
    const round = item.interview_round ?? "";
    if (!norm(round).includes(norm(filters.interview_round))) return false;
  }
  if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
  if (filters.rounds != null && item.rounds !== filters.rounds) return false;
  if (filters.result && item.result !== filters.result) return false;
  if (filters.date_from && item.interview_date && item.interview_date < filters.date_from) return false;
  if (filters.date_to && item.interview_date && item.interview_date > filters.date_to) return false;
  return true;
}

function confirmedMs(item: VaultBrowseItem): number {
  const iso = item.content_confirmed_at ?? item.published_at ?? item.updated_at;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Default relevance: rating + sales, with a small freshness boost for non-stale guides. */
export function defaultRelevanceScore(item: VaultBrowseItem, now = Date.now()): number {
  const rating = item.avg_rating ?? 0;
  const sales = item.sales_count ?? 0;
  const stale = isVaultGuideStale(item.content_confirmed_at ?? item.published_at, {
    now,
    thresholdDays: VAULT_STALE_AFTER_DAYS,
  });
  return rating * 10 + Math.min(sales, 50) + (stale ? 0 : 15);
}

export function sortVaultBrowseItems(
  items: VaultBrowseItem[],
  sort: VaultSort = "relevance",
  now = Date.now(),
): VaultBrowseItem[] {
  const copy = [...items];
  if (sort === "freshness") {
    return copy.sort((a, b) => confirmedMs(b) - confirmedMs(a) || a.company.localeCompare(b.company));
  }
  return copy.sort((a, b) => {
    const sa = a.relevanceScore ?? defaultRelevanceScore(a, now);
    const sb = b.relevanceScore ?? defaultRelevanceScore(b, now);
    return sb - sa || a.company.localeCompare(b.company);
  });
}

export function filterAndSortVaultBrowse(
  items: VaultBrowseItem[],
  filters: VaultBrowseFilters,
  now = Date.now(),
): VaultBrowseItem[] {
  const matched = items.filter((item) => matchesVaultBrowseFilters(item, filters));
  return sortVaultBrowseItems(matched, filters.sort ?? "relevance", now);
}
