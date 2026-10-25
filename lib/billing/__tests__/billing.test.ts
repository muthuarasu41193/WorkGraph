import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { extendExpiry, grantPass, type GrantDeps, type PaymentRecord } from "../grant";
import { handleCreateOrder, handleVerifyPayment, handleWebhook } from "../handlers";
import { PASS_PLANS } from "../plans";
import { createRazorpayOrder } from "../razorpay-api";
import { hmacSha256Hex, verifyPaymentSignature, verifyWebhookSignature } from "../signature";
import { PASS_UPGRADE_HREF, PASS_UPGRADE_LABEL, limitNoticeFromPayload, upgradeHrefFromPayload } from "../../subscription/upgrade";
import { logErrorCode } from "../../security/log";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const KEY_SECRET = "test_key_secret";
const WEBHOOK_SECRET = "test_webhook_secret";

function orderRequest(body: unknown): Request {
  return new Request("http://localhost/api/billing/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function verifyRequest(body: unknown): Request {
  return new Request("http://localhost/api/billing/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function webhookRequest(raw: string, signature: string): Request {
  return new Request("http://localhost/api/billing/razorpay/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": signature,
    },
    body: raw,
  });
}

function memoryStore(now: Date, initialExpiry: Date | null) {
  const payments: PaymentRecord[] = [];
  let expiry = initialExpiry;
  const deps: GrantDeps = {
    now,
    findByOrderId: async (orderId) => payments.find((row) => row.providerOrderId === orderId) ?? null,
    findByPaymentId: async (paymentId) =>
      payments.find((row) => row.providerPaymentId === paymentId) ?? null,
    claimCreated: async (paymentRowId, providerPaymentId, grantedUntil) => {
      const row = payments.find((item) => item.id === paymentRowId);
      if (!row || row.status !== "created") return null;
      if (payments.some((item) => item.providerPaymentId === providerPaymentId)) return null;
      row.status = "paid";
      row.providerPaymentId = providerPaymentId;
      row.grantedUntil = grantedUntil;
      return { ...row };
    },
    readExpiry: async () => expiry,
    writePremium: async (_userId, expiresAt) => {
      const next = new Date(expiresAt);
      if (!expiry || next.getTime() > expiry.getTime()) expiry = next;
    },
  };
  return {
    deps,
    payments,
    expiry: () => expiry,
    seed(row: PaymentRecord) {
      payments.push(row);
    },
  };
}

function createdPayment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "payrow-1",
    userId: USER,
    planId: "pass_30",
    amountPaise: PASS_PLANS.pass_30.amountPaise,
    currency: PASS_PLANS.pass_30.currency,
    providerOrderId: "order_1",
    providerPaymentId: null,
    status: "created",
    grantedUntil: null,
    ...overrides,
  };
}

describe("razorpay signatures", () => {
  it("accepts a valid payment signature and rejects a tampered one", () => {
    const orderId = "order_abc";
    const paymentId = "pay_abc";
    const signature = hmacSha256Hex(KEY_SECRET, `${orderId}|${paymentId}`);
    assert.equal(
      verifyPaymentSignature({ orderId, paymentId, signature, keySecret: KEY_SECRET }),
      true,
    );
    assert.equal(
      verifyPaymentSignature({
        orderId,
        paymentId,
        signature: `${signature.slice(0, -1)}0`,
        keySecret: KEY_SECRET,
      }),
      false,
    );
    assert.equal(
      verifyPaymentSignature({ orderId, paymentId, signature: "short", keySecret: KEY_SECRET }),
      false,
    );
  });

  it("accepts a webhook signature over the raw body and rejects a different body", () => {
    const raw = '{ "event": "payment.captured", "payload": {} }';
    const signature = hmacSha256Hex(WEBHOOK_SECRET, raw);
    assert.equal(verifyWebhookSignature(raw, signature, WEBHOOK_SECRET), true);
    assert.equal(verifyWebhookSignature(raw.replace(" ", ""), signature, WEBHOOK_SECRET), false);
    assert.equal(verifyWebhookSignature(raw, "not-a-signature", WEBHOOK_SECRET), false);
  });
});

