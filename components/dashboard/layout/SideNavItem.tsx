"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CollapsedNavTooltip from "./CollapsedNavTooltip";
import NavBenefitTooltip from "./NavBenefitTooltip";

type BaseProps = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  badge?: string | null;
  benefitHint?: string;
  unvisited?: boolean;
  suggested?: boolean;
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
  icon: Icon,
  active,
  collapsed,
  badge,
  unvisited,
  suggested,
}: Pick<
  SideNavItemProps,
  "label" | "icon" | "active" | "collapsed" | "badge" | "unvisited" | "suggested"
>) {
  return (
    <>
      <span
        className={cn(
          "relative inline-flex shrink-0",
          suggested && "wg-nav-item__icon-wrap--suggested",
        )}
      >
        <Icon className="wg-nav-item__icon" aria-hidden />
      </span>
      {!collapsed ? (
        <>
          <span className="relative min-w-0 flex-1 truncate">
            {label}
            {unvisited ? (
              <span className="wg-nav-item__unvisited" aria-label="Not yet visited" />
            ) : null}
          </span>
          {badge ? <span className="wg-nav-item__badge">{badge}</span> : null}
        </>
      ) : (
        <span className="sr-only">{label}</span>
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
    benefitHint,
    onMouseEnter,
  } = props;

  const className = cn(
    "wg-nav-item",
    active && "wg-nav-item--active",
    collapsed && "wg-nav-item--collapsed",
  );

  const content = (
    "href" in props && props.href ? (
      <Link
        href={props.href}
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        <NavItemContent {...props} />
      </Link>
    ) : (
      <button
        type="button"
        onClick={props.onClick}
        onMouseEnter={onMouseEnter}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        <NavItemContent {...props} />
      </button>
    )
  );

  const wrapped = collapsed ? (
    <CollapsedNavTooltip label={badge ? `${label} · ${badge}` : label}>
      {content}
    </CollapsedNavTooltip>
  ) : benefitHint ? (
    <NavBenefitTooltip hint={benefitHint}>{content}</NavBenefitTooltip>
  ) : (
    content
  );

  return wrapped;
}
