"use client";

import { ArrowUpRight, Briefcase, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type JSX } from "react";
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
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#059669" />
      <path d="M7 12h3.2l1.5 2.2L14.6 10 17 12h0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="12" r="1.3" fill="white" />
    </svg>
  );
}

function RedditLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FF4500" />
      <circle cx="9" cy="12.5" r="1.3" fill="white" />
      <circle cx="15" cy="12.5" r="1.3" fill="white" />
      <path d="M8.4 15.3c1 .8 2.2 1.2 3.6 1.2s2.6-.4 3.6-1.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.8 9.6 10.7 7l3 .6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.8" cy="8.8" r="1.4" fill="white" />
      <path d="M8 10.8c-1.2 0-2.2.9-2.2 2s1 2 2.2 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 10.8c1.2 0 2.2.9 2.2 2s-1 2-2.2 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HackerNewsLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#FF6600" />
      <path d="M8 7h2l2 4 2-4h2l-3 5.8V17h-2v-4.2L8 7Z" fill="white" />
    </svg>
  );
}

function ArbeitnowLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0891B2" />
      <path d="M8 17 12 7l4 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.6 13h4.8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RssLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#7C3AED" />
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
    brandShellClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/15",
    badgeClassName: "bg-emerald-600/10 text-emerald-700",
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
    brandShellClassName: "bg-violet-50 text-violet-700 ring-1 ring-violet-500/15",
    badgeClassName: "bg-violet-600/10 text-violet-700",
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
    Logo: RedditLogo,
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
    <section className="rounded-xl border border-[#DADCE0] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8E8E93]">Community jobs</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Community job posts — Reddit, RSS, RemoteOK, Arbeitnow, and Hacker News
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3A3A3C]">
            Separate from live ATS jobs above. This lane surfaces Reddit threads, RSS syndication, and other public feeds —
            clearly marked as listings vs discussion posts.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          {canSyncCommunityJobs ? (
            <div className="flex flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={handleAdminSync}
                disabled={syncState === "loading"}
                className="inline-flex items-center gap-2 rounded-[18px] border border-[#1A73E8] bg-white px-3.5 py-2 text-xs font-semibold text-[#1557B0] shadow-sm transition hover:bg-[#E8F0FE] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncState === "loading" ? "animate-spin" : ""}`} aria-hidden />
                Sync community jobs now
              </button>
              {syncMessage ? (
                <p
                  className={`max-w-[280px] text-right text-[11px] leading-snug ${
                    syncState === "error" ? "text-red-600" : "text-[#1E8E3E]"
                  }`}
                >
                  {syncMessage}
                </p>
              ) : null}
            </div>
          ) : null}
          <span className="rounded-[20px] bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#1557B0] ring-1 ring-[#DADCE0]">
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
              className="flex h-full flex-col rounded-2xl border border-[#DADCE0] bg-[#FCFCFD] p-5 transition hover:-translate-y-0.5 hover:border-[#C4C7CC] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.brandShellClassName}`}>
                    <Logo />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8E8E93]">{meta.eyebrow}</p>
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">{meta.label}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.badgeClassName}`}>
                    {isLive ? "Live source" : "Community lane"}
                  </span>
                  {lowPriority ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                      Low priority
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#3A3A3C]">{meta.description}</p>

              <div className="mt-4 rounded-2xl border border-[#DADCE0] bg-white p-4">
                <h4 className="text-base font-semibold leading-snug text-[#1D1D1F]">{post.title}</h4>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#5F6368]">
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
                  <span className="rounded-full bg-[#E8F0FE] px-2.5 py-1 text-[11px] font-medium text-[#1557B0]">
                    {post.kind === "listing" ? "Listing" : "Post"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      lowPriority ? "bg-amber-100 text-amber-800" : "bg-[#E6F4EA] text-[#1E8E3E]"
                    }`}
                  >
                    {classificationLabel(post.classification)}
                  </span>
                </div>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#3A3A3C]">{trimSnippet(post)}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
                  <span className="text-xs font-medium text-[#8E8E93]">{post.postedAgo}</span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[18px] bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
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
