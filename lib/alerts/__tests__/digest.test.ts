import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIGEST_ALERT_BATCH_CAP,
  DIGEST_WEEKLY_WEEKDAY_IST,
  isAlertDue,
  mergeJobsAcrossAlerts,
  runAlertDigest,
  selectDueAlertsForBatch,
  weekdayInIst,
  type DigestAlertRow,
} from "../digest.ts";
import {
  buildAlertDigestEmail,
  buildDigestSubject,
  DIGEST_EMAIL_FORBIDDEN_KEYS,
  toDigestEmailJob,
} from "../digest-email.ts";
import {
  signDigestUnsubscribeToken,
  verifyDigestUnsubscribeToken,
} from "../digest-token.ts";

const SECRET = "test-digest-unsubscribe-secret-for-unit-tests";

function alert(partial: Partial<DigestAlertRow> & Pick<DigestAlertRow, "id" | "user_id">): DigestAlertRow {
  return {
    id: partial.id,
    user_id: partial.user_id,
    name: partial.name ?? "Engineer roles",
    query: partial.query ?? "q=engineer",
    min_match: partial.min_match ?? 40,
    frequency: partial.frequency ?? "daily",
    discreet: partial.discreet ?? true,
    last_sent_at: partial.last_sent_at ?? null,
    created_at: partial.created_at ?? "2026-10-01T00:00:00.000Z",
  };
}

describe("digest unsubscribe token", () => {
  it("signs and verifies a valid token", () => {
    const token = signDigestUnsubscribeToken(
      {
        alertId: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        nowSec: 1_700_000_000,
      },
      SECRET,
    );
    assert.ok(token);
    const payload = verifyDigestUnsubscribeToken(token!, {
      secret: SECRET,
      nowSec: 1_700_000_000,
    });
    assert.deepEqual(payload, {
      alertId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      exp: 1_700_000_000 + 60 * 60 * 24 * 90,
    });
  });

  it("rejects tampered and expired tokens", () => {
    const token = signDigestUnsubscribeToken(
      {
        alertId: "all",
        userId: "22222222-2222-4222-8222-222222222222",
        nowSec: 1_700_000_000,
        ttlSec: 60,
      },
      SECRET,
    );
    assert.ok(token);
    assert.equal(
      verifyDigestUnsubscribeToken(token! + "x", { secret: SECRET, nowSec: 1_700_000_000 }),
      null,
    );
    assert.equal(
      verifyDigestUnsubscribeToken(token!, { secret: SECRET, nowSec: 1_700_000_100 }),
      null,
    );
    assert.equal(verifyDigestUnsubscribeToken(token!, { secret: "other", nowSec: 1_700_000_000 }), null);
  });
});

describe("digest email builder", () => {
  const RESUME_MARKER = "UNIQUE_RESUME_PHRASE_ZXCVBNM_NEVER_IN_DIGEST";

  it("never includes resume fields or match explanations", () => {
    const profileFixture = {
      resume_raw_text: RESUME_MARKER,
      resume_url: "https://example.com/resume.pdf",
      skills: ["React", "TypeScript"],
      headline: "Senior engineer who loves cats",
      summary: "I built payment systems at Acme",
      work_experience: [{ company: "Acme", title: "Engineer" }],
      matchedSkills: ["React"],
      matchPercent: 92,
    };

    const content = buildAlertDigestEmail({
      jobs: [
        toDigestEmailJob({
          title: "Backend Engineer",
          company: "Northwind",
          location: "Bengaluru",
          statedSalary: "₹25–35 LPA",
          postedAtIso: "2026-11-01T10:00:00.000Z",
          source: "greenhouse",
          jobUrl: "https://getworkgraph.com/jobs/ext-1",
        }),
      ],
      discreet: true,
      alertName: "Backend",
      unsubscribeUrl: "https://getworkgraph.com/api/alerts/unsubscribe?token=abc",
      manageAlertsUrl: "https://getworkgraph.com/alerts",
    });

    const blob = `${content.subject}\n${content.html}\n${content.text}`;
    assert.equal(blob.includes(RESUME_MARKER), false);
    assert.equal(blob.includes(profileFixture.resume_url), false);
    assert.equal(blob.includes("Senior engineer who loves cats"), false);
    assert.equal(blob.includes("I built payment systems"), false);
    assert.equal(blob.includes("matchedSkills"), false);
    assert.equal(blob.includes("92%"), false);
    assert.equal(blob.includes("React"), false);
    for (const key of DIGEST_EMAIL_FORBIDDEN_KEYS) {
      assert.equal(blob.includes(key), false, `must not include key ${key}`);
    }
    assert.match(content.subject, /Your WorkGraph update/);
    assert.match(content.html, /Backend Engineer/);
    assert.match(content.html, /Northwind/);
    assert.match(content.html, /Bengaluru/);
    assert.match(content.html, /₹25–35 LPA/);
    assert.match(content.html, /greenhouse/);
    assert.match(content.text, /Backend Engineer/);
    assert.match(content.html, /WorkGraph/);
    assert.equal(content.html.includes("UNIQUE_RESUME_PHRASE_ZXCVBNM_NEVER_IN_DIGEST"), false);
  });

  it("uses named subject when not discreet", () => {
    assert.equal(
      buildDigestSubject({ jobCount: 3, discreet: false, alertName: "Remote React" }),
      "3 new jobs for Remote React",
    );
    assert.equal(
      buildDigestSubject({ jobCount: 1, discreet: false, alertName: "Remote React" }),
      "1 new job for Remote React",
    );
  });
});

