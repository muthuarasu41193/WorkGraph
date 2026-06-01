"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import type { HiddenOpportunity } from "@/lib/hidden-opportunities/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  hackernews: "Hacker News",
  github: "GitHub",
};

function formatPostedDate(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "Recently";
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

type Props = {
  opportunity: HiddenOpportunity;
  saved: boolean;
  onToggleSave: () => void;
  onViewSource: () => void;
  onVisible?: () => void;
};

export default function HiddenOpportunityCard({
  opportunity,
  saved,
  onToggleSave,
  onViewSource,
  onVisible,
}: Props) {
  return (
    <Card
      className="wg-dash-section-card transition-shadow hover:shadow-md"
      onMouseEnter={onVisible}
      onFocus={onVisible}
    >
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {SOURCE_LABELS[opportunity.source] ?? opportunity.source}
            </Badge>
            {opportunity.score > 0 ? (
              <Badge variant="outline" className="text-[10px]">
                Score {opportunity.score}
              </Badge>
            ) : null}
          </div>
          <h2 className="text-base font-semibold leading-snug text-foreground">
            {opportunity.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {[opportunity.company, opportunity.location, opportunity.author].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">{formatPostedDate(opportunity.postedAt)}</p>
          {opportunity.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.tags.slice(0, 6).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Button
            type="button"
            variant={saved ? "default" : "outline"}
            size="sm"
            onClick={onToggleSave}
            aria-pressed={saved}
            className={cn(saved && "gap-1")}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button type="button" size="sm" onClick={onViewSource}>
            <ExternalLink className="h-4 w-4" />
            View Original Source
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
