"use client";

import { ArrowUpRight, Briefcase, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type JSX } from "react";
import { RedditLogo } from "@/components/icons/RedditLogo";
import { Button } from "@/components/ui/button";
import type { JobFeedSource, RecommendedJobCard } from "../../lib/job-dashboard";

type CommunitySource = Extract<JobFeedSource, "remoteok" | "arbeitnow" | "reddit" | "rss" | "hackernews">;

type SourceMeta = {
  label: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  destinationUrl: string;
  brandShellClassName: string;
  badgeClassName: string;
  fallback: RecommendedJobCard;
  Logo: () => JSX.Element;
};

function RemoteOkLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--success)" />
      <path d="M7 12h3.2l1.5 2.2L14.6 10 17 12h0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="12" r="1.3" fill="white" />
    </svg>
  );
}

function RedditLogoMark() {
  return <RedditLogo className="h-5 w-5" />;
}

function HackerNewsLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--warning)" />
      <path d="M8 7h2l2 4 2-4h2l-3 5.8V17h-2v-4.2L8 7Z" fill="white" />
    </svg>
  );
}

function ArbeitnowLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--info)" />
      <path d="M8 17 12 7l4 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.6 13h4.8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RssLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--accent)" />
      <path
        d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-6a8 8 0 0 1 8 8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="17" r="1.5" fill="white" />
    </svg>
  );
}

const SOURCE_META: Record<CommunitySource, SourceMeta> = {
  remoteok: {
    label: "RemoteOK",
    eyebrow: "Remote listings",
    description: "Structured remote listings that people can jump into directly when they want a fast apply path.",
    ctaLabel: "Open RemoteOK",
    destinationUrl: "https://remoteok.com/",
    brandShellClassName: "bg-success-subtle text-success-foreground ring-1 ring-success/20",
    badgeClassName: "bg-success/10 text-success-foreground",
    fallback: {
      id: "community-remoteok-fallback",
      title: "Senior Frontend Engineer",
      company: "RemoteOK spotlight",
      location: "Remote",
      description: "Remote-first listings from RemoteOK will appear here once the community sync starts running on your deployment.",
      source: "remoteok",
      matchLabel: "Community listing",
      postedAgo: "Fresh lane",
      postedAtIso: null,
      kind: "listing",
      classification: "remote",
      isCommunity: true,
      matchedSkills: [],
      applyUrl: "https://remoteok.com/",
    },
    Logo: RemoteOkLogo,
  },
  arbeitnow: {
    label: "Arbeitnow",
    eyebrow: "European openings",
    description: "A useful lane for remote-friendly and relocation-oriented openings, especially for candidates scanning Europe.",
    ctaLabel: "Open Arbeitnow",
    destinationUrl: "https://www.arbeitnow.com/jobs",
    brandShellClassName: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/15",
    badgeClassName: "bg-cyan-600/10 text-cyan-700",
    fallback: {
      id: "community-arbeitnow-fallback",
      title: "Backend Engineer with visa support",
      company: "Arbeitnow spotlight",
      location: "Berlin / Remote",
      description: "Arbeitnow community listings will appear here after the protected cron route starts syncing jobs.",
      source: "arbeitnow",
      matchLabel: "Community listing",
      postedAgo: "Fresh lane",
      postedAtIso: null,
      kind: "listing",
      classification: "employer_hiring",
      isCommunity: true,
      matchedSkills: [],
      applyUrl: "https://www.arbeitnow.com/jobs",
    },
    Logo: ArbeitnowLogo,
  },
  rss: {
    label: "RSS feeds",
    eyebrow: "Syndicated listings",
    description: "Curated job RSS feeds (Jobicy, We Work Remotely, and more) normalized into the same community lane as social posts.",
    ctaLabel: "Open listing",
    destinationUrl: "https://weworkremotely.com/",
    brandShellClassName: "bg-stone-100 text-stone-800 ring-1 ring-stone-200/80",
    badgeClassName: "bg-stone-100 text-stone-800 ring-1 ring-stone-200/80",
    fallback: {
      id: "community-rss-fallback",
      title: "Remote role from RSS feed",
      company: "RSS spotlight",
      location: "Remote",
      description: "RSS-syndicated listings appear here after community sync ingests configured RSS_FEED_URLS.",
      source: "rss",
      matchLabel: "Community listing",
      postedAgo: "Fresh lane",
      postedAtIso: null,
      kind: "listing",
      classification: "remote",
      isCommunity: true,
      matchedSkills: [],
      applyUrl: "https://weworkremotely.com/",
    },
    Logo: RssLogo,
  },
  reddit: {
    label: "Reddit",
    eyebrow: "Community threads",
    description: "Useful for public hiring threads, referrals, freelance requests, and candidate-for-hire posts people can respond to directly.",
    ctaLabel: "Open Reddit lane",
    destinationUrl: "https://www.reddit.com/r/forhire/",
    brandShellClassName: "bg-orange-50 text-orange-700 ring-1 ring-orange-500/15",
    badgeClassName: "bg-orange-500/10 text-orange-700",
    fallback: {
      id: "community-reddit-fallback",
      title: "Hiring thread for React and TypeScript roles",
      company: "r/forhire",
      location: "Community post",
      description: "Reddit posts are classified so discussion-heavy threads stay visible, but clearly marked as low priority when they are not actionable listings.",
      source: "reddit",
      matchLabel: "Community post",
      postedAgo: "Fresh lane",
      postedAtIso: null,
      kind: "post",
      classification: "employer_hiring",
      isCommunity: true,
      matchedSkills: [],
      applyUrl: "https://www.reddit.com/r/forhire/",
    },
    Logo: RedditLogoMark,
  },
  hackernews: {
    label: "Hacker News",
    eyebrow: "Hiring threads",
    description: "Great for official HN hiring threads, candidate threads, and smaller-team opportunities shared in public conversations.",
    ctaLabel: "Open Hacker News",
    destinationUrl: "https://news.ycombinator.com/",
    brandShellClassName: "bg-orange-50 text-orange-700 ring-1 ring-orange-500/15",
    badgeClassName: "bg-orange-500/10 text-orange-700",
    fallback: {
      id: "community-hn-fallback",
      title: "Ask HN: Who is hiring?",
      company: "Hacker News",
      location: "Internet",
      description: "Official HN hiring threads and related posts will show here, with low-priority badges for discussion-only items.",
      source: "hackernews",
      matchLabel: "Community post",
      postedAgo: "Fresh lane",
      postedAtIso: null,
      kind: "post",
      classification: "discussion_only",
      isCommunity: true,
      matchedSkills: [],
      applyUrl: "https://news.ycombinator.com/",
    },
    Logo: HackerNewsLogo,
  },
};

