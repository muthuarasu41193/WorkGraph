"use client";

import { Bookmark } from "lucide-react";
import SourceBadge from "@/components/icons/SourceBadge";
import { TrustIndicator } from "@/components/product/TrustIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { communitySourceSecondary } from "@/lib/community-source-secondary";
import { iconClass } from "@/lib/icon-styles";
import { trustPropsForListing } from "@/lib/job-feed";
import { cn } from "@/lib/utils";

export type CommunityPostCardModel = {
  id: string;
  source: string;
  title: string;
  company?: string;
  location?: string;
  url: string;
  author?: string;
  postedAt: string;
  category?: string;
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
  opportunity: CommunityPostCardModel;
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
  const secondary = communitySourceSecondary(opportunity);
  const meta = [opportunity.location, formatPostedDate(opportunity.postedAt)]
    .filter(Boolean)
    .join(" · ");
  const trust = trustPropsForListing({
    title: opportunity.title,
    company: opportunity.company,
    description: opportunity.title,
    applyUrl: opportunity.url,
    postedAtIso: opportunity.postedAt,
    source: opportunity.source,
    isCommunity: true,
  });

  return (
    <Card
      size="sm"
      className={cn(
        "grid grid-cols-1 items-center gap-[var(--layout-stack-tight)] p-[var(--layout-card-pad-mobile)] md:grid-cols-[minmax(0,1fr)_auto] md:p-[var(--layout-card-pad)]",
      )}
      onMouseEnter={onVisible}
      onFocus={onVisible}
    >
      <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
        <SourceBadge
          source={opportunity.source}
          url={opportunity.url}
          secondary={secondary}
        />
        <h2 className="line-clamp-2 text-role-card-title text-ink">{opportunity.title}</h2>
        {meta ? <p className="truncate text-role-caption text-ink-muted">{meta}</p> : null}
        {trust ? <TrustIndicator {...trust} className="mt-[var(--space-1)]" /> : null}
      </div>

      <div className="flex shrink-0 items-center gap-[var(--space-2)]">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          data-saved={saved ? "true" : "false"}
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save opportunity"}
          className={cn(
            saved && "border-accent/30 bg-accent-wash text-accent hover:bg-accent-wash",
          )}
        >
          <Bookmark className={iconClass()} fill={saved ? "currentColor" : "none"} />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onViewSource}>
          Open source
        </Button>
      </div>
    </Card>
  );
}
