import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { SUBPROCESSORS } from "../legal";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("honest pricing and privacy copy", () => {
  it("does not mention Stripe or interview-question limits on pricing", () => {
    const pricing = [
      read("app/(marketing)/pricing/page.tsx"),
      read("components/marketing/PricingTiers.tsx"),
      read("components/marketing/PassCheckout.tsx"),
      read("lib/billing/plans.ts"),
    ].join("\n");
    assert.doesNotMatch(pricing, /stripe/i);
    assert.doesNotMatch(pricing, /interview questions/i);
    assert.match(pricing, /WorkGraph Pass/);
    assert.match(pricing, /One-time payment\. Does not auto-renew\./);
    assert.match(pricing, /No public price/);
    assert.match(pricing, /incl\. of applicable taxes/);
    assert.match(pricing, /\+ GST/);
    assert.match(pricing, /Razorpay/);
    assert.match(pricing, /never resume data/);
    assert.match(pricing, /cover letters per month/);
  });

  it("does not mention Stripe on the privacy page or in the subprocessor list it renders", () => {
    const privacy = read("app/legal/privacy/page.tsx");
    assert.doesNotMatch(privacy, /stripe/i);
    assert.doesNotMatch(privacy, /interview questions/i);
    assert.match(privacy, /SUBPROCESSORS/);
    assert.match(privacy, /never resume data/);

    const rendered = SUBPROCESSORS.map((row) =>
      ["purpose" in row ? row.purpose : row.function, row.name, row.region].join(" "),
    ).join("\n");
    assert.doesNotMatch(rendered, /stripe/i);
    assert.match(rendered, /Razorpay/);
    assert.match(rendered, /Receives payment details only, never resume data/);
  });

  it("uses provider-neutral payment language in the terms", () => {
    const terms = read("app/legal/terms/page.tsx");
    assert.doesNotMatch(terms, /stripe/i);
    assert.match(terms, /licensed payment provider named at checkout/);
    assert.match(terms, /Razorpay/);
    assert.match(terms, /do not send resume/);
    assert.match(terms, /TODO\(founder\): Write the refund policy/);
  });
});