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
    ].join("\n");
    assert.doesNotMatch(pricing, /stripe/i);
    assert.doesNotMatch(pricing, /interview questions/i);
    assert.match(pricing, /No public price/);
    assert.match(pricing, /licensed payment provider named at checkout/);
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
    assert.match(rendered, /Payment provider \(to be named at checkout\)/);
    assert.match(
      rendered,
      /Payment processing for paid plans and Interview Vault purchases\. Receives payment details only, never resume data\./,
    );
  });

  it("uses provider-neutral payment language in the terms", () => {
    const terms = read("app/legal/terms/page.tsx");
    assert.doesNotMatch(terms, /stripe/i);
    assert.match(terms, /licensed payment provider named at checkout/);
  });
});