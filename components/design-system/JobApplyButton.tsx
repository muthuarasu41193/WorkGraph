"use client";

import { ExternalLink } from "lucide-react";
import type { JobFeedSource } from "@/lib/job-dashboard";
import { trackEvent } from "@/lib/analytics";
import { getApplyLabel } from "@/lib/job-apply";
import { useApplyFollowupStore } from "@/stores/apply-followup-store";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";
type Props = {
  jobId: string;
  company: string;
  title: string;
  applyUrl: string;
  source?: JobFeedSource;
  className?: string;
  onClick?: () => void;
  followupDelayMs?: number;
};

export default function JobApplyButton({
  jobId,
  company,
  title,
  applyUrl,
  source,
  className,
  onClick,
  followupDelayMs = 45_000,
}: Props) {
  const scheduleFollowup = useApplyFollowupStore((s) => s.schedule);
  const label = getApplyLabel(source);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();

    trackEvent("apply_clicked", {
      jobId,
      source: source ?? "unknown",
      platform: source ?? "unknown",
      company,
    });

    window.open(applyUrl, "_blank", "noopener,noreferrer");

    scheduleFollowup(
      {
        jobId,
        company,
        title,
        applyUrl,
        source,
      },
      followupDelayMs,
    );

    onClick?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("apply-btn", className)}
    >
      <span>{label}</span>
      <ExternalLink className={iconClass("inline")} aria-hidden />
    </button>
  );
}
