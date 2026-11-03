"use client";

import { Badge } from "@/components/ui/badge";
import {
  followUpBadgeLabel,
  followUpState,
  likelyNoResponseSuggestion,
  type FollowUpState,
} from "@/lib/applications-followup";
import type { Application } from "@/lib/applications";
import { cn } from "@/lib/utils";

type BadgeProps = {
  application: Pick<Application, "status" | "applied_date" | "next_step_date" | "timeline">;
  today?: string;
  className?: string;
};

/** Neutral follow-up badge shared by /applications and /tracker cards. */
export function FollowUpBadge({ application, today, className }: BadgeProps) {
  const state = followUpState(application, today);
  const label = followUpBadgeLabel(state);
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "mt-1 border-border bg-muted/40 font-normal text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function FollowUpSuggestion({
  application,
  today,
  className,
}: BadgeProps) {
  const state = followUpState(application, today);
  if (state !== "likely_no_response") return null;

  return (
    <p className={cn("text-xs text-muted-foreground", className)} role="status">
      {likelyNoResponseSuggestion()}
    </p>
  );
}

export function followUpFilterState(
  application: Pick<Application, "status" | "applied_date" | "next_step_date" | "timeline">,
  today?: string,
): FollowUpState {
  return followUpState(application, today);
}
