"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/lib/dashboard-nav-groups";
import type { NavFeedbackKind, NavFeedbackRoute } from "@/lib/nav-feedback-events";
import {
  getSuggestedIntelligenceRoute,
  isCareerIntelligenceRoute,
  useCareerIntelligenceNav,
} from "@/hooks/use-career-intelligence-nav";
import { useNavVisitTracking } from "@/hooks/use-nav-visit-tracking";
import SideNavItem from "./SideNavItem";

const collapseVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2, ease: "easeInOut" as const },
      opacity: { duration: 0.1 },
    },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.2, ease: "easeInOut" as const },
      opacity: { duration: 0.15, delay: 0.05 },
    },
  },
} satisfies Variants;

const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 90 },
} satisfies Variants;

const intelListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
} satisfies Variants;

const intelItemVariants = {
  hidden: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
} satisfies Variants;

type Props = {
  group: NavGroup;
  activeRoute: string;
  collapsed: boolean;
  profileCompleteness: number;
  appliedCount: number;
  pendingRoute: string | null;
  successState: Partial<Record<NavFeedbackRoute, NavFeedbackKind>>;
  onNavigate?: () => void;
  onNavClick: (id: string, href?: string) => void;
};

function renderIntelItem(
  item: NavItem,
  opts: {
    active: boolean;
    collapsed: boolean;
    hydrated: boolean;
    suggestedId: ReturnType<typeof getSuggestedIntelligenceRoute>;
    isVisited: (id: string) => boolean;
    loading: boolean;
    successKind: NavFeedbackKind | null;
    onClick: () => void;
  },
) {
  const common = {
    label: item.label,
    icon: item.icon,
    active: opts.active,
    collapsed: opts.collapsed,
    benefitHint: item.benefitHint,
    unvisited: opts.hydrated && !opts.isVisited(item.id),
    suggested: item.id === opts.suggestedId,
    loading: opts.loading,
    successKind: opts.successKind,
    onClick: opts.onClick,
  };

  if (item.href) {
    return <SideNavItem href={item.href} {...common} />;
  }

  return <SideNavItem {...common} />;
}

export default function CareerIntelligenceSection({
  group,
  activeRoute,
  collapsed,
  profileCompleteness,
  appliedCount,
  pendingRoute,
  successState,
  onNavigate,
  onNavClick,
}: Props) {
  const router = useRouter();
  const { expanded, hydrated, toggle, expand } = useCareerIntelligenceNav(activeRoute);
  const { markVisited, isVisited } = useNavVisitTracking();

  const groupActive = group.items.some((item) =>
    item.id === "interview-vault" ? false : item.id === activeRoute,
  );
  const suggestedId = getSuggestedIntelligenceRoute(profileCompleteness, appliedCount);
  const toolCount = group.items.length;
  const subtitle = group.subtitle ?? `${toolCount} AI-powered tools`;

  function itemSuccessKind(itemId: string): NavFeedbackKind | null {
    if (itemId === "applications") return successState.applications ?? null;
    return null;
  }

  useEffect(() => {
    if (isCareerIntelligenceRoute(activeRoute)) {
      markVisited(activeRoute);
    }
  }, [activeRoute, markVisited]);

  function handleItemClick(item: NavItem) {
    markVisited(item.id);
    if (item.href) {
      router.push(item.href);
    } else {
      onNavClick(item.id, item.href);
    }
    onNavigate?.();
  }

  function isActive(id: string): boolean {
    if (id === "interview-vault") return false;
    return activeRoute === id;
  }

  if (collapsed) {
    return (
      <div className="mb-1">
        <div className="mx-2 mb-1 h-px bg-slate-100" aria-hidden />
        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <li key={item.id}>
              {renderIntelItem(item, {
                active: isActive(item.id),
                collapsed: true,
                hydrated,
                suggestedId,
                isVisited,
                loading: pendingRoute === item.id && !isActive(item.id),
                successKind: itemSuccessKind(item.id),
                onClick: () => handleItemClick(item),
              })}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const showItems = expanded || groupActive;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={toggle}
        className={cn("wg-intel-header", groupActive && "wg-intel-header--active")}
        aria-expanded={showItems}
      >
        <span className="wg-intel-header__icon" aria-hidden>
          <Brain className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-medium text-slate-700">{group.label || "AI Tools"}</span>
          <span className="block text-xs text-slate-400">{subtitle}</span>
        </span>
        <motion.span
          animate={showItems ? "expanded" : "collapsed"}
          variants={chevronVariants}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 text-slate-400"
          aria-hidden
        >
          <ChevronRight className="h-4 w-4" />
        </motion.span>
      </button>

      <motion.div
        variants={collapseVariants}
        initial={false}
        animate={showItems && hydrated ? "visible" : "hidden"}
        className="overflow-hidden"
      >
        <motion.ul
          className="space-y-0.5 pt-1"
          variants={intelListVariants}
          initial={false}
          animate={showItems && hydrated ? "visible" : "hidden"}
        >
          {group.items.map((item) => (
            <motion.li key={item.id} variants={intelItemVariants}>
              {renderIntelItem(item, {
                active: isActive(item.id),
                collapsed: false,
                hydrated,
                suggestedId,
                isVisited,
                loading: pendingRoute === item.id && !isActive(item.id),
                successKind: itemSuccessKind(item.id),
                onClick: () => {
                  if (!expanded && isCareerIntelligenceRoute(item.id)) expand();
                  handleItemClick(item);
                },
              })}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}
