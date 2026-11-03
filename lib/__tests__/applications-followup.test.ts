import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Application, ApplicationTimelineEvent } from "@/lib/applications";
import {
  APPLIED_FOLLOWUP_DAYS,
  INTERVIEW_FOLLOWUP_DAYS,
  LIKELY_NO_RESPONSE_DAYS,
  MAX_FOLLOW_UPS,
  addDaysDateOnly,
  applyMarkFollowedUp,
  countFollowUpEvents,
  defaultNextStepOnCreate,
  draftFollowUpMessage,
  followUpBadgeLabel,
  followUpState,
  needsFollowUp,
  parseDateOnlyUtc,
  toDateOnlyUtc,
  todayDateOnly,
} from "@/lib/applications-followup";

function baseApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    company: "Acme",
    role: "Engineer",
    status: "applied",
    applied_date: "2026-10-01",
    job_url: null,
    notes: null,
    salary_offered: null,
    contact_person: null,
    next_step: null,
    next_step_date: null,
    timeline: [],
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

function followUpEvent(at: string, id = "tl-1"): ApplicationTimelineEvent {
  return { id, type: "follow_up", label: "Follow-up recorded", at };
}

describe("applications-followup date-only helpers", () => {
  it("uses UTC calendar parts so local evening does not shift the day", () => {
    // 2026-11-02 22:30 in India is still 2026-11-02 UTC morning; use a late UTC time.
    const lateUtc = new Date("2026-11-02T23:30:00.000Z");
    assert.equal(toDateOnlyUtc(lateUtc), "2026-11-02");
    assert.equal(todayDateOnly(lateUtc), "2026-11-02");

    // Explicit date-only parse ignores time zone offset of the runtime.
    const parsed = parseDateOnlyUtc("2026-03-15");
    assert.equal(parsed.toISOString(), "2026-03-15T00:00:00.000Z");
    assert.equal(addDaysDateOnly("2026-03-15", 7), "2026-03-22");
    assert.equal(addDaysDateOnly("2026-02-27", 3), "2026-03-02");
  });
});

describe("followUpState", () => {
  it("returns none when next_step_date is in the future", () => {
    const app = baseApp({ next_step_date: "2026-11-10", status: "applied", applied_date: "2026-11-01" });
    assert.equal(followUpState(app, "2026-11-02"), "none");
  });

  it("returns due when next_step_date equals today", () => {
    const app = baseApp({ next_step_date: "2026-11-02", applied_date: "2026-10-20" });
    assert.equal(followUpState(app, "2026-11-02"), "due");
    assert.equal(followUpBadgeLabel("due"), "Follow up today");
  });

  it("returns overdue when next_step_date is before today (and under 21 days applied)", () => {
    const app = baseApp({ next_step_date: "2026-10-28", applied_date: "2026-10-20" });
    assert.equal(followUpState(app, "2026-11-02"), "overdue");
    assert.equal(followUpBadgeLabel("overdue"), "Follow-up overdue");
  });

  it("for applied without next_step_date, due at applied + 7 days", () => {
    const applied = "2026-10-26";
    const due = addDaysDateOnly(applied, APPLIED_FOLLOWUP_DAYS);
    assert.equal(due, "2026-11-02");
    const app = baseApp({ applied_date: applied, next_step_date: null, status: "applied" });
    assert.equal(followUpState(app, "2026-11-02"), "due");
    assert.equal(followUpState(app, "2026-11-01"), "none");
    assert.equal(followUpState(app, "2026-11-03"), "overdue");
  });

  it("for applied without next_step_date, likely_no_response at applied + 21 days", () => {
    const applied = "2026-10-12";
    assert.equal(addDaysDateOnly(applied, LIKELY_NO_RESPONSE_DAYS), "2026-11-02");
    const app = baseApp({ applied_date: applied, next_step_date: null, status: "applied" });
    assert.equal(followUpState(app, "2026-11-02"), "likely_no_response");
    assert.ok(needsFollowUp("likely_no_response"));
  });

  it("prefers likely_no_response over overdue when still applied past 21 days", () => {
    const app = baseApp({
      status: "applied",
      applied_date: "2026-10-01",
      next_step_date: "2026-10-08",
    });
    assert.equal(followUpState(app, "2026-11-02"), "likely_no_response");
  });

  it("for interview without next_step_date, due 2 days after last timeline entry", () => {
    const app = baseApp({
      status: "interview",
      applied_date: "2026-10-01",
      next_step_date: null,
      timeline: [
        {
          id: "a",
          type: "status_change",
          status: "interview",
          label: "Moved to Interview",
          at: "2026-10-31T15:00:00.000Z",
        },
      ],
    });
    const due = addDaysDateOnly("2026-10-31", INTERVIEW_FOLLOWUP_DAYS);
    assert.equal(due, "2026-11-02");
    assert.equal(followUpState(app, "2026-11-02"), "due");
    assert.equal(followUpState(app, "2026-11-03"), "overdue");
    assert.equal(followUpState(app, "2026-11-01"), "none");
  });

  it("does not nudge offer or rejected", () => {
    assert.equal(
      followUpState(baseApp({ status: "offer", next_step_date: "2026-11-01" }), "2026-11-02"),
      "none",
    );
    assert.equal(
      followUpState(baseApp({ status: "rejected", next_step_date: "2026-11-01" }), "2026-11-02"),
      "none",
    );
  });

  it("stops nudging after MAX_FOLLOW_UPS timeline events", () => {
    const timeline = [
      followUpEvent("2026-10-20T10:00:00.000Z", "1"),
      followUpEvent("2026-10-27T10:00:00.000Z", "2"),
    ];
    assert.equal(countFollowUpEvents(timeline), MAX_FOLLOW_UPS);
    const app = baseApp({
      status: "applied",
      applied_date: "2026-10-01",
      next_step_date: "2026-11-02",
      timeline,
    });
    assert.equal(followUpState(app, "2026-11-02"), "none");
  });
});

