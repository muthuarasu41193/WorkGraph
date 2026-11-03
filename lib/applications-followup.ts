import {
  appendTimelineEvent,
  type Application,
  type ApplicationTimelineEvent,
} from "@/lib/applications";

/** Recommended default: follow up one week after applying when the user left next_step_date empty. */
export const APPLIED_FOLLOWUP_DAYS = 7;

/** After this many days still in Applied with no status change, suggest a quiet check-in decision. */
export const LIKELY_NO_RESPONSE_DAYS = 21;

/** Recommended thank-you / check-in window after the latest interview timeline entry. */
export const INTERVIEW_FOLLOWUP_DAYS = 2;

/** After marking followed up, schedule the next nudge this many days later. */
export const FOLLOWUP_RESCHEDULE_DAYS = 7;

/** Cap recorded follow-ups; after this many, stop nudging. */
export const MAX_FOLLOW_UPS = 2;

export const DEFAULT_FOLLOWUP_NEXT_STEP = "Follow up";

export type FollowUpState = "none" | "due" | "overdue" | "likely_no_response";

export type FollowUpAppInput = Pick<
  Application,
  "status" | "applied_date" | "next_step_date" | "timeline"
>;

/** YYYY-MM-DD from a Date using UTC calendar parts (date-only, timezone-safe). */
export function toDateOnlyUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date-only string in UTC. Pass `now` in tests. */
export function todayDateOnly(now: Date = new Date()): string {
  return toDateOnlyUtc(now);
}

/** Add calendar days to a YYYY-MM-DD string (UTC date arithmetic). */
export function addDaysDateOnly(dateOnly: string, days: number): string {
  const base = parseDateOnlyUtc(dateOnly);
  base.setUTCDate(base.getUTCDate() + days);
  return toDateOnlyUtc(base);
}

