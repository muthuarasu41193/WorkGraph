import VaultMarketplace from "@/components/vault/VaultMarketplace";
import { listPublishedExperiences } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function InterviewVaultPage() {
  let experiences: Awaited<ReturnType<typeof listPublishedExperiences>> = [];

  if (supabaseConfigured()) {
    try {
      experiences = await listPublishedExperiences();
    } catch {
      experiences = [];
    }
  }

  return <VaultMarketplace initialExperiences={experiences} />;
}
