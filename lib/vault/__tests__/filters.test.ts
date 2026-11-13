import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterAndSortVaultBrowse, type VaultBrowseItem } from "../filters.ts";

function item(partial: Partial<VaultBrowseItem> & Pick<VaultBrowseItem, "id" | "company" | "role">): VaultBrowseItem {
  return {
    level: null,
    interview_round: null,
    skills: [],
    difficulty: "medium",
    rounds: 3,
    result: "offer",
    interview_date: "2026-01-01",
    published_at: "2026-01-02T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    content_confirmed_at: "2026-01-02T00:00:00.000Z",
    avg_rating: 4,
    sales_count: 1,
    ...partial,
  };
}

describe("vault browse filters and sort", () => {
  const now = Date.parse("2026-11-13T00:00:00.000Z");

  const items = [
    item({
      id: "1",
      company: "Acme",
      role: "Frontend Engineer",
      interview_round: "System design",
      skills: ["React", "TypeScript"],
      content_confirmed_at: "2026-11-01T00:00:00.000Z",
      avg_rating: 4.8,
      sales_count: 10,
    }),
    item({
      id: "2",
      company: "Beta Corp",
      role: "Backend Engineer",
      interview_round: "Phone screen",
      skills: ["Python"],
      content_confirmed_at: "2025-01-01T00:00:00.000Z",
      avg_rating: 3,
      sales_count: 2,
    }),
  ];

  it("filters by company, role, and interview round", () => {
    const byCompany = filterAndSortVaultBrowse(items, { company: "acme" }, now);
    assert.deepEqual(
      byCompany.map((i) => i.id),
      ["1"],
    );

    const byRole = filterAndSortVaultBrowse(items, { role: "backend" }, now);
    assert.deepEqual(
      byRole.map((i) => i.id),
      ["2"],
    );

    const byRound = filterAndSortVaultBrowse(items, { interview_round: "system" }, now);
    assert.deepEqual(
      byRound.map((i) => i.id),
      ["1"],
    );
  });

  it("sorts by freshness (most recently confirmed first)", () => {
    const sorted = filterAndSortVaultBrowse(items, { sort: "freshness" }, now);
    assert.deepEqual(
      sorted.map((i) => i.id),
      ["1", "2"],
    );
  });

  it("sorts by relevance with fresher highly-rated guides ahead", () => {
    const sorted = filterAndSortVaultBrowse(items, { sort: "relevance" }, now);
    assert.equal(sorted[0]?.id, "1");
  });

  it("returns an empty list when nothing matches", () => {
    const sorted = filterAndSortVaultBrowse(items, { company: "NoSuchCo" }, now);
    assert.equal(sorted.length, 0);
  });
});