export function parseDateOnlyUtc(dateOnly: string): Date {
  const raw = dateOnly.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return new Date(NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Inclusive day difference: today - dateOnly (UTC date-only). */
export function daysBetweenDateOnly(fromDateOnly: string, toDateOnly: string): number {
  const from = parseDateOnlyUtc(fromDateOnly).getTime();
  const to = parseDateOnlyUtc(toDateOnly).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.floor((to - from) / 86_400_000);
}

export function countFollowUpEvents(timeline: ApplicationTimelineEvent[] | undefined): number {
  if (!timeline?.length) return 0;
  return timeline.filter((event) => event.type === "follow_up").length;
}

export function canScheduleAnotherFollowUp(timeline: ApplicationTimelineEvent[] | undefined): boolean {
  return countFollowUpEvents(timeline) < MAX_FOLLOW_UPS;
}

function lastTimelineDateOnly(timeline: ApplicationTimelineEvent[]): string | null {
  let latestMs = Number.NEGATIVE_INFINITY;
  let latest: string | null = null;
  for (const event of timeline) {
    const at = event.at;
    if (!at) continue;
    const asDateOnly = at.length >= 10 ? at.slice(0, 10) : at;
    const ms = parseDateOnlyUtc(asDateOnly).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms >= latestMs) {
      latestMs = ms;
      latest = asDateOnly;
    }
  }
  return latest;
}

function compareDueDate(dueDate: string, today: string): FollowUpState {
  if (today === dueDate) return "due";
  if (today > dueDate) return "overdue";
  return "none";
}

/**
 * Gentle follow-up nudge state. Recommendations only — never changes status.
 * Uses date-only (YYYY-MM-DD) comparisons so timezones do not flip the day.
 */
export function followUpState(app: FollowUpAppInput, today: string = todayDateOnly()): FollowUpState {
  const todayOnly = today.slice(0, 10);

  if (countFollowUpEvents(app.timeline) >= MAX_FOLLOW_UPS) {
    return "none";
  }

  if (app.status === "rejected" || app.status === "offer") {
    return "none";
  }

  const applied = app.applied_date.slice(0, 10);

  if (app.status === "applied" && daysBetweenDateOnly(applied, todayOnly) >= LIKELY_NO_RESPONSE_DAYS) {
    return "likely_no_response";
  }

  if (app.next_step_date) {
    return compareDueDate(app.next_step_date.slice(0, 10), todayOnly);
  }

  if (app.status === "applied") {
    const dueDate = addDaysDateOnly(applied, APPLIED_FOLLOWUP_DAYS);
    if (daysBetweenDateOnly(applied, todayOnly) >= LIKELY_NO_RESPONSE_DAYS) {
      return "likely_no_response";
    }
    return compareDueDate(dueDate, todayOnly);
  }

  if (app.status === "interview") {
    const last = lastTimelineDateOnly(app.timeline ?? []);
    if (!last) return "none";
    const dueDate = addDaysDateOnly(last, INTERVIEW_FOLLOWUP_DAYS);
    return compareDueDate(dueDate, todayOnly);
  }

  return "none";
}

export function needsFollowUp(state: FollowUpState): boolean {
  return state === "due" || state === "overdue" || state === "likely_no_response";
}

export function followUpBadgeLabel(state: FollowUpState): string | null {
  if (state === "due") return "Follow up today";
  if (state === "overdue") return "Follow-up overdue";
  return null;
}

export function likelyNoResponseSuggestion(): string {
  return "No reply in 3 weeks. Move to Rejected / keep waiting?";
}

export function formatAppliedDateForTemplate(dateOnly: string): string {
  const parsed = parseDateOnlyUtc(dateOnly);
  if (Number.isNaN(parsed.getTime())) return dateOnly.slice(0, 10);
  return parsed.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Short polite template — no AI. Uses only company, role, and applied date. */
export function draftFollowUpMessage(app: Pick<Application, "company" | "role" | "applied_date">): string {
  const role = app.role.trim() || "the role";
  const company = app.company.trim() || "your team";
  const dateLabel = formatAppliedDateForTemplate(app.applied_date);
  return (
    `Hello,\n\n` +
    `I applied for ${role} at ${company} on ${dateLabel} and remain very interested. ` +
    `I would welcome any update on the timeline when convenient.\n\n` +
    `Thank you for your time.`
  );
}

export function defaultNextStepOnCreate(
  appliedDate: string,
  nextStep: string | null | undefined,
  nextStepDate: string | null | undefined,
): { next_step: string | null; next_step_date: string | null } {
  const hasDate = Boolean(nextStepDate && String(nextStepDate).trim());
  if (hasDate) {
    return {
      next_step: nextStep?.trim() || null,
      next_step_date: String(nextStepDate).slice(0, 10),
    };
  }
  return {
    next_step: nextStep?.trim() || DEFAULT_FOLLOWUP_NEXT_STEP,
    next_step_date: addDaysDateOnly(appliedDate.slice(0, 10), APPLIED_FOLLOWUP_DAYS),
  };
}

/** Server-side helper: append follow_up and compute next nudge fields. */
export function applyMarkFollowedUp(
  current: Application,
  now: Date = new Date(),
): {
  timeline: ApplicationTimelineEvent[];
  next_step: string;
  next_step_date: string | null;
} {
  const at = now.toISOString();
  const today = todayDateOnly(now);
  const followUpCount = countFollowUpEvents(current.timeline);
  const timeline = appendTimelineEvent(current.timeline, {
    type: "follow_up",
    label: "Follow-up recorded",
    at,
  });
  const nextCount = followUpCount + 1;
  if (nextCount >= MAX_FOLLOW_UPS) {
    return {
      timeline,
      next_step: DEFAULT_FOLLOWUP_NEXT_STEP,
      next_step_date: null,
    };
  }
  return {
    timeline,
    next_step: DEFAULT_FOLLOWUP_NEXT_STEP,
    next_step_date: addDaysDateOnly(today, FOLLOWUP_RESCHEDULE_DAYS),
  };
}

export function countFollowUpsNeedingAttention(
  apps: FollowUpAppInput[],
  today: string = todayDateOnly(),
): number {
  return apps.filter((app) => needsFollowUp(followUpState(app, today))).length;
}
