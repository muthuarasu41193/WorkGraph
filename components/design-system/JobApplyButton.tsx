"use client";

import { ExternalLink } from "lucide-react";
import type { JobFeedSource } from "@/lib/job-dashboard";
import { trackEvent } from "@/lib/analytics";
import { jobSourceName } from "@/lib/job-apply";
import { useApplyFollowupStore } from "@/stores/apply-followup-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const destination = jobSourceName(source, company, applyUrl);
  const tooltip = `Opens on ${destination}`;

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          title={tooltip}
          aria-label={tooltip}
          className={cn("apply-btn wg-touch-target gap-1.5", className)}
        >
          <span>Apply</span>
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
