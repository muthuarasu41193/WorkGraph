"use client";

import { Bookmark, MapPin, Zap } from "lucide-react";
import { useState } from "react";
import type { JobMatchPreviewExt } from "./job-match-utils";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import ProfileButton from "../primitives/ProfileButton";
import SectionHeader from "../primitives/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  jobs?: JobMatchPreviewExt[];
  liveListings?: number;
  feedKind?: "live" | "demo";
};

export default function ProfileJobMatches({ jobs = [], liveListings = 0, feedKind = "demo" }: Props) {
  const list = jobs.length ? jobs : [];
  const [saved, setSaved] = useState<Set<string>>(new Set());

  return (
    <ProfileCard id="matches" padding="lg">
      <SectionHeader
        eyebrow="Opportunities"
        title="Top job matches"
        description={
          list.some((j) => j.matchPercent >= 70)
            ? "AI-ranked by resume similarity (local embeddings)."
            : "Roles aligned to your skills with match scoring."
        }
      />

      {list.length === 0 ? (
        <p className="text-sm text-[var(--wg-color-text-secondary)]">
          {feedKind === "live" && liveListings > 0 ? (
            <>
              Browse{" "}
              <a href="#recommended-jobs" className="font-medium text-primary underline-offset-2 hover:underline">
                {liveListings.toLocaleString()} live listings
              </a>{" "}
              below — ranked for your skills.
            </>
          ) : (
            <>
              Add resume text or run job ingest, then set{" "}
              <code className="text-xs">WORKGRAPH_API_URL</code> for semantic matches.
            </>
          )}
        </p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-1 wg-no-scrollbar">
        {list.map((job) => (
          <Card
            key={job.id}
            className="w-[min(100%,300px)] shrink-0 border-slate-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">{job.company}</p>
                <h3 className="mt-0.5 font-semibold leading-snug text-[var(--wg-color-text-primary)]">{job.title}</h3>
              </div>
              <span className="shrink-0 rounded-md bg-[var(--wg-color-surface-variant)] px-2 py-1 text-sm font-bold tabular-nums text-[var(--wg-color-primary)]">
                {job.matchPercent}%
              </span>
            </div>

            <p className="mt-2 text-sm text-[var(--wg-color-text-secondary)]">{job.salaryRange}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--wg-color-text-tertiary)]">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </p>

            <div className="mt-3">
              <ProfileBadge tone={job.workMode === "Remote" ? "success" : "info"}>{job.workMode}</ProfileBadge>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
              {job.applyUrl ? (
                <Button asChild size="sm" className="flex-1">
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    <Zap className="h-3.5 w-3.5" />
                    View role
                  </a>
                </Button>
              ) : (
                <ProfileButton variant="primary" className="flex-1 py-2 text-xs" icon={<Zap className="h-3.5 w-3.5" />}>
                  Easy apply
                </ProfileButton>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setSaved((prev) => {
                    const next = new Set(prev);
                    if (next.has(job.id)) next.delete(job.id);
                    else next.add(job.id);
                    return next;
                  })
                }
                aria-label={saved.has(job.id) ? "Unsave job" : "Save job"}
              >
                <Bookmark className={`h-4 w-4 ${saved.has(job.id) ? "fill-current text-primary" : ""}`} />
              </Button>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProfileCard>
  );
}
