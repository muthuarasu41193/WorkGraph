"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, MessagesSquare } from "lucide-react";
import SourceIcon from "@/components/icons/SourceIcon";
import { Icon as WgIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { NavFeedbackKind } from "@/lib/nav-feedback-events";
import CollapsedNavTooltip from "./CollapsedNavTooltip";
import NavBenefitTooltip from "./NavBenefitTooltip";

type BaseProps = {
  label: string;
  icon: LucideIcon;
  /** When set (e.g. Community posts), replaces the Lucide glyph. */
  leading?: ReactNode;
  active?: boolean;
  collapsed?: boolean;
  nested?: boolean;
  badge?: string | null;
  countSuffix?: number | null;
  benefitHint?: string;
  unvisited?: boolean;
  suggested?: boolean;
  loading?: boolean;
  successKind?: NavFeedbackKind | null;
  onMouseEnter?: () => void;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: () => void;
};

type ButtonProps = BaseProps & {
  href?: undefined;
  onClick: () => void;
};

export type SideNavItemProps = LinkProps | ButtonProps;

/** Community discovery is Reddit-sourced today — use brand mark; else MessagesSquare. */
export function CommunityPostsIcon({
  redditSourced = true,
  className,
}: {
  redditSourced?: boolean;
  className?: string;
}) {
  if (redditSourced) {
    return (
      <SourceIcon
        source="reddit"
        size={14}
        className={cn("wg-nav-item__brand-icon bg-transparent", className)}
      />
    );
  }
  return <MessagesSquare className={cn("nav-icon", className)} strokeWidth={1.75} aria-hidden />;
}

function NavItemContent({
  label,
  icon: IconComponent,
  leading,
  collapsed,
  badge,
  countSuffix,
  unvisited,
  suggested,
  successKind,
}: Pick<
  SideNavItemProps,
  | "label"
  | "icon"
  | "leading"
  | "collapsed"
  | "badge"
  | "countSuffix"
  | "unvisited"
  | "suggested"
  | "successKind"
>) {
  const showCount = countSuffix != null && countSuffix > 0;

  return (
    <>
      <span
        className={cn(
          "relative inline-flex shrink-0",
          suggested && "wg-nav-item__icon-wrap--suggested",
        )}
      >
        {leading ?? <WgIcon icon={IconComponent} className="nav-icon" strokeWidth={1.75} />}
      </span>
      {!collapsed ? (
        <>
          <span className="relative min-w-0 flex-1 truncate">
            {label}
            {showCount ? (
              <span className="wg-nav-item__count" aria-label={`${countSuffix} saved`}>
                {" "}
                · {countSuffix}
              </span>
            ) : null}
            {unvisited ? (
              <span className="wg-nav-item__unvisited" aria-label="Not yet visited" />
            ) : null}
          </span>
          {successKind === "check" ? (
            <span className="wg-nav-item__success-check" aria-label="Section updated">
              <Check className="nav-icon" strokeWidth={1.75} />
            </span>
          ) : badge ? (
            <span className="wg-nav-item__badge">{badge}</span>
          ) : null}
        </>
      ) : (
        <span className="sr-only">
          {label}
          {showCount ? `, ${countSuffix} saved` : ""}
        </span>
      )}
    </>
  );
}

export default function SideNavItem(props: SideNavItemProps) {
  const {
    label,
    active = false,
    collapsed = false,
    nested = false,
    countSuffix,
    benefitHint,
    loading = false,
    successKind = null,
    onMouseEnter,
  } = props;

  const className = cn(
    "wg-nav-item",
    active && "wg-nav-item--active",
    collapsed && "wg-nav-item--collapsed",
    nested && "wg-nav-item--nested",
    loading && "wg-nav-item--loading",
    successKind === "glow" && "wg-nav-item--success-glow",
    successKind === "pulse" && "wg-nav-item--success-pulse",
  );

  const content =
    "href" in props && props.href ? (
      <Link
        href={props.href}
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        className={className}
        aria-current={active ? "page" : undefined}
        aria-busy={loading || undefined}
      >
        <NavItemContent {...props} successKind={successKind} />
      </Link>
    ) : (
      <button
        type="button"
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        className={className}
        aria-current={active ? "page" : undefined}
        aria-busy={loading || undefined}
      >
        <NavItemContent {...props} successKind={successKind} />
      </button>
    );

  const collapsedLabel =
    countSuffix != null && countSuffix > 0 ? `${label} · ${countSuffix}` : label;

  if (collapsed) {
    return (
      <CollapsedNavTooltip label={collapsedLabel} hint={benefitHint}>
        {content}
      </CollapsedNavTooltip>
    );
  }

  if (benefitHint) {
    return <NavBenefitTooltip hint={benefitHint}>{content}</NavBenefitTooltip>;
  }

  return content;
}
