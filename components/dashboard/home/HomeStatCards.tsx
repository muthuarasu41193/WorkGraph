import type { LucideIcon } from "lucide-react";
import { Briefcase, EyeOff, FileText, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyAmount, type SupportedCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { HomeStatCards as HomeStatCardsData } from "@/lib/home-dashboard";

type StatDef = {
  label: string;
  value: string;
  icon: LucideIcon;
  delayClass: string;
};

function StatCard({ label, value, icon: Icon, delayClass }: StatDef) {
  return (
    <Card
      className={cn(
        "wg-dash-section-card wg-dash-stat-enter border-border bg-card shadow-sm",
        delayClass,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

export default function HomeStatCards({ stats }: { stats: HomeStatCardsData }) {
  const vaultCurrency = (stats.vaultEarningsCurrency ?? "INR") as SupportedCurrency;
  const cards: StatDef[] = [
    {
      label: "New Jobs Matched Today",
      value: stats.matchedToday.toLocaleString("en-IN"),
      icon: Briefcase,
      delayClass: "wg-dash-stat-enter",
    },
    {
      label: "Hidden Jobs Found",
      value: stats.hiddenJobsFound.toLocaleString("en-IN"),
      icon: EyeOff,
      delayClass: "[animation-delay:60ms]",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toLocaleString("en-IN"),
      icon: FileText,
      delayClass: "[animation-delay:120ms]",
    },
    {
      label: "Vault Earnings",
      value: formatCurrencyAmount(stats.vaultEarningsInr, vaultCurrency),
      icon: Wallet,
      delayClass: "[animation-delay:180ms]",
    },
  ];

  return (
    <section aria-label="Dashboard summary">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
