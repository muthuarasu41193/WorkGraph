import { createSupabaseAdminClient } from "./supabase-admin";
import {
  filterConsentedTestimonials,
  type SocialProofQueries,
  type TestimonialRow,
} from "./social-proof";

async function countExact(table: string, filters: Record<string, string> = {}): Promise<number> {
  const admin = createSupabaseAdminClient();
  if (!admin) return 0;
  let query = admin.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export function postgresSocialProofStore(): SocialProofQueries {
  return {
    countSignups: () => countExact("profiles"),
    countPublishedGuides: () => countExact("vault_experiences", { status: "published" }),
    countVerifiedOutcomes: () =>
      countExact("vault_experiences", { status: "published", result: "offer" }),
  };
}

function mapTestimonialRow(row: Record<string, unknown>): TestimonialRow {
  return {
    id: String(row.id ?? ""),
    author_name: String(row.author_name ?? ""),
    author_title: row.author_title != null ? String(row.author_title) : null,
    quote: String(row.quote ?? ""),
    consent_given_at: row.consent_given_at != null ? String(row.consent_given_at) : null,
    is_employee: Boolean(row.is_employee),
    verified_outcome: row.verified_outcome != null ? String(row.verified_outcome) : null,
    source: row.source != null ? String(row.source) : null,
  };
}

export async function getConsentedTestimonials(): Promise<TestimonialRow[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("testimonials")
    .select(
      "id, author_name, author_title, quote, consent_given_at, is_employee, verified_outcome, source",
    )
    .not("consent_given_at", "is", null)
    .order("consent_given_at", { ascending: false });
  if (error || !data) return [];
  return filterConsentedTestimonials(
    data.map((row) => mapTestimonialRow(row as Record<string, unknown>)),
  );
}
