"use client";

import { ArrowRight, Radar } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HiddenDiscoveryPromoCard() {
  const { navigate } = useDashboardNavigation();

  return (
    <Card className="wg-dash-section-card overflow-hidden border-border bg-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-sm">
            <Radar className={iconClass("standalone")} aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Hidden Jobs Discovery
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Hiring posts from Reddit, Hacker News, and GitHub — separate from your main Jobs
              feed. Updated every 30 minutes; every link opens the original source.
            </p>
          </div>
        </div>
        <Button type="button" className="shrink-0 gap-2" onClick={() => navigate("job-discovery")}>
          Open discovery
          <ArrowRight className={iconClass()} />
        </Button>
      </CardContent>
    </Card>
  );
}