function trimSnippet(job: RecommendedJobCard): string {
  const candidate = job.description?.trim() || job.matchLabel.trim();
  if (candidate.length <= 140) return candidate;
  return `${candidate.slice(0, 137).trimEnd()}...`;
}

function classificationLabel(value: RecommendedJobCard["classification"]): string {
  switch (value) {
    case "candidate_for_hire":
      return "Candidate for hire";
    case "freelance":
      return "Freelance";
    case "internship":
      return "Internship";
    case "remote":
      return "Remote";
    case "discussion_only":
      return "Discussion only";
    case "employer_hiring":
    default:
      return "Employer hiring";
  }
}

export default function ProfileSocialJobPosts({
  jobs,
  canSyncCommunityJobs = false,
}: {
  jobs: RecommendedJobCard[];
  canSyncCommunityJobs?: boolean;
}) {
  const router = useRouter();
  const [syncState, setSyncState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleAdminSync = useCallback(async () => {
    setSyncState("loading");
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync-community-jobs", { method: "POST", credentials: "same-origin" });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; fetchedRows?: number };
      if (!res.ok || !body.ok) {
        setSyncState("error");
        setSyncMessage(body.message || `Sync failed (${res.status})`);
        return;
      }
      setSyncState("ok");
      setSyncMessage(
        typeof body.fetchedRows === "number"
          ? `Synced ${body.fetchedRows} rows from upstream sources.`
          : "Sync completed."
      );
      router.refresh();
    } catch {
      setSyncState("error");
      setSyncMessage("Network error while syncing.");
    }
  }, [router]);

  const spotlightPosts = (["reddit", "rss", "remoteok", "arbeitnow", "hackernews"] as const).map((source) => {
    const meta = SOURCE_META[source];
    const post = jobs.find((job) => job.source === source) ?? meta.fallback;
    const href = post.applyUrl?.trim() || meta.destinationUrl;
    const isLive = post.postedAgo !== "Demo" && post.postedAgo !== "Fresh lane";

    return { meta, post, href, isLive };
  });

  return (
    <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-caption font-medium uppercase tracking-[var(--letter-spacing-label)] text-[var(--text-tertiary)]">Community jobs</p>
          <h2 className="mt-1 text-heading-l text-[var(--text-primary)]">
            Community job posts — Reddit, RSS, RemoteOK, Arbeitnow, and Hacker News
          </h2>
          <p className="mt-2 text-body text-[var(--text-secondary)]">
            Separate from live ATS jobs above. This lane surfaces Reddit threads, RSS syndication, and other public feeds —
            clearly marked as listings vs discussion posts.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          {canSyncCommunityJobs ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAdminSync}
                disabled={syncState === "loading"}
                loading={syncState === "loading"}
                className="rounded-[18px] border-[var(--info)] text-[var(--info-foreground)] shadow-sm hover:bg-[var(--info-subtle)]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncState === "loading" ? "animate-spin" : ""}`} aria-hidden />
                Sync community jobs now
              </Button>
              {syncMessage ? (
                <p
                  className={`max-w-[280px] text-right text-caption leading-snug ${
                    syncState === "error" ? "text-red-600" : "text-[var(--success)]"
                  }`}
                >
                  {syncMessage}
                </p>
              ) : null}
            </div>
          ) : null}
          <span className="rounded-full bg-[var(--info-subtle)] px-3 py-1 text-caption font-medium text-[var(--info-foreground)] ring-1 ring-[var(--border-default)]">
            Separate job posts / community jobs lane
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {spotlightPosts.map(({ meta, post, href, isLive }) => {
          const Logo = meta.Logo;
          const lowPriority = post.classification === "discussion_only";

          return (
            <article
              key={meta.label}
              className="flex h-full flex-col rounded-2xl border border-[var(--border-default)] bg-surface-primary p-5 transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.brandShellClassName}`}>
                    <Logo />
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption font-medium uppercase tracking-[var(--letter-spacing-label)] text-[var(--text-tertiary)]">{meta.eyebrow}</p>
                    <h3 className="text-heading-s text-[var(--text-primary)]">{meta.label}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-3 py-1 text-caption font-medium ${meta.badgeClassName}`}>
                    {isLive ? "Live source" : "Community lane"}
                  </span>
                  {lowPriority ? (
                    <span className="rounded-full bg-warning-subtle px-3 py-1 text-caption font-medium text-warning-foreground">
                      Low priority
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-4 text-body text-[var(--text-secondary)]">{meta.description}</p>

              <div className="mt-4 rounded-2xl border border-[var(--border-default)] bg-surface-primary p-4">
                <h4 className="text-body-lg font-semibold leading-snug text-[var(--text-primary)]">{post.title}</h4>
                <div className="mt-2 flex flex-wrap gap-3 text-body text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" aria-hidden />
                    {post.company}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {post.location}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--info-subtle)] px-3 py-1 text-caption font-medium text-[var(--info-foreground)]">
                    {post.kind === "listing" ? "Listing" : "Post"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-caption font-medium ${
                      lowPriority ? "bg-warning-subtle text-warning-foreground" : "bg-[var(--success-subtle)] text-[var(--success)]"
                    }`}
                  >
                    {classificationLabel(post.classification)}
                  </span>
                </div>
                <p className="mt-3 min-h-[72px] text-body leading-6 text-[var(--text-secondary)]">{trimSnippet(post)}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="text-caption font-medium text-[var(--text-tertiary)]">{post.postedAgo}</span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[18px] bg-[var(--info)] px-4 py-2 text-body font-medium text-white transition hover:bg-[var(--info-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2"
                  >
                    {meta.ctaLabel}
                    {isLive ? <ExternalLink className="h-4 w-4" aria-hidden /> : <ArrowUpRight className="h-4 w-4" aria-hidden />}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
