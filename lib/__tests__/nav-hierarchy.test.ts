import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FOOTER_LINKS, NAV_ITEMS } from "../constants.ts";
import { DASHBOARD_NAV_GROUPS } from "../dashboard-nav-groups.ts";
import { SHELL_DESTINATIONS } from "../shell-nav.ts";

describe("Milestone C navigation hierarchy", () => {
  it("puts prep pack and Interview Vault ahead of jobs in public nav", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    assert.equal(labels[0], "Prep pack");
    assert.equal(labels[1], "Interview Vault");
    assert.ok(labels.indexOf("Jobs") > labels.indexOf("Interview Vault"));
    assert.equal(NAV_ITEMS[0]?.href, "/prep-pack");
    assert.equal(NAV_ITEMS[1]?.href, "/interview-vault");
  });

  it("puts prep and vault first in the app shell tabs", () => {
    const tabs = SHELL_DESTINATIONS.filter((dest) => dest.tab);
    assert.equal(tabs[0]?.href, "/prep-pack");
    assert.equal(tabs[1]?.href, "/interview-vault");
    assert.equal(tabs[2]?.href, "/jobs");
    assert.ok(tabs.length <= 5);
  });

  it("keeps job discovery available but secondary in the dashboard sidebar", () => {
    const primary = DASHBOARD_NAV_GROUPS.find((group) => group.id === "primary");
    const jobs = DASHBOARD_NAV_GROUPS.find((group) => group.id === "jobs");
    assert.ok(primary);
    assert.ok(jobs);
    assert.deepEqual(
      primary!.items.map((item) => item.id),
      ["home", "prep-pack", "interview-vault"],
    );
    assert.ok(jobs!.items.some((item) => item.id === "jobs"));
    assert.ok(jobs!.items.some((item) => item.id === "job-discovery"));
  });

  it("lists prep pack before job discovery in the footer", () => {
    const product = FOOTER_LINKS.product.map((item) => item.label);
    assert.equal(product[0], "Prep pack");
    assert.ok(product.includes("Jobs"));
    assert.ok(product.indexOf("Jobs") > product.indexOf("Interview Vault"));
  });
});
