import { ExternalLink, Radio } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WG_PLATFORM_CHIP_CLASS } from "@/lib/design-tokens";
import { loadHiddenJobsFeed } from "@/lib/home-dashboard";
import { cn } from "@/lib/utils";
import { dashboardHref } from "@/lib/dashboard-routes";

function formatPostedAt(iso: string): string {
  const posted = new Date(iso);
  if (Number.isNaN(posted.getTime())) return "Recently";
  const diffMs = Date.now() - posted.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(source: string): string {
  if (source === "hackernews") return "Hacker News";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export default async function HomeHiddenJobsFeed() {
  const { items, total } = await loadHiddenJobsFeed(5);

  return (
    <section className="space-y-4" aria-labelledby="home-hidden-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="home-hidden-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            Hidden Jobs Feed
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" aria-hidden />
              Live
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Latest from Reddit, Hacker News, and GitHub — {total.toLocaleString("en-IN")} opportunities indexed.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={dashboardHref("job-discovery")}>Open discovery</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Hidden job sources are warming up. Check back in a moment or open Hidden Jobs Discovery.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="wg-dash-section-card transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("capitalize", WG_PLATFORM_CHIP_CLASS)}>
                      {sourceLabel(item.source)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatPostedAt(item.postedAt)}</span>
                    {item.tags.includes("remote") ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Remote
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[item.company, item.author, item.location].filter(Boolean).join(" · ") || "Community post"}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Open post
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
