import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ACCOUNT_TABLES } from "../data-map.ts";
import { AccountDataError } from "../errors.ts";
import { handleAccountDelete, handleAccountExport } from "../handlers.ts";
import {
  ACCOUNT_DELETE_FAILED,
  ACCOUNT_EXPORT_FAILED,
  DELETE_CONFIRMATION_REQUIRED,
  SIGN_IN_REQUIRED,
  parseDeleteConfirmation,
} from "../messages.ts";
import { accountDataRights } from "../privacy-copy.ts";
import { createSupabaseAccountStore, type AccountStore } from "../store.ts";

const SESSION = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const RESUME = "SESSION RESUME UNIQUE";
const OTHER_RESUME = "OTHER RESUME UNIQUE";
const EMAIL = "me@example.com";
const OTHER_EMAIL = "other.person@example.com";
const PHONE = "+15555550123";
const LEAK = `leak ${OTHER_EMAIL} ${OTHER_RESUME} service-role-key`;

type Op = { op: string; name: string; userId: string };

function allow() {
  return { allowed: true, retryAfterSec: 0 };
}

function recordingStore(failOn?: string): { store: AccountStore; ops: Op[] } {
  const ops: Op[] = [];
  const store: AccountStore = {
    async selectOwned(table, column, userId) {
      ops.push({ op: "select", name: table, userId });
      if (failOn === table) throw new Error(LEAK);
      return [{ [column]: userId, resume_raw_text: RESUME, email: EMAIL }];
    },
    async anonymiseOwned(table, _column, userId) {
      ops.push({ op: "anonymise", name: table, userId });
      if (failOn === table) throw new Error(LEAK);
    },
    async deleteOwned(table, _column, userId) {
      ops.push({ op: "delete", name: table, userId });
      if (failOn === table) throw new Error(LEAK);
    },
    async listOwnedObjects(bucket, userId) {
      ops.push({ op: "list", name: bucket, userId });
      if (failOn === bucket) throw new Error(LEAK);
      return [`${userId}/resume.pdf`];
    },
    async removeOwnedObjects(bucket, userId) {
      ops.push({ op: "remove", name: bucket, userId });
    },
    async getAuthAccount(userId) {
      ops.push({ op: "auth-get", name: "auth.users", userId });
      return { id: userId, email: EMAIL, phone: PHONE, createdAt: "2026-01-01T00:00:00.000Z" };
    },
    async deleteAuthUser(userId) {
      ops.push({ op: "auth-delete", name: "auth.users", userId });
      if (failOn === "auth.users") throw new Error(LEAK);
    },
  };
  return { store, ops };
}

function captureLogs(run: () => Promise<void>): Promise<string> {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join(" "));
  };
  return run()
    .then(() => lines.join("\n"))
    .finally(() => {
      console.error = original;
    });
}

describe("delete confirmation", () => {
  it("accepts only the exact confirmation and ignores a client user id", () => {
    assert.equal(parseDeleteConfirmation({ confirmation: "DELETE", user_id: OTHER }), true);
    assert.equal(parseDeleteConfirmation({ confirmation: "delete" }), false);
    assert.equal(parseDeleteConfirmation({ confirmation: "DELETE " }), false);
    assert.equal(parseDeleteConfirmation({}), false);
    assert.equal(parseDeleteConfirmation(null), false);
    assert.equal(parseDeleteConfirmation("DELETE"), false);
  });
});

