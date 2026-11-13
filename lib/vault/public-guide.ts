import { vaultFreshnessDisplay } from "@/lib/vault/freshness";
import type { VaultDifficulty } from "@/lib/vault";

/**
 * Public metadata projection for marketplace cards and prep-pack matches.
 * Never includes paid body fields (questions_html, tips_html, rounds_data bodies).
 */

export type VaultPublicGuideProjection = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  interview_round: string | null;
  skills: string[];
  difficulty: string | null;
  rounds: number | null;
  avg_rating: number | null;
  price_inr: number;
  content_confirmed_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  stale: boolean;
  last_confirmed_label: string;
  stale_label: string | null;
  /** Round names only — never round descriptions. */
  roundNames: string[];
};

const LOCKED_KEYS = ["questions_html", "tips_html", "rounds_data", "full_content"] as const;

export function assertNoLockedVaultFields(payload: unknown): void {
  if (!payload || typeof payload !== "object") return;
  const obj = payload as Record<string, unknown>;
  for (const key of LOCKED_KEYS) {
    if (key in obj) {
      const value = obj[key];
      if (value == null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      throw new Error(`Locked vault field leaked: ${key}`);
    }
  }
}

export function projectPublicVaultGuide(
  row: {
    id: string;
    company: string;
    role: string;
    level?: string | null;
    interview_round?: string | null;
    skills?: string[] | null;
    difficulty?: VaultDifficulty | string | null;
    rounds?: number | null;
    avg_rating?: number | null;
    price_inr?: number;
    content_confirmed_at?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
    removed_at?: string | null;
    roundNames?: string[];
  },
  now = Date.now(),
): VaultPublicGuideProjection | null {
  if (row.removed_at) return null;

  const freshness = vaultFreshnessDisplay({
    updatedAt: row.updated_at,
    contentConfirmedAt: row.content_confirmed_at ?? row.published_at,
    now,
  });

  const projection: VaultPublicGuideProjection = {
    id: row.id,
    company: row.company,
    role: row.role,
    level: row.level ?? null,
    interview_round: row.interview_round ?? null,
    skills: Array.isArray(row.skills) ? row.skills.map(String).filter(Boolean).slice(0, 40) : [],
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    rounds: row.rounds ?? null,
    avg_rating: row.avg_rating ?? null,
    price_inr: Number(row.price_inr ?? 0),
    content_confirmed_at: row.content_confirmed_at ?? null,
    updated_at: row.updated_at ?? null,
    published_at: row.published_at ?? null,
    stale: freshness.stale,
    last_confirmed_label: freshness.lastConfirmedLabel ?? "Confirmation date not available",
    stale_label: freshness.staleLabel,
    roundNames: (row.roundNames ?? []).map((n) => String(n).slice(0, 120)).slice(0, 12),
  };

  assertNoLockedVaultFields(projection);
  return projection;
}