describe("defaultNextStepOnCreate", () => {
  it("fills Follow up + applied + 7 when the user left next_step_date empty", () => {
    assert.deepEqual(defaultNextStepOnCreate("2026-11-02", null, null), {
      next_step: "Follow up",
      next_step_date: "2026-11-09",
    });
    assert.deepEqual(defaultNextStepOnCreate("2026-11-02", "Call recruiter", ""), {
      next_step: "Call recruiter",
      next_step_date: "2026-11-09",
    });
  });

  it("does not override an explicit next_step_date", () => {
    assert.deepEqual(defaultNextStepOnCreate("2026-11-02", null, "2026-11-20"), {
      next_step: null,
      next_step_date: "2026-11-20",
    });
  });
});

describe("applyMarkFollowedUp and 2-follow-up cap", () => {
  it("appends follow_up and schedules +7 days on the first mark", () => {
    const app = baseApp({
      applied_date: "2026-10-26",
      timeline: [],
      next_step_date: "2026-11-02",
    });
    const now = new Date("2026-11-02T12:00:00.000Z");
    const result = applyMarkFollowedUp(app, now);
    assert.equal(countFollowUpEvents(result.timeline), 1);
    assert.equal(result.timeline[0]?.type, "follow_up");
    assert.equal(result.next_step, "Follow up");
    assert.equal(result.next_step_date, "2026-11-09");
    assert.equal(followUpState({ ...app, ...result }, "2026-11-02"), "none");
    assert.equal(followUpState({ ...app, ...result }, "2026-11-09"), "due");
  });

  it("clears next_step_date after the second follow-up so nudges stop", () => {
    const app = baseApp({
      applied_date: "2026-10-26",
      timeline: [followUpEvent("2026-10-20T10:00:00.000Z")],
      next_step_date: "2026-11-02",
    });
    const now = new Date("2026-11-02T12:00:00.000Z");
    const result = applyMarkFollowedUp(app, now);
    assert.equal(countFollowUpEvents(result.timeline), 2);
    assert.equal(result.next_step_date, null);
    assert.equal(followUpState({ ...app, ...result }, "2026-11-20"), "none");
  });
});

describe("draftFollowUpMessage", () => {
  it("builds a polite template from company, role, and applied date only", () => {
    const text = draftFollowUpMessage({
      company: "Acme",
      role: "Staff Engineer",
      applied_date: "2026-10-15",
    });
    assert.match(text, /Staff Engineer/);
    assert.match(text, /Acme/);
    assert.match(text, /October 15, 2026/);
    assert.match(text, /remain very interested/i);
    assert.doesNotMatch(text, /gpt|groq|llm/i);
  });
});