describe("grantPass", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("applies a payment id once", async () => {
    const store = memoryStore(now, null);
    store.seed(createdPayment());
    const input = { providerOrderId: "order_1", providerPaymentId: "pay_1", expectedUserId: USER };
    const first = await grantPass(input, store.deps);
    const second = await grantPass(input, store.deps);
    const expected = extendExpiry(null, now, PASS_PLANS.pass_30.days).toISOString();
    assert.equal(first.applied, true);
    assert.equal(second.applied, false);
    assert.equal(first.grantedUntil, expected);
    assert.equal(second.grantedUntil, expected);
    assert.equal(store.expiry()?.toISOString(), expected);
  });

  it("stacks a second pass from the current expiry", async () => {
    const current = new Date("2026-06-01T00:00:00.000Z");
    const store = memoryStore(now, current);
    store.seed(createdPayment());
    store.seed(
      createdPayment({
        id: "payrow-2",
        planId: "pass_90",
        amountPaise: PASS_PLANS.pass_90.amountPaise,
        providerOrderId: "order_2",
      }),
    );
    const first = await grantPass(
      { providerOrderId: "order_1", providerPaymentId: "pay_1" },
      store.deps,
    );
    const second = await grantPass(
      { providerOrderId: "order_2", providerPaymentId: "pay_2" },
      store.deps,
    );
    const afterFirst = extendExpiry(current, now, PASS_PLANS.pass_30.days);
    const afterSecond = extendExpiry(afterFirst, now, PASS_PLANS.pass_90.days);
    assert.equal(first.grantedUntil, afterFirst.toISOString());
    assert.equal(second.grantedUntil, afterSecond.toISOString());
    assert.ok(afterSecond.getTime() > afterFirst.getTime());
  });

  it("refuses a stored amount that is not the catalog price", async () => {
    const store = memoryStore(now, null);
    store.seed(createdPayment({ amountPaise: 100 }));
    await assert.rejects(
      () => grantPass({ providerOrderId: "order_1", providerPaymentId: "pay_1" }, store.deps),
      /does not match the plan/,
    );
    assert.equal(store.expiry(), null);
  });
});

