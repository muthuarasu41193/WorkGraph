import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONSENT_POLICY_VERSION,
  acceptAllCategories,
  createConsentRecord,
  needsReprompt,
  parseConsentRecord,
  readConsent,
  rejectAllCategories,
  serializeConsentRecord,
  shouldLoadCategory,
  writeConsent,
  type ConsentIO,
} from "../consent";
import { buildConsentLogInsert, ipCountryFromHeaders, parseConsentLogBody } from "../consent-log";

function memoryIo(initial?: string): ConsentIO & { local: string | null; cookie: string | null } {
  const store = { local: initial ?? null, cookie: initial ?? null };
  return {
    get local() {
      return store.local;
    },
    get cookie() {
      return store.cookie;
    },
    getLocal: () => store.local,
    setLocal: (value: string) => {
      store.local = value;
    },
    getCookie: () => store.cookie,
    setCookie: (value: string) => {
      store.cookie = value;
    },
  };
}

describe("consent categories", () => {
  it("keeps strictly necessary on for accept-all and reject-all", () => {
    const accepted = acceptAllCategories();
    const rejected = rejectAllCategories();
    assert.equal(accepted.strictlyNecessary, true);
    assert.equal(rejected.strictlyNecessary, true);
    assert.equal(accepted.analytics, true);
    assert.equal(accepted.marketing, true);
    assert.equal(rejected.analytics, false);
    assert.equal(rejected.marketing, false);
  });

  it("never loads analytics or marketing until a current consent record is stored", () => {
    assert.equal(shouldLoadCategory(null, "strictlyNecessary"), true);
    assert.equal(shouldLoadCategory(null, "analytics"), false);
    assert.equal(shouldLoadCategory(null, "marketing"), false);
  });

  it("loads optional scripts only for granted categories on the current version", () => {
    const record = createConsentRecord(rejectAllCategories(), "anon-1");
    assert.equal(shouldLoadCategory(record, "analytics"), false);
    const accepted = createConsentRecord(acceptAllCategories(), "anon-1");
    assert.equal(shouldLoadCategory(accepted, "analytics"), true);
    assert.equal(shouldLoadCategory(accepted, "marketing"), true);
  });

  it("re-prompts and blocks optional scripts when the policy version increments", () => {
    const stale = createConsentRecord(acceptAllCategories(), "anon-1");
    stale.version = "0";
    assert.equal(needsReprompt(stale), true);
    assert.equal(shouldLoadCategory(stale, "analytics"), false);
    assert.equal(needsReprompt(createConsentRecord(acceptAllCategories(), "anon-1")), false);
    assert.equal(CONSENT_POLICY_VERSION.length > 0, true);
  });
});

describe("consent persistence", () => {
  it("round-trips version, timestamp, anonymous id, and exact categories", () => {
    const record = createConsentRecord({ strictlyNecessary: true, analytics: true, marketing: false }, "anon-42");
    const parsed = parseConsentRecord(serializeConsentRecord(record));
    assert.ok(parsed);
    assert.equal(parsed.version, CONSENT_POLICY_VERSION);
    assert.equal(parsed.anonymousId, "anon-42");
    assert.equal(parsed.categories.analytics, true);
    assert.equal(parsed.categories.marketing, false);
    assert.equal(parsed.categories.strictlyNecessary, true);
    assert.ok(Date.parse(parsed.timestamp) > 0);
  });

  it("writes cookie and localStorage through try/catch IO and treats legacy keys as stale", () => {
    const io = memoryIo();
    const record = createConsentRecord(acceptAllCategories(), "anon-9");
    writeConsent(record, io);
    assert.ok(io.local);
    assert.ok(io.cookie);
    assert.deepEqual(readConsent(io)?.categories, record.categories);

    assert.equal(parseConsentRecord("accepted"), null);
    assert.equal(parseConsentRecord("declined"), null);
  });

  it("survives storage IO throwing", () => {
    const throwing: ConsentIO = {
      getLocal: () => {
        throw new Error("blocked");
      },
      setLocal: () => {
        throw new Error("blocked");
      },
      getCookie: () => {
        throw new Error("blocked");
      },
      setCookie: () => {
        throw new Error("blocked");
      },
    };
    assert.equal(readConsent(throwing), null);
    assert.doesNotThrow(() => writeConsent(createConsentRecord(rejectAllCategories(), "anon-x"), throwing));
  });
});

describe("consent audit log", () => {
  it("parses a client payload and ignores any IP the client tries to send", () => {
    const parsed = parseConsentLogBody({
      anonymousId: "11111111-1111-4111-8111-111111111111",
      policyVersion: "1",
      timestamp: "2026-09-17T00:00:00.000Z",
      categories: { strictlyNecessary: true, analytics: false, marketing: false },
      ip: "203.0.113.10",
      ipAddress: "203.0.113.10",
    });
    assert.ok(!("error" in parsed));
    if (!("error" in parsed)) {
      assert.equal("ip" in parsed, false);
      assert.equal("ipAddress" in parsed, false);
      assert.equal(parsed.anonymousId, "11111111-1111-4111-8111-111111111111");
    }
  });

  it("stores ISO country only and never a forwarded IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      "x-real-ip": "198.51.100.2",
      "x-vercel-ip-country": "IN",
    });
    assert.equal(ipCountryFromHeaders(headers), "IN");

    const ipOnly = new Headers({ "x-forwarded-for": "203.0.113.10" });
    assert.equal(ipCountryFromHeaders(ipOnly), null);

    const row = buildConsentLogInsert({
      userId: null,
      anonymousId: "anon-1",
      categories: rejectAllCategories(),
      policyVersion: "1",
      ipCountry: ipCountryFromHeaders(headers),
    });
    assert.equal(row.ip_country, "IN");
    assert.equal("ip" in row, false);
    assert.equal("ip_address" in row, false);
    assert.equal(JSON.stringify(row).includes("203.0.113"), false);
  });
});