describe("account export", () => {
  it("returns 401 when there is no session and does not read data", async () => {
    const { store, ops } = recordingStore();
    let rated = false;
    const result = await handleAccountExport({
      userId: null,
      store,
      rateLimit: () => {
        rated = true;
        return allow();
      },
    });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: SIGN_IN_REQUIRED });
    assert.equal(ops.length, 0);
    assert.equal(rated, false);
  });

  it("returns 429 before reading rows when the account is over the hourly limit", async () => {
    const { store, ops } = recordingStore();
    const result = await handleAccountExport({
      userId: SESSION,
      store,
      rateLimit: () => ({ allowed: false, retryAfterSec: 90 }),
    });
    assert.equal(result.status, 429);
    assert.equal(result.headers?.["Retry-After"], "90");
    assert.equal(ops.length, 0);
  });

  it("returns only the session user's rows from the mock client", async () => {
    const calls: Array<{ op: string; table: string; column?: string; value?: string }> = [];
    const signedForOther =
      `https://db.example/storage/v1/object/sign/resumes/${OTHER}/secret.pdf?token=sekret`;
    const signedForSession =
      `https://db.example/storage/v1/object/sign/resumes/${SESSION}/mine.pdf?token=sekret`;
    const fake = {
      from(table: string) {
        const state: { column?: string; value?: string; patch?: Record<string, null> } = {};
        const finish = () => {
          calls.push({ op: "select", table, column: state.column, value: state.value });
          if (table === "profiles") {
            return {
              data: [
                {
                  id: SESSION,
                  email: EMAIL,
                  phone: PHONE,
                  resume_raw_text: RESUME,
                  resume_url: signedForSession,
                  service_role_key: "super-secret",
                },
                {
                  id: OTHER,
                  email: OTHER_EMAIL,
                  phone: "+19999999999",
                  resume_raw_text: OTHER_RESUME,
                  resume_url: signedForOther,
                },
              ],
              error: null,
            };
          }
          const owner = ACCOUNT_TABLES.find((entry) => entry.table === table)?.ownerColumn ?? "user_id";
          return {
            data: [
              { [owner]: SESSION, note: "mine" },
              { [owner]: OTHER, note: OTHER_RESUME, email: OTHER_EMAIL },
            ],
            error: null,
          };
        };
        const builder = {
          select() {
            return builder;
          },
          eq(column: string, value: string) {
            state.column = column;
            state.value = value;
            return builder;
          },
          range() {
            return Promise.resolve(finish());
          },
          then(onFulfilled: (value: ReturnType<typeof finish>) => unknown) {
            return Promise.resolve(finish()).then(onFulfilled);
          },
        };
        return builder;
      },
      storage: {
        from(bucket: string) {
          return {
            async list(prefix: string) {
              calls.push({ op: "list", table: bucket, value: prefix });
              if (prefix === SESSION) {
                return {
                  data: [
                    { name: "resume.pdf", id: "file-1" },
                    { name: `../${OTHER}/secret.pdf`, id: "file-2" },
                    { name: "nested", id: null },
                  ],
                  error: null,
                };
              }
              if (prefix === `${SESSION}/nested`) {
                return { data: [{ name: "extra.pdf", id: "file-3" }], error: null };
              }
              return { data: [], error: null };
            },
            async remove() {
              return { error: null };
            },
          };
        },
      },
      auth: {
        admin: {
          async getUserById(id: string) {
            if (id !== SESSION) {
              return { data: { user: { id: OTHER, email: OTHER_EMAIL, phone: null, created_at: "x" } }, error: null };
            }
            return {
              data: { user: { id: SESSION, email: EMAIL, phone: PHONE, created_at: "2026-01-01T00:00:00.000Z" } },
              error: null,
            };
          },
          async deleteUser() {
            return { error: null };
          },
        },
      },
    };

    const store = createSupabaseAccountStore(fake as never);
    const result = await handleAccountExport({
      userId: SESSION,
      store,
      rateLimit: allow,
      now: () => new Date("2026-10-25T12:00:00.000Z"),
    });

    assert.equal(result.status, 200);
    assert.match(result.headers?.["Content-Disposition"] ?? "", /workgraph-account-export\.json/);
    const body = result.body as {
      userId: string;
      account: { email: string; phone: string };
      tables: Record<string, Array<Record<string, unknown>>>;
      storage: { resumes: string[]; avatars: string[] };
    };
    assert.equal(body.userId, SESSION);
    assert.equal(body.account.email, EMAIL);
    const profile = body.tables.profiles[0];
    assert.equal(profile.resume_raw_text, RESUME);
    assert.equal(profile.resume_url, `${SESSION}/mine.pdf`);
    assert.equal("service_role_key" in profile, false);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes(OTHER), false);
    assert.equal(serialized.includes(OTHER_RESUME), false);
    assert.equal(serialized.includes(OTHER_EMAIL), false);
    assert.equal(serialized.includes("sekret"), false);
    assert.equal(serialized.includes("super-secret"), false);
    assert.ok(body.storage.resumes.includes(`${SESSION}/resume.pdf`));
    assert.ok(body.storage.resumes.includes(`${SESSION}/nested/extra.pdf`));
    assert.equal(body.storage.resumes.some((path) => path.includes(OTHER)), false);
    for (const call of calls.filter((item) => item.op === "select")) {
      assert.equal(call.value, SESSION);
    }
  });

  it("does not write resume text, email, or phone to the log when export fails", async () => {
    const { store } = recordingStore("profiles");
    const log = await captureLogs(async () => {
      const result = await handleAccountExport({
        userId: SESSION,
        store,
        rateLimit: allow,
      });
      assert.equal(result.status, 500);
      assert.deepEqual(result.body, { error: ACCOUNT_EXPORT_FAILED });
    });
    assert.match(log, /account_export_failed/);
    assert.equal(log.includes(OTHER_EMAIL), false);
    assert.equal(log.includes(OTHER_RESUME), false);
    assert.equal(log.includes(EMAIL), false);
    assert.equal(log.includes(PHONE), false);
    assert.equal(log.includes(RESUME), false);
    assert.equal(log.includes("service-role-key"), false);
  });
});