describe("billing routes", () => {
  it("returns 401 for an unauthenticated order and does not create one", async () => {
    let called = false;
    const response = await handleCreateOrder(orderRequest({ planId: "pass_30", amount: 100 }), {
      getSessionUser: async () => null,
      keyId: () => "rzp_test_public",
      createOrder: async () => {
        called = true;
        return { id: "order_x", amount: 1, currency: "INR" };
      },
      insertPayment: async () => {
        called = true;
      },
    });
    assert.equal(response.status, 401);
    assert.equal(called, false);
  });

  it("charges the catalog amount and ignores a client amount", async () => {
    let seenAmount = 0;
    let notes: Record<string, string> = {};
    const response = await handleCreateOrder(
      orderRequest({ planId: "pass_90", amount: 100, currency: "USD", email: "person@example.com" }),
      {
        getSessionUser: async () => ({ id: USER }),
        keyId: () => "rzp_test_public",
        newId: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        createOrder: async (input) => {
          seenAmount = input.amountPaise;
          notes = input.notes;
          return { id: "order_catalog", amount: input.amountPaise, currency: input.currency };
        },
        insertPayment: async (row) => {
          assert.equal(row.amountPaise, PASS_PLANS.pass_90.amountPaise);
          assert.equal(row.currency, "INR");
          assert.equal(row.userId, USER);
          assert.equal(row.planId, "pass_90");
        },
      },
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { amount: number; currency: string; keyId: string; orderId: string };
    assert.equal(seenAmount, PASS_PLANS.pass_90.amountPaise);
    assert.equal(body.amount, PASS_PLANS.pass_90.amountPaise);
    assert.equal(body.currency, "INR");
    assert.equal(body.keyId, "rzp_test_public");
    assert.equal(body.orderId, "order_catalog");
    assert.deepEqual(notes, { user_id: USER, plan_id: "pass_90" });
    assert.equal(JSON.stringify(body).includes("example.com"), false);
  });

  it("rejects an unknown plan before calling Razorpay", async () => {
    let called = false;
    const response = await handleCreateOrder(orderRequest({ planId: "lifetime", amount: 1 }), {
      getSessionUser: async () => ({ id: USER }),
      keyId: () => "rzp_test_public",
      createOrder: async () => {
        called = true;
        return { id: "order_x", amount: 1, currency: "INR" };
      },
      insertPayment: async () => {
        called = true;
      },
    });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  });

  it("returns 403 when the receipt belongs to another user", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const store = memoryStore(now, null);
    store.seed(createdPayment({ userId: OTHER, providerOrderId: "order_other" }));
    const signature = hmacSha256Hex(KEY_SECRET, "order_other|pay_other");
    let premiumWrites = 0;
    const response = await handleVerifyPayment(
      verifyRequest({
        razorpay_order_id: "order_other",
        razorpay_payment_id: "pay_other",
        razorpay_signature: signature,
      }),
      {
        getSessionUser: async () => ({ id: USER }),
        keySecret: () => KEY_SECRET,
        grant: (input) =>
          grantPass(input, {
            ...store.deps,
            writePremium: async (userId, expiresAt) => {
              premiumWrites += 1;
              await store.deps.writePremium(userId, expiresAt);
            },
          }),
      },
    );
    assert.equal(response.status, 403);
    assert.equal(premiumWrites, 0);
    assert.equal(store.payments[0]?.status, "created");
  });

  it("rejects an invalid payment signature before granting", async () => {
    let granted = false;
    const response = await handleVerifyPayment(
      verifyRequest({
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "deadbeef",
      }),
      {
        getSessionUser: async () => ({ id: USER }),
        keySecret: () => KEY_SECRET,
        grant: async () => {
          granted = true;
          return { grantedUntil: nowIso(), applied: true };
        },
      },
    );
    assert.equal(response.status, 400);
    assert.equal(granted, false);
  });

  it("grants from a valid webhook and ignores unknown events", async () => {
    const captured = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_1", order_id: "order_1", email: "person@example.com" } } },
    });
    let granted: { providerOrderId: string; providerPaymentId: string } | null = null;
    const ok = await handleWebhook(webhookRequest(captured, hmacSha256Hex(WEBHOOK_SECRET, captured)), {
      webhookSecret: () => WEBHOOK_SECRET,
      grant: async (input) => {
        granted = input;
        return { grantedUntil: "2026-01-31T00:00:00.000Z", applied: true };
      },
    });
    assert.equal(ok.status, 200);
    assert.deepEqual(granted, { providerOrderId: "order_1", providerPaymentId: "pay_1" });

    let ignored = false;
    const other = await handleWebhook(
      webhookRequest(
        JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { email: "person@example.com" } } } }),
        hmacSha256Hex(
          WEBHOOK_SECRET,
          JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { email: "person@example.com" } } } }),
        ),
      ),
      {
        webhookSecret: () => WEBHOOK_SECRET,
        grant: async () => {
          ignored = true;
          return { grantedUntil: nowIso(), applied: true };
        },
      },
    );
    assert.equal(other.status, 200);
    assert.equal(ignored, false);
  });

  it("rejects an invalid webhook signature", async () => {
    const raw = JSON.stringify({ event: "order.paid", payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } } });
    let granted = false;
    const response = await handleWebhook(webhookRequest(raw, hmacSha256Hex("wrong", raw)), {
      webhookSecret: () => WEBHOOK_SECRET,
      grant: async () => {
        granted = true;
        return { grantedUntil: nowIso(), applied: true };
      },
    });
    assert.equal(response.status, 400);
    assert.equal(granted, false);
  });
});

