import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCatalogUpdated } from "../catalog-updated";
import { toSentenceCase } from "../sentence-case";

describe("toSentenceCase", () => {
  it("renders an all-caps account name in sentence case", () => {
    assert.equal(toSentenceCase("MUTHU ARASU"), "Muthu arasu");
  });

  it("keeps a missing name empty", () => {
    assert.equal(toSentenceCase("   "), "");
  });
});

describe("formatCatalogUpdated", () => {
  const now = Date.parse("2026-10-23T12:00:00.000Z");

  it("uses the real timestamp in minutes", () => {
    assert.equal(
      formatCatalogUpdated("2026-10-23T11:48:00.000Z", now),
      "Updated 12 min ago",
    );
  });

  it("omits the line when no timestamp exists", () => {
    assert.equal(formatCatalogUpdated(null, now), null);
    assert.equal(formatCatalogUpdated("not-a-date", now), null);
  });
});
