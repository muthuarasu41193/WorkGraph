"use client";

import { Bookmark } from "lucide-react";
import SourceBadge from "@/components/icons/SourceBadge";
import { TrustIndicator } from "@/components/product/TrustIndicator";
import { iconClass } from "@/lib/icon-styles";
import type { HiddenOpportunity } from "@/lib/hidden-opportunities/types";
import { trustPropsForListing } from "@/lib/job-feed";
import "./hidden-opportunity-card.css";

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
  const meta = [opportunity.company, opportunity.author, formatPostedDate(opportunity.postedAt)]
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
    <article
      className="hidden-opp-card"
      onMouseEnter={onVisible}
      onFocus={onVisible}
    >
      <div className="hidden-opp-card__main">
        <SourceBadge source={opportunity.source} url={opportunity.url} />
        <h2 className="hidden-opp-card__title">{opportunity.title}</h2>
        <p className="hidden-opp-card__meta">{meta}</p>
        {trust ? <TrustIndicator {...trust} className="mt-1" /> : null}
      </div>

      <div className="hidden-opp-card__actions">
        <button
          type="button"
          className="hidden-opp-card__save"
          data-saved={saved ? "true" : "false"}
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save opportunity"}
        >
          <Bookmark className={iconClass()} fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="hidden-opp-card__open" onClick={onViewSource}>
          Open source
        </button>
      </div>
    </article>
  );
}
