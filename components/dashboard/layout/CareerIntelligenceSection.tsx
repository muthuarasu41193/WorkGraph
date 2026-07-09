"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/lib/dashboard-nav-groups";
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
      height: { duration: 0.2, ease: "easeInOut" },
      opacity: { duration: 0.1 },
    },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.2, ease: "easeInOut" },
      opacity: { duration: 0.15, delay: 0.05 },
    },
  },
};

const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 90 },
};

const intelListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const intelItemVariants = {
  hidden: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

type Props = {
  group: NavGroup;
  activeRoute: string;
  collapsed: boolean;
  profileCompleteness: number;
  appliedCount: number;
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
          <Brain className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-medium text-gray-700">Career Intelligence</span>
          <span className="block text-xs text-gray-400">{subtitle}</span>
        </span>
        <motion.span
          animate={showItems ? "expanded" : "collapsed"}
          variants={chevronVariants}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 text-gray-400"
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