describe("account delete", () => {
  it("returns 401 when there is no session", async () => {
    const { store, ops } = recordingStore();
    const result = await handleAccountDelete({
      userId: null,
      body: { confirmation: "DELETE" },
      store,
      rateLimit: allow,
    });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: SIGN_IN_REQUIRED });
    assert.equal(ops.length, 0);
  });

  it("returns 400 when the confirmation is missing", async () => {
    const { store, ops } = recordingStore();
    const result = await handleAccountDelete({
      userId: SESSION,
      body: { confirmation: "delete", user_id: OTHER },
      store,
      rateLimit: allow,
    });
    assert.equal(result.status, 400);
    assert.deepEqual(result.body, { error: DELETE_CONFIRMATION_REQUIRED });
    assert.equal(ops.length, 0);
  });

  it("deletes only the session user's rows and keeps legal records unlinked", async () => {
    const { store, ops } = recordingStore();
    const result = await handleAccountDelete({
      userId: SESSION,
      body: { confirmation: "DELETE", user_id: OTHER },
      store,
      rateLimit: allow,
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, redirectTo: "/?accountDeleted=1" });
    assert.ok(ops.every((op) => op.userId === SESSION));
    assert.equal(ops.some((op) => op.userId === OTHER), false);

    const names = ops.map((op) => `${op.op}:${op.name}`);
    const authAt = names.indexOf("auth-delete:auth.users");
    assert.equal(authAt, names.length - 1);
    assert.ok(names.indexOf("list:resumes") < names.indexOf("delete:profiles"));
    assert.ok(names.indexOf("list:avatars") < authAt);
    assert.ok(names.includes("anonymise:payments"));
    assert.ok(names.includes("anonymise:consent_log"));
    assert.ok(names.includes("anonymise:hidden_job_analytics"));
    assert.equal(names.includes("delete:payments"), false);
    assert.equal(names.includes("delete:consent_log"), false);
    assert.ok(names.includes("delete:profiles"));
    assert.ok(names.includes("delete:feature_usage"));
    assert.ok(names.includes("remove:resumes"));
    assert.ok(names.includes("remove:avatars"));
  });

  it("does not delete the login when storage removal fails, so the request can be retried", async () => {
    const { store, ops } = recordingStore("resumes");
    const result = await handleAccountDelete({
      userId: SESSION,
      body: { confirmation: "DELETE" },
      store,
      rateLimit: allow,
    });
    assert.equal(result.status, 500);
    assert.equal(ops.some((op) => op.op === "auth-delete"), false);
    assert.equal(ops.some((op) => op.op === "delete"), false);
  });

  it("does not delete the login when a later table delete fails", async () => {
    const { store, ops } = recordingStore("profiles");
    const result = await handleAccountDelete({
      userId: SESSION,
      body: { confirmation: "DELETE" },
      store,
      rateLimit: allow,
    });
    assert.equal(result.status, 500);
    assert.equal(ops.some((op) => op.op === "auth-delete"), false);
    assert.ok(ops.some((op) => op.op === "anonymise" && op.name === "payments"));
  });

  it("is safe to run again after a successful delete", async () => {
    const { store, ops } = recordingStore();
    const input = {
      userId: SESSION,
      body: { confirmation: "DELETE" },
      store,
      rateLimit: allow,
    };
    const first = await handleAccountDelete(input);
    const second = await handleAccountDelete(input);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(ops.filter((op) => op.op === "auth-delete").length, 2);
  });

  it("does not write resume text, email, or phone to the log when delete fails", async () => {
    const { store } = recordingStore("profiles");
    const log = await captureLogs(async () => {
      const result = await handleAccountDelete({
        userId: SESSION,
        body: { confirmation: "DELETE" },
        store,
        rateLimit: allow,
      });
      assert.equal(result.status, 500);
      assert.deepEqual(result.body, { error: ACCOUNT_DELETE_FAILED });
    });
    assert.match(log, /account_delete_failed/);
    assert.equal(log.includes(EMAIL), false);
    assert.equal(log.includes(OTHER_EMAIL), false);
    assert.equal(log.includes(PHONE), false);
    assert.equal(log.includes(RESUME), false);
    assert.equal(log.includes(OTHER_RESUME), false);
    assert.equal(log.includes("service-role-key"), false);
  });
});

