import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getProfileFirstName, getTimeGreeting } from "../home-dashboard";

describe("getProfileFirstName", () => {
  it("sentence-cases an all-caps first name", () => {
    assert.equal(getProfileFirstName({ full_name: "MUTHU ARASU", email: null }), "Muthu");
  });

  it("falls back to sentence-cased email local part", () => {
    assert.equal(getProfileFirstName({ full_name: null, email: "MUTHU@example.com" }), "Muthu");
  });
});

describe("getTimeGreeting", () => {
  it("returns morning before noon", () => {
    assert.equal(getTimeGreeting(new Date("2026-01-01T08:00:00")), "Good morning");
  });
});
