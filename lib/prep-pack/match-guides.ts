import type { VaultExperienceListItem } from "@/lib/vault";
import { vaultFreshnessLabel } from "./freshness";
import type { PrepPackGuideMatch } from "./types";

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function scoreGuide(
  guide: VaultExperienceListItem,
  queryTerms: string[],
  companyHint: string | null,
): { score: number; reason: string } {
  const haystack = tokenize([guide.company, guide.role, guide.level ?? ""].join(" "));
  const hayset = new Set(haystack);
  let score = 0;
  const hits: string[] = [];

  for (const term of queryTerms) {
    if (hayset.has(term) || haystack.some((h) => h.includes(term) || term.includes(h))) {
      score += 2;
      hits.push(term);
    }
  }

  if (companyHint) {
    const company = guide.company.toLowerCase();
    const hint = companyHint.toLowerCase();
    if (company.includes(hint) || hint.includes(company)) {
      score += 8;
      hits.unshift("company");
    }
  }

  if (guide.avg_rating != null) score += Math.min(2, guide.avg_rating / 2.5);
  if (guide.price_inr === 0) score += 0.5;

  const uniqueHits = [...new Set(hits)].slice(0, 4);
  const reason =
    uniqueHits.length > 0
      ? `Matched on ${uniqueHits.join(", ")}`
      : "Related published guide in Interview Vault";

  return { score, reason };
}

export function matchVaultGuides(options: {
  guides: VaultExperienceListItem[];
  searchTerms: string[];
  companyHint?: string | null;
  limit?: number;
  now?: number;
}): PrepPackGuideMatch[] {
  const limit = options.limit ?? 6;
  const companyHint = options.companyHint?.trim() || null;
  const queryTerms = [...new Set(options.searchTerms.flatMap(tokenize))].slice(0, 24);

  const ranked = options.guides
    .map((guide) => {
      const { score, reason } = scoreGuide(guide, queryTerms, companyHint);
      return { guide, score, reason };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ guide, reason }) => ({
    id: guide.id,
    company: guide.company,
    role: guide.role,
    level: guide.level,
    rounds: guide.rounds,
    interview_date: guide.interview_date,
    price_inr: guide.price_inr,
    preview: guide.preview,
    avg_rating: guide.avg_rating,
    freshness_label: vaultFreshnessLabel(guide.interview_date, guide.published_at, options.now),
    match_reason: reason,
    source: "firsthand_guide" as const,
  }));
}
