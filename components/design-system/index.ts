/**
 * WorkGraph Design System Patterns
 * Composed components built on ui primitives — one implementation per pattern.
 */

export { default as PageHeader } from "./PageHeader";
export type { PageHeaderBreadcrumb, PageHeaderMetric, PageHeaderProps } from "./PageHeader";
/** @deprecated Use PageHeader instead. */
export { default as PageHero } from "./PageHero";
export { default as MetricCard } from "./MetricCard";
export { default as StatCard } from "./StatCard";
export { default as MiniChart } from "./MiniChart";
export { default as SectionHeader } from "./SectionHeader";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export { default as InsightCard } from "./InsightCard";
export { default as JobCard } from "./JobCard";
export type { JobCardData } from "./JobCard";
export { jobCardFromMatch } from "@/lib/job-card-data";
export { default as ActivityTimeline, DEMO_TIMELINE_EVENTS } from "./ActivityTimeline";
export type { TimelineEvent } from "./ActivityTimeline";
export { default as CommandPalette, useCommandPalette } from "./CommandPalette";
export { default as SectionSkeleton } from "./SectionSkeleton";

/** @deprecated Use SectionSkeleton with variant="dashboard" */
export { default as DashboardSkeleton } from "./SectionSkeleton";