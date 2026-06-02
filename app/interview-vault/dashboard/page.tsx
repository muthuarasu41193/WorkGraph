import { redirect } from "next/navigation";
import VaultDashboard from "@/components/vault/VaultDashboard";
import { getSessionUser } from "@/lib/auth/session-server";
import { getSellerDashboard } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function VaultDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/interview-vault/dashboard");
  }

  if (!supabaseConfigured()) {
    return (
      <p className="text-sm text-muted-foreground">
        Interview Vault requires Supabase. Configure your environment to use the seller dashboard.
      </p>
    );
  }

  let dashboard: Awaited<ReturnType<typeof getSellerDashboard>>;
  try {
    dashboard = await getSellerDashboard(user.id);
  } catch {
    dashboard = {
      total_earnings_inr: 0,
      total_views: 0,
      total_sales: 0,
      experiences: [],
      sales_by_day: [],
    };
  }

  return <VaultDashboard dashboard={dashboard} />;
}
