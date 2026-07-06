"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
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
    <section className="space-y-4" aria-labelledby="job-news-heading">
      <header>
        <h1 id="job-news-heading" className="text-heading-l">Job News</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Hiring posts and community listings from social platforms — filtered by source.
        </p>
        {feedKind === "live" ? (
          <p className="mt-1 text-caption font-medium text-success-foreground dark:text-success">
            {allPosts.length} posts synced from your jobs database
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by platform">
        {SOCIAL_PLATFORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={platform === tab.id}
            onClick={() => setPlatform(tab.id)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-body font-medium transition-colors",
              platform === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label}
            <Badge variant="secondary" className="h-5 px-1.5 text-caption">
              {counts[tab.id]}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="py-10 text-center text-body text-muted-foreground">
            No posts for this platform yet. Community sync adds Reddit, Hacker News, RemoteOK, and more daily.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((post) => (
            <li key={post.id}>
              <Card className="wg-dash-section-card transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {post.source}
                    </Badge>
                    {post.kind === "post" ? (
                      <Badge variant="secondary">Post</Badge>
                    ) : null}
                    <span className="text-caption text-muted-foreground">{post.postedAgo}</span>
                  </div>
                  <h2 className="mt-2 font-semibold leading-snug">{post.title}</h2>
                  <p className="text-body text-muted-foreground">
                    {post.company} · {post.location}
                  </p>
                  {post.description ? (
                    <p className="mt-2 line-clamp-3 text-body text-muted-foreground">{post.description}</p>
                  ) : null}
                  {post.applyUrl ? (
                    <Button asChild size="sm" className="mt-3" variant="outline">
                      <a href={post.applyUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open post
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
