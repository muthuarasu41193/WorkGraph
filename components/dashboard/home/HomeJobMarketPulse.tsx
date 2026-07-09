import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobMarketPulse } from "@/lib/home-dashboard";

export default function HomeJobMarketPulse({ pulse }: { pulse: JobMarketPulse }) {
  return (
    <section className="space-y-4" aria-labelledby="home-pulse-heading">
      <h2 id="home-pulse-heading" className="text-lg font-semibold tracking-tight">
        Job Market Pulse
      </h2>
      <p className="text-sm text-muted-foreground">Trending roles and skills from your feed and market signals.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="wg-dash-section-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[var(--dash-accent)]" />
              Trending roles
            </CardTitle>
            <CardDescription>Highest momentum titles in your matched catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {pulse.trendingRoles.map((role, index) => (
                <li
                  key={role.title}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {role.title}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {role.growth}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="wg-dash-section-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trending skills</CardTitle>
            <CardDescription>In-demand skills aligned to your profile and listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pulse.trendingSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs font-medium">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