describe("razorpay order request", () => {
  it("sends only the catalog amount, receipt, and user id notes", async () => {
    let sent = "";
    const result = await createRazorpayOrder(
      {
        keyId: "rzp_test_public",
        keySecret: KEY_SECRET,
        amountPaise: PASS_PLANS.pass_30.amountPaise,
        currency: "INR",
        receipt: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        notes: { user_id: USER, plan_id: "pass_30" },
      },
      async (_url, init) => {
        sent = String(init?.body ?? "");
        return new Response(
          JSON.stringify({ id: "order_1", amount: PASS_PLANS.pass_30.amountPaise, currency: "INR" }),
          { status: 200 },
        );
      },
    );
    const body = JSON.parse(sent) as { amount: number; notes: Record<string, string> };
    assert.equal(result.id, "order_1");
    assert.equal(body.amount, PASS_PLANS.pass_30.amountPaise);
    assert.deepEqual(Object.keys(body.notes).sort(), ["plan_id", "user_id"]);
    assert.equal(sent.includes("resume"), false);
  });

  it("does not surface provider error text", async () => {
    await assert.rejects(
      () =>
        createRazorpayOrder(
          {
            keyId: "rzp_test_public",
            keySecret: KEY_SECRET,
            amountPaise: PASS_PLANS.pass_30.amountPaise,
            currency: "INR",
            receipt: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            notes: { user_id: USER, plan_id: "pass_30" },
          },
          async () =>
            new Response(JSON.stringify({ error: { description: "declined for person@example.com" } }), {
              status: 400,
            }),
        ),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        assert.equal((error as Error).message.includes("example.com"), false);
        return true;
      },
    );
  });
});

describe("billing logs and client surface", () => {
  it("logs error codes, not emails or card numbers", () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      logErrorCode("billing/razorpay/order", "person@example.com");
      logErrorCode("billing/razorpay/webhook", "razorpay_webhook_invalid");
    } finally {
      console.error = original;
    }
    assert.equal(lines.some((line) => line.includes("@") || line.includes("4111")), false);
    assert.match(lines[0] ?? "", /unknown_error/);
    assert.match(lines[1] ?? "", /razorpay_webhook_invalid/);
  });

  it("names the Upgrade link used for a limit response", () => {
    assert.equal(PASS_UPGRADE_LABEL, "Upgrade");
    assert.equal(PASS_UPGRADE_HREF, "/pricing");
    const payload = {
      error: "limit_reached",
      limit: 3,
      resetsAt: "2026-11-01T00:00:00.000Z",
      upgradeUrl: "/pricing",
    };
    assert.match(limitNoticeFromPayload(payload) ?? "", /3 free cover letters/);
    assert.equal(upgradeHrefFromPayload(payload), "/pricing");
    assert.equal(upgradeHrefFromPayload({ upgradeUrl: "https://evil.example" }), "/pricing");
    const ui = readFileSync("components/cover-letters/CoverLetterSection.tsx", "utf8");
    assert.match(ui, /PASS_UPGRADE_LABEL/);
    assert.match(ui, /status === 402/);
  });

  it("keeps the secret env name out of TypeScript sources", () => {
    const secretName = ["RAZORPAY", "KEY", "SECRET"].join("_");
    const webhookName = ["RAZORPAY", "WEBHOOK", "SECRET"].join("_");
    const offenders: string[] = [];
    walk(".", (file) => {
      if (!/\.(ts|tsx)$/.test(file)) return;
      if (file.includes(`${path.sep}node_modules${path.sep}`)) return;
      if (file.includes(`${path.sep}.next${path.sep}`)) return;
      const text = readFileSync(file, "utf8");
      if (text.includes(secretName) || text.includes(webhookName)) offenders.push(file);
    });
    assert.deepEqual(offenders, []);
    const example = readFileSync(".env.example", "utf8");
    assert.match(example, new RegExp(secretName));
    assert.match(example, new RegExp(webhookName));
    assert.match(example, /RAZORPAY_KEY_ID/);
    assert.doesNotMatch(example, /NEXT_PUBLIC_RAZORPAY/);
  });

  it("locks payments to owner select and service-role writes", () => {
    const sql = readFileSync("supabase/migrations/20261025120000_payments.sql", "utf8");
    assert.match(sql, /create table if not exists public\.payments/i);
    assert.match(sql, /on delete set null/i);
    assert.match(sql, /status in \('created', 'paid', 'failed'\)/);
    assert.match(sql, /enable row level security/i);
    assert.match(sql, /payments_select_own/);
    assert.match(sql, /grant select on table public\.payments to authenticated/i);
    assert.doesNotMatch(sql, /create policy payments_insert/i);
    assert.doesNotMatch(sql, /create policy payments_update/i);
    assert.match(sql, /subscription_columns_locked/);
  });
});

function nowIso(): string {
  return new Date("2026-01-31T00:00:00.000Z").toISOString();
}

function walk(dir: string, visit: (file: string) => void) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, visit);
    else visit(full);
  }
}
