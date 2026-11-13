import VaultMarketplace from "@/components/vault/VaultMarketplace";
import { listPublishedExperiences } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function InterviewVaultPage() {
  let experiences: Awaited<ReturnType<typeof listPublishedExperiences>> = [];
  let loadError: string | null = null;

  if (!supabaseConfigured()) {
    loadError = "Interview Vault requires Supabase. Configure your environment to browse guides.";
  } else {
    try {
      experiences = await listPublishedExperiences();
    } catch {
      experiences = [];
      loadError = "Could not load Interview Vault guides. Try again shortly.";
    }
  }

  return <VaultMarketplace initialExperiences={experiences} loadError={loadError} />;
}
