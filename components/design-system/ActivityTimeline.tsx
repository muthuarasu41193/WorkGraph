"use client";

import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Mail,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type:
    | "resume_improved"
    | "jobs_matched"
    | "application_submitted"
    | "recruiter_viewed"
    | "interview_invitation"
    | "offer_received";
  title: string;
  description?: string;
  timestamp: string;
};

const EVENT_ICONS: Record<TimelineEvent["type"], LucideIcon> = {
  resume_improved: FileText,
  jobs_matched: Briefcase,
  application_submitted: Mail,
  recruiter_viewed: UserCheck,
  interview_invitation: Sparkles,
  offer_received: CheckCircle2,
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  resume_improved: "bg-blue-50 text-blue-600",
  jobs_matched: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  application_submitted: "bg-surface-secondary text-text-secondary",
  recruiter_viewed: "bg-purple-50 text-purple-600",
  interview_invitation: "bg-warning-subtle text-warning",
  offer_received: "bg-success-subtle text-success",
};

type Props = {
  events: TimelineEvent[];
  className?: string;
};

export default function ActivityTimeline({ events, className }: Props) {
  if (events.length === 0) return null;

  return (
    <div className={cn("space-y-0", className)} role="list" aria-label="Recent activity">
      {events.map((event, i) => {
        const Icon = EVENT_ICONS[event.type];
        const isLast = i === events.length - 1;
        return (
          <div key={event.id} className="relative flex gap-3 pb-6" role="listitem">
            {!isLast ? (
              <span
                className="absolute left-[17px] top-9 h-[calc(100%-12px)] w-px bg-[var(--border-default)]"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                EVENT_COLORS[event.type],
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-body font-medium text-[var(--text-primary)]">{event.title}</p>
                <time className="text-caption text-[var(--text-secondary)]">{event.timestamp}</time>
              </div>
              {event.description ? (
                <p className="mt-0.5 text-caption text-[var(--text-secondary)]">{event.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    type: "resume_improved",
    title: "Resume improved",
    description: "Added 3 high-impact keywords for target roles",
    timestamp: "2h ago",
  },
  {
    id: "2",
    type: "jobs_matched",
    title: "12 new jobs matched",
    description: "Based on your updated skills profile",
    timestamp: "5h ago",
  },
  {
    id: "3",
    type: "application_submitted",
    title: "Application submitted",
    description: "Senior Engineer at Stripe",
    timestamp: "Yesterday",
  },
  {
    id: "4",
    type: "recruiter_viewed",
    title: "Recruiter viewed profile",
    description: "Your profile appeared in 3 recruiter searches",
    timestamp: "2 days ago",
  },
];
