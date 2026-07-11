import { Eye, Star, Wallet } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAmount, resolvePreferredCurrency } from "@/lib/currency";
import { getSessionUser } from "@/lib/auth/session-server";
import { loadWalletSnapshot } from "@/lib/home-dashboard";
import { loadUserProfile } from "@/lib/load-profile";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { getVaultHomeStats } from "@/lib/vault-server";

export default async function HomeVaultStatsSection() {
  const user = await getSessionUser();
  const [wallet, profile, vault] = await Promise.all([
    loadWalletSnapshot(),
    user ? loadUserProfile(user.id) : Promise.resolve(null),
    user && supabaseConfigured()
      ? getVaultHomeStats(user.id)
      : Promise.resolve({ views: 0, earningsInr: 0, rating: 0, ratingCount: 0 }),
  ]);
  const displayCurrency = resolvePreferredCurrency({
    walletCurrency: wallet?.currency,
    location: profile?.location,
  });

  return (
    <section className="space-y-4" aria-labelledby="home-vault-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="home-vault-heading" className="text-lg font-semibold tracking-tight">
            Your Interview Vault Stats
          </h2>
          <p className="text-sm text-muted-foreground">Prep content performance and marketplace earnings.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/interview-vault">Open marketplace</Link>
        </Button>
      </div>

      <Card className="wg-dash-section-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vault overview</CardTitle>
          <CardDescription>Views, earnings, and buyer ratings for your shared prep.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Eye className={iconClass("inline", "text-[var(--dash-accent)]")} />
                Views
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums">{vault.views.toLocaleString("en-IN")}</dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className={iconClass("inline", "text-[var(--dash-accent)]")} />
                Earnings
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums text-[var(--dash-accent)]">
                {formatCurrencyAmount(vault.earningsInr, displayCurrency)}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Star className={iconClass("inline", "text-[var(--dash-accent)]")} />
                Ratings
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums">
                {vault.rating > 0 ? vault.rating.toFixed(1) : "--"}
                <span className="text-sm font-normal text-muted-foreground"> / 5</span>
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{vault.ratingCount} reviews</p>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
