import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ConsentCategories } from "@/lib/consent";
import { buildConsentLogInsert } from "@/lib/consent-log";

export async function recordConsentLog(input: {
  userId: string | null;
  anonymousId: string;
  categories: ConsentCategories;
  policyVersion: string;
  ipCountry: string | null;
}): Promise<{ ok: true; persisted: boolean }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: true, persisted: false };
  }

  const row = buildConsentLogInsert(input);
  const { error } = await supabase.from("consent_log").insert(row);
  if (error) {
    const missingTable = /consent_log|schema cache|does not exist/i.test(error.message);
    if (missingTable) {
      return { ok: true, persisted: false };
    }
    throw new Error(error.message);
  }
  return { ok: true, persisted: true };
}
