import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatPaise,
  pass90SavingsPaise,
  passPlanIdForPeriod,
  resolveDisplayCurrency,
  resolvePricingLocale,
} from "../pricing-display";
import { PASS_PLANS } from "../plans";

describe("pricing-display", () => {
  it("maps monthly and annual toggles to catalog Pass ids", () => {
    assert.equal(passPlanIdForPeriod("monthly"), "pass_30");
    assert.equal(passPlanIdForPeriod("annual"), "pass_90");
  });

  it("formats paise with Intl.NumberFormat", () => {
    const label = formatPaise(PASS_PLANS.pass_30.amountPaise, "en-IN", "INR");
    assert.match(label, /₹|INR|Rs/);
    assert.match(label, /299/);
  });

  it("computes 90-day savings against three 30-day Passes", () => {
    const savings = pass90SavingsPaise(
      PASS_PLANS.pass_30.amountPaise,
      PASS_PLANS.pass_90.amountPaise,
    );
    assert.equal(savings, PASS_PLANS.pass_30.amountPaise * 3 - PASS_PLANS.pass_90.amountPaise);
    assert.ok(savings > 0);
  });

  it("resolves locale and display currency from Accept-Language", () => {
    assert.equal(resolvePricingLocale("en-US,en;q=0.9"), "en-US");
    assert.equal(resolveDisplayCurrency("en-US"), "USD");
    assert.equal(resolveDisplayCurrency("hi-IN"), "INR");
    assert.equal(resolveDisplayCurrency("de-DE"), "EUR");
  });
});
