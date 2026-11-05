import { redirect } from "next/navigation";
import VaultSellForm from "@/components/vault/VaultSellForm";
import { getSessionUser } from "@/lib/auth/session-server";
import { getSellerDraft } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function VaultSellPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/interview-vault/sell");
  }

  let draft = null;
  if (supabaseConfigured()) {
    try {
      draft = await getSellerDraft(user.id);
    } catch {
      draft = null;
    }
  }

  return <VaultSellForm initialDraft={draft} />;
}
