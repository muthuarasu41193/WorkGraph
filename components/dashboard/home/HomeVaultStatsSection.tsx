import { Eye, IndianRupee, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInr, loadWalletSnapshot, buildVaultStats } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export default async function HomeVaultStatsSection() {
  const wallet = await loadWalletSnapshot();
  const vault = buildVaultStats(wallet);

  return (
    <section className="space-y-3" aria-labelledby="home-vault-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="home-vault-heading" className="text-lg font-semibold tracking-tight">
            Your Interview Vault Stats
          </h2>
          <p className="text-sm text-muted-foreground">Prep content performance and marketplace earnings.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={dashboardHref("vault")}>Open vault</Link>
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
                <Eye className="h-4 w-4 text-[var(--dash-accent)]" />
                Views
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums">{vault.views.toLocaleString("en-IN")}</dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <IndianRupee className="h-4 w-4 text-[var(--dash-accent)]" />
                Earnings
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums text-[var(--dash-accent)]">
                {formatInr(vault.earningsInr)}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Star className="h-4 w-4 text-[var(--dash-accent)]" />
                Ratings
              </dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums">
                {vault.rating.toFixed(1)}
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
