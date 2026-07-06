"use client";

import type { ReactNode } from "react";
import PageHeader, { type PageHeaderMetric } from "./PageHeader";

type MetricPill = PageHeaderMetric;

type Props = {
  greeting?: string;
  title: string;
  subtitle: string;
  metrics?: MetricPill[];
  cta?: ReactNode;
  className?: string;
};

/** @deprecated Use PageHeader instead. */
export default function PageHero({ greeting, title, subtitle, metrics, cta, className }: Props) {
  return (
    <PageHeader
      eyebrow={greeting}
      title={title}
      subtitle={subtitle}
      metrics={metrics}
      primaryAction={cta}
      sticky={false}
      padding={false}
      className={className}
    />
  );
}
