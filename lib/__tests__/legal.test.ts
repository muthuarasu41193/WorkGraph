import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FOOTER_LINKS } from "../constants";
import { LEGAL_NAV, tocFromSections } from "../legal";

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

describe("footer legal routes", () => {
  it("has no empty hash hrefs", () => {
    const hrefs = [
      ...FOOTER_LINKS.product,
      ...FOOTER_LINKS.resources,
      ...FOOTER_LINKS.company,
    ].map((link) => link.href);
    assert.ok(hrefs.every((href) => href !== "#"));
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
  });
});
