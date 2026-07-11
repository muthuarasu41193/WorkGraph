"use client";

import { Bookmark, Github } from "lucide-react";
import { RedditLogo } from "@/components/icons/RedditLogo";
import { iconClass } from "@/lib/icon-styles";
import type { HiddenOpportunity } from "@/lib/hidden-opportunities/types";
import "./hidden-opportunity-card.css";

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  hackernews: "Hacker News",
  github: "GitHub",
};

function SourceIcon({ source }: { source: string }) {
  if (source === "reddit") {
    return <RedditLogo className={iconClass("standalone")} />;
  }
  if (source === "hackernews") {
    return <span aria-hidden>Y</span>;
  }
  if (source === "github") {
    return <Github className={iconClass("standalone")} />;
  }
  return <span className="text-xs font-semibold uppercase">{source.slice(0, 2)}</span>;
}

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
  const sourceLabel = SOURCE_LABELS[opportunity.source] ?? opportunity.source;
  const meta = [opportunity.company, opportunity.author, formatPostedDate(opportunity.postedAt)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="hidden-opp-card"
      onMouseEnter={onVisible}
      onFocus={onVisible}
    >
      <div className="hidden-opp-card__source">
        <div className="hidden-opp-card__source-icon" data-source={opportunity.source}>
          <SourceIcon source={opportunity.source} />
        </div>
        <span className="hidden-opp-card__source-name">{sourceLabel}</span>
      </div>

      <div className="hidden-opp-card__main">
        <h2 className="hidden-opp-card__title">{opportunity.title}</h2>
        <p className="hidden-opp-card__meta">{meta}</p>
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