describe("supabase account store", () => {
  it("nulls payment and consent owners and refuses tables that are not in the map", async () => {
    const writes: Array<{ op: string; table: string; column?: string; value?: string; patch?: Record<string, null> }> = [];
    const fake = {
      from(table: string) {
        const state: { op: string; column?: string; value?: string; patch?: Record<string, null> } = { op: "select" };
        const finish = () => {
          writes.push({ op: state.op, table, column: state.column, value: state.value, patch: state.patch });
          if (table === "consent_log") {
            return { data: null, error: { code: "42P01", message: `missing ${EMAIL} ${RESUME}` } };
          }
          return { data: null, error: null };
        };
        const builder = {
          select() {
            state.op = "select";
            return builder;
          },
          update(patch: Record<string, null>) {
            state.op = "update";
            state.patch = patch;
            return builder;
          },
          delete() {
            state.op = "delete";
            return builder;
          },
          eq(column: string, value: string) {
            state.column = column;
            state.value = value;
            return builder;
          },
          range() {
            return builder;
          },
          then(onFulfilled: (value: ReturnType<typeof finish>) => unknown) {
            return Promise.resolve(finish()).then(onFulfilled);
          },
        };
        return builder;
      },
      storage: { from() { return { list: async () => ({ data: [], error: null }), remove: async () => ({ error: null }) }; } },
      auth: {
        admin: {
          async getUserById() {
            return { data: { user: null }, error: null };
          },
          async deleteUser(id: string) {
            writes.push({ op: "auth-delete", table: "auth.users", value: id });
            return { error: { status: 404, message: `User not found ${EMAIL}` } };
          },
        },
      },
    };
    const store = createSupabaseAccountStore(fake as never);
    const log = await captureLogs(async () => {
      await store.anonymiseOwned("payments", "user_id", SESSION);
      await store.anonymiseOwned("consent_log", "user_id", SESSION);
      await store.deleteOwned("profiles", "id", SESSION);
      await store.deleteAuthUser(SESSION);
    });
    const payment = writes.find((item) => item.table === "payments");
    assert.equal(payment?.op, "update");
    assert.deepEqual(payment?.patch, { user_id: null });
    assert.equal(payment?.value, SESSION);
    assert.equal(writes.some((item) => item.table === "payments" && item.op === "delete"), false);
    assert.equal(writes.some((item) => item.table === "profiles" && item.op === "delete" && item.value === SESSION), true);
    assert.equal(writes.some((item) => item.op === "auth-delete" && item.value === SESSION), true);
    await assert.rejects(() => store.deleteOwned("jobs", "user_id", SESSION), AccountDataError);
    await assert.rejects(() => store.anonymiseOwned("profiles", "id", SESSION), AccountDataError);
    assert.equal(log.includes(EMAIL), false);
    assert.equal(log.includes(RESUME), false);
  });

  it("drops another user's auth record if the admin lookup returns a different id", async () => {
    const fake = {
      from() {
        throw new Error("not used");
      },
      storage: { from() { return { list: async () => ({ data: [], error: null }), remove: async () => ({ error: null }) }; } },
      auth: {
        admin: {
          async getUserById() {
            return { data: { user: { id: OTHER, email: OTHER_EMAIL, phone: PHONE, created_at: "x" } }, error: null };
          },
          async deleteUser() {
            return { error: null };
          },
        },
      },
    };
    const store = createSupabaseAccountStore(fake as never);
    assert.equal(await store.getAuthAccount(SESSION), null);
  });
});

describe("privacy copy", () => {
  it("uses the legal retention sentences for backups, payments, and consent", () => {
    const rights = accountDataRights();
    assert.match(rights.backup, /30 days/);
    assert.match(rights.payments, /user id removed/);
    assert.match(rights.consent, /90 days/);
    assert.match(rights.deletedBanner, /30 days/);
    assert.ok(rights.removed.some((item) => /resume text/i.test(item)));
    assert.ok(rights.kept.some((item) => /payment/i.test(item)));
    assert.ok(rights.unlinked.some((item) => /consent/i.test(item)));
  });
});
