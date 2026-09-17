import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FOOTER_LINKS } from "../constants";
import { DATA_CATEGORIES, LEGAL_NAV, SUBPROCESSORS, tocFromSections } from "../legal";

describe("legal TOC", () => {
  it("builds anchor links from h2 section titles", () => {
    const toc = tocFromSections([
      { id: "data-we-collect", title: "Categories of personal data" },
      { id: "lawful-basis", title: "Purpose and lawful basis" },
    ]);
    assert.deepEqual(toc, [
      { href: "#data-we-collect", title: "Categories of personal data" },
      { href: "#lawful-basis", title: "Purpose and lawful basis" },
    ]);
  });
});

describe("privacy draft data", () => {
  it("lists account, resume, application, and device categories with purpose, basis, and retention", () => {
    const categories = DATA_CATEGORIES.map((row) => row.category.toLowerCase());
    assert.ok(categories.some((c) => c.includes("account")));
    assert.ok(categories.some((c) => c.includes("resume")));
    assert.ok(categories.some((c) => c.includes("application")));
    assert.ok(categories.some((c) => c.includes("device") || c.includes("analytics")));
    for (const row of DATA_CATEGORIES) {
      assert.ok(row.purpose.length > 0);
      assert.ok(row.lawfulBasis.length > 0);
      assert.ok(row.retention.length > 0);
    }
  });

  it("names hosting, payments, email, and jobs-API subprocessors with region", () => {
    const names = SUBPROCESSORS.map((row) => row.name);
    for (const required of ["Supabase", "Vercel", "Stripe", "Resend", "Adzuna"]) {
      assert.ok(
        names.some((name) => name.includes(required)),
        `expected a named subprocessor for ${required}, got ${names.join(", ")}`,
      );
    }
    for (const row of SUBPROCESSORS) {
      assert.ok(row.function.length > 0);
      assert.ok(row.region.length > 0);
    }
  });
});

describe("footer legal routes", () => {
  it("has no empty hash hrefs", () => {
    const hrefs = [
      ...FOOTER_LINKS.product,
      ...FOOTER_LINKS.resources,
      ...FOOTER_LINKS.company,
      ...LEGAL_NAV,
    ].map((link) => link.href);
    assert.ok(hrefs.every((href) => href !== "#" && href.length > 0));
  });

  it("includes the five legal document routes", () => {
    const hrefs = LEGAL_NAV.map((link) => link.href);
    assert.deepEqual(hrefs, [
      "/legal/privacy",
      "/legal/terms",
      "/legal/cookies",
      "/legal/acceptable-use",
      "/legal/dpa",
    ]);
    const companyHrefs = FOOTER_LINKS.company.map((link) => link.href);
    for (const href of hrefs) {
      assert.ok(companyHrefs.includes(href), `footer company column missing ${href}`);
    }
  });
});
