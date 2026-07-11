"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icon as WgIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { NavFeedbackKind } from "@/lib/nav-feedback-events";
import CollapsedNavTooltip from "./CollapsedNavTooltip";
import NavBenefitTooltip from "./NavBenefitTooltip";

type BaseProps = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
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

function NavItemContent({
  label,
  icon: IconComponent,
  active,
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
  | "active"
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
        <WgIcon icon={IconComponent} className="nav-icon" />
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
              ✓
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
    badge,
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
