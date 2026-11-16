import { ExternalLink, Radio, Radar } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/design-system/EmptyState";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
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
    <Section
      titleId="home-hidden-heading"
      title="Hidden Jobs Feed"
      description={`Latest from Reddit, Hacker News, and GitHub — ${total.toLocaleString("en-IN")} opportunities indexed.`}
      action={{ href: dashboardHref("job-discovery"), label: "Open discovery" }}
      titleAddon={
        <span className="inline-flex items-center gap-[var(--space-1)] rounded-full bg-highlight px-[var(--space-2)] py-px text-role-caption text-highlight-ink">
          <Radio className={iconClass("inline", "animate-pulse")} aria-hidden />
          Live
        </span>
      }
    >
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
        <Card className="gap-0 p-0 md:p-0">
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-b border-hairline last:border-b-0">
                <article className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] transition-colors hover:bg-surface-sunken">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                      <Badge
                        variant="outline"
                        className={cn("h-5 px-[var(--space-2)] text-role-caption capitalize", WG_PLATFORM_CHIP_CLASS)}
                      >
                        {sourceLabel(item.source)}
                      </Badge>
                      <span className="text-role-caption text-ink-muted">{formatPostedAt(item.postedAt)}</span>
                      {item.tags.includes("remote") ? (
                        <Badge variant="secondary" className="h-5 px-[var(--space-2)] text-role-caption">
                          Remote
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-[var(--space-1)] truncate text-role-card-title">{item.title}</h3>
                    <p className="truncate text-role-caption text-ink-muted">
                      {[item.company, item.author, item.location].filter(Boolean).join(" · ") || "Community post"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 shrink-0 px-[var(--space-3)] text-role-button">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Open post
                      <ExternalLink className={iconClass()} />
                    </a>
                  </Button>
                </article>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Section>
  );
}