describe("digest due selection and batch cap", () => {
  it("marks daily due after 20h and weekly only on configured IST weekday", () => {
    // Monday 08:00 IST = Sunday 26:30 UTC previous calendar day → 2026-11-02 is Monday IST
    // 2026-11-02T02:30:00.000Z is 08:00 IST Monday
    const mondayIst = new Date("2026-11-02T02:30:00.000Z");
    assert.equal(weekdayInIst(mondayIst), DIGEST_WEEKLY_WEEKDAY_IST);

    const dailyFresh = alert({
      id: "a1",
      user_id: "u1",
      frequency: "daily",
      last_sent_at: new Date(mondayIst.getTime() - 21 * 60 * 60 * 1000).toISOString(),
    });
    const dailyRecent = alert({
      id: "a2",
      user_id: "u1",
      frequency: "daily",
      last_sent_at: new Date(mondayIst.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    });
    assert.equal(isAlertDue(dailyFresh, mondayIst), true);
    assert.equal(isAlertDue(dailyRecent, mondayIst), false);

    const weekly = alert({
      id: "w1",
      user_id: "u1",
      frequency: "weekly",
      last_sent_at: new Date(mondayIst.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.equal(isAlertDue(weekly, mondayIst), true);

    const tuesdayIst = new Date("2026-11-03T02:30:00.000Z");
    assert.notEqual(weekdayInIst(tuesdayIst), DIGEST_WEEKLY_WEEKDAY_IST);
    assert.equal(isAlertDue(weekly, tuesdayIst), false);
  });

  it("respects the hard batch cap and leaves remainder for the next run", () => {
    const now = new Date("2026-11-02T02:30:00.000Z");
    const alerts = Array.from({ length: DIGEST_ALERT_BATCH_CAP + 5 }, (_, i) =>
      alert({
        id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        user_id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        frequency: "daily",
        last_sent_at: null,
      }),
    );
    const { due, capped } = selectDueAlertsForBatch(alerts, now, DIGEST_ALERT_BATCH_CAP);
    assert.equal(due.length, DIGEST_ALERT_BATCH_CAP);
    assert.equal(capped, true);
  });
});

describe("runAlertDigest zero-match and send path", () => {
  it("skips email when a user has zero matches and does not update last_sent_at", async () => {
    const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const alertId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
    const sent: unknown[] = [];

    const admin = {
      from(table: string) {
        if (table === "profiles") {
          return {
            select() {
              return {
                in: async () => ({ data: [], error: null }),
              };
            },
          };
        }
        assert.equal(table, "job_alerts");
        return {
          select() {
            return {
              in() {
                return {
                  order: async () => ({
                    data: [
                      {
                        id: alertId,
                        user_id: userId,
                        name: "Roles",
                        query: "q=engineer",
                        min_match: 40,
                        frequency: "daily",
                        discreet: true,
                        last_sent_at: null,
                        created_at: "2026-10-01T00:00:00.000Z",
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          },
          update(patch: Record<string, unknown>) {
            return {
              eq(col: string, val: string) {
                if (col === "id") {
                  return {
                    eq: async () => {
                      updates.push({ id: val, patch });
                      return { error: null };
                    },
                  };
                }
                return this;
              },
            };
          },
        };
      },
      auth: { admin: { getUserById: async () => ({ data: { user: null }, error: null }) } },
    };

    const result = await runAlertDigest(admin as never, {
      now: new Date("2026-11-02T02:30:00.000Z"),
      resolveUserEmail: async () => "seeker@example.com",
      matchForAlert: async () => [],
      sendEmail: async (input) => {
        sent.push(input);
        return { ok: true };
      },
    });

    assert.equal(result.emailsSent, 0);
    assert.equal(result.emailsSkippedEmpty, 1);
    assert.equal(sent.length, 0);
    assert.equal(updates.length, 0);
  });

  it("sends once per user with de-duplicated jobs and updates last_sent_at after success", async () => {
    const userId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const alertA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const alertB = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const updates: string[] = [];
    const sent: Array<{ subject: string; html: string; text: string }> = [];

    const admin = {
      from(table: string) {
        if (table === "profiles") {
          return {
            select() {
              return {
                in: async () => ({
                  data: [
                    {
                      id: userId,
                      skills: ["React"],
                      headline: "Engineer",
                      summary: "UNIQUE_RESUME_PHRASE_ZXCVBNM_NEVER_IN_DIGEST",
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        }
        return {
          select() {
            return {
              in() {
                return {
                  order: async () => ({
                    data: [
                      {
                        id: alertA,
                        user_id: userId,
                        name: "React",
                        query: "q=react",
                        min_match: 40,
                        frequency: "daily",
                        discreet: false,
                        last_sent_at: null,
                        created_at: "2026-10-01T00:00:00.000Z",
                      },
                      {
                        id: alertB,
                        user_id: userId,
                        name: "Frontend",
                        query: "q=frontend",
                        min_match: 40,
                        frequency: "daily",
                        discreet: false,
                        last_sent_at: null,
                        created_at: "2026-10-01T00:00:00.000Z",
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          },
          update() {
            return {
              eq(col: string, val: string) {
                if (col === "id") {
                  return {
                    eq: async () => {
                      updates.push(val);
                      return { error: null };
                    },
                  };
                }
                return this;
              },
            };
          },
        };
      },
    };

    const job = toDigestEmailJob({
      title: "React Engineer",
      company: "Acme",
      location: "Remote",
      postedAtIso: "2026-11-01T00:00:00.000Z",
      source: "lever",
      jobUrl: "https://getworkgraph.com/jobs/ext-react",
    });

    const result = await runAlertDigest(admin as never, {
      now: new Date("2026-11-02T02:30:00.000Z"),
      resolveUserEmail: async () => "seeker@example.com",
      matchForAlert: async () => [job],
      sendEmail: async (input) => {
        sent.push({ subject: input.subject, html: input.html, text: input.text ?? "" });
        return { ok: true };
      },
    });

    assert.equal(result.emailsSent, 1);
    assert.equal(sent.length, 1);
    assert.equal(updates.sort().join(","), [alertA, alertB].sort().join(","));
    const blob = `${sent[0]!.subject}\n${sent[0]!.html}\n${sent[0]!.text}`;
    assert.equal(blob.includes("UNIQUE_RESUME_PHRASE_ZXCVBNM_NEVER_IN_DIGEST"), false);
    assert.match(sent[0]!.subject, /1 new job for React/);
  });
});

describe("mergeJobsAcrossAlerts", () => {
  it("de-duplicates by job URL and caps at 10", () => {
    const lists = [
      Array.from({ length: 6 }, (_, i) =>
        toDigestEmailJob({
          title: `A${i}`,
          company: "C",
          location: "L",
          source: "s",
          jobUrl: `https://x/jobs/${i}`,
        }),
      ),
      Array.from({ length: 6 }, (_, i) =>
        toDigestEmailJob({
          title: `B${i}`,
          company: "C",
          location: "L",
          source: "s",
          jobUrl: `https://x/jobs/${i}`,
        }),
      ),
      Array.from({ length: 8 }, (_, i) =>
        toDigestEmailJob({
          title: `C${i}`,
          company: "C",
          location: "L",
          source: "s",
          jobUrl: `https://x/jobs/extra-${i}`,
        }),
      ),
    ];
    const merged = mergeJobsAcrossAlerts(lists, 10);
    assert.equal(merged.length, 10);
    assert.equal(new Set(merged.map((j) => j.jobUrl)).size, 10);
  });
});

describe("cron Authorization pattern", () => {
  it("GET /api/cron/alert-digest returns 401 without a valid CRON_SECRET bearer", async () => {
    const { GET } = await import("../../../app/api/cron/alert-digest/route.ts");
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "unit-test-cron-secret";
    try {
      const missing = await GET(new Request("https://example.com/api/cron/alert-digest"));
      assert.equal(missing.status, 401);

      const wrong = await GET(
        new Request("https://example.com/api/cron/alert-digest", {
          headers: { Authorization: "Bearer wrong" },
        }),
      );
      assert.equal(wrong.status, 401);
    } finally {
      if (prev === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev;
    }
  });
});
