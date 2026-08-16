"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import {
  SOCIAL_PLATFORM_TABS,
  filterPostsByPlatform,
  countPostsByPlatform,
  type SocialPlatform,
} from "@/lib/job-social-platforms";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function JobNewsSection() {
  const { recommendedJobs, communityPosts, feedKind } = useDashboardContext();
  const [platform, setPlatform] = useState<SocialPlatform>("all");

  const allPosts = useMemo(() => {
    const merged = [...communityPosts];
    for (const job of recommendedJobs) {
      if ((job.isCommunity || job.kind === "post") && !merged.some((p) => p.id === job.id)) {
        merged.push(job);
      }
    }
    return merged;
  }, [communityPosts, recommendedJobs]);

  const counts = useMemo(() => countPostsByPlatform(allPosts), [allPosts]);
  const filtered = useMemo(() => filterPostsByPlatform(allPosts, platform), [allPosts, platform]);

  return (
    <section className="space-y-3" aria-labelledby="job-news-heading">
      <header>
        <h1 id="job-news-heading" className="text-xl font-semibold tracking-tight text-fg-primary">Job News</h1>
        <p className="mt-0.5 text-[13px] text-fg-secondary">
          Hiring posts and community listings from social platforms — filtered by source.
        </p>
        {feedKind === "live" ? (
          <p className="mt-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
            {allPosts.length} posts synced from your jobs database
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by platform">
        {SOCIAL_PLATFORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={platform === tab.id}
            onClick={() => setPlatform(tab.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors",
              platform === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-fg-secondary hover:bg-muted",
            )}
          >
            {tab.label}
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
              {counts[tab.id]}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="py-8 text-center text-[13px] text-fg-secondary">
            No posts for this platform yet. Community sync adds Reddit, Hacker News, RemoteOK, and more daily.
          </CardContent>
        </Card>
      ) : (
        <ul className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {filtered.map((post) => (
            <li key={post.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <article className="flex items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="h-5 px-1.5 text-[11px] capitalize">
                      {post.source}
                    </Badge>
                    {post.kind === "post" ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">Post</Badge>
                    ) : null}
                    <span className="text-[12px] text-fg-secondary">{post.postedAgo}</span>
                  </div>
                  <h2 className="mt-0.5 text-[14px] font-semibold leading-snug tracking-tight text-fg-primary">
                    {post.title}
                  </h2>
                  <p className="truncate text-[12.5px] text-fg-secondary">
                    {post.company} · {post.location}
                  </p>
                  {post.description ? (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-fg-secondary">{post.description}</p>
                  ) : null}
                </div>
                {post.applyUrl ? (
                  <Button asChild size="sm" variant="outline" className="mt-0.5 h-7 shrink-0 px-2.5 text-[12px]">
                    <a href={post.applyUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className={iconClass()} />
                      Open post
                    </a>
                  </Button>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
