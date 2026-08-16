import { ExternalLink, Radio, Radar } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/design-system/EmptyState";
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
    <section className="space-y-3" aria-labelledby="home-hidden-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="home-hidden-heading" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg-primary">
            Hidden Jobs Feed
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Radio className={iconClass("inline", "animate-pulse")} aria-hidden />
              Live
            </span>
          </h2>
          <p className="mt-0.5 text-[13px] text-fg-secondary">
            Latest from Reddit, Hacker News, and GitHub — {total.toLocaleString("en-IN")} opportunities indexed.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={dashboardHref("job-discovery")}>Open discovery</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Hidden sources are warming up"
          description="Reddit, Hacker News, and GitHub opportunities will land here. Open discovery to browse meanwhile."
          action={
            <Button asChild size="sm">
              <Link href={dashboardHref("job-discovery")}>Open discovery</Link>
            </Button>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {items.map((item) => (
            <li key={item.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <article className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={cn("h-5 px-1.5 text-[11px] capitalize", WG_PLATFORM_CHIP_CLASS)}>
                      {sourceLabel(item.source)}
                    </Badge>
                    <span className="text-[12px] text-fg-secondary">{formatPostedAt(item.postedAt)}</span>
                    {item.tags.includes("remote") ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                        Remote
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-fg-primary">
                    {item.title}
                  </h3>
                  <p className="truncate text-[12.5px] text-fg-secondary">
                    {[item.company, item.author, item.location].filter(Boolean).join(" · ") || "Community post"}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 shrink-0 px-2.5 text-[12px]">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Open post
                    <ExternalLink className={iconClass()} />
                  </a>
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
