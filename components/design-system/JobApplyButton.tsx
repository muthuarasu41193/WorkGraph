"use client";

import { ExternalLink } from "lucide-react";
import type { JobFeedSource } from "@/lib/job-dashboard";
import { trackEvent } from "@/lib/analytics";
import { getApplyLabel, jobSourceName } from "@/lib/job-apply";
import { useApplyFollowupStore } from "@/stores/apply-followup-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  /** Filled keeps the legacy solid apply stamp; outline is the job-card default. */
  variant?: "filled" | "outline";
  /** Visible label. Defaults to "Apply" for outline, "Apply on {source}" for filled. */
  label?: string;
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
  variant = "outline",
  label,
}: Props) {
  const scheduleFollowup = useApplyFollowupStore((s) => s.schedule);
  const sourceName = jobSourceName(source, company, applyUrl);
  const buttonLabel = label ?? (variant === "filled" ? getApplyLabel(source, company, applyUrl) : "Apply");
  const tooltip = `Opens on ${sourceName}`;

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

  if (variant === "filled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={tooltip}
        className={cn("apply-btn wg-touch-target active:scale-[0.98]", className)}
      >
        <span>{buttonLabel}</span>
        <ExternalLink className="ml-1.5 size-3.5 shrink-0" aria-hidden />
      </button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            className={cn("wg-touch-target", className)}
            aria-label={tooltip}
          >
            {buttonLabel}
            <ExternalLink data-icon="inline-end" className="size-3.5 shrink-0" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
