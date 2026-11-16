import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { metadataBaseUrl, routeShareMetadata } from "../seo";
import sitemap from "../../app/sitemap";
import robots from "../../app/robots";

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
});

describe("routeShareMetadata", () => {
  it("derives canonical, openGraph.url, and twitter images from NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://getworkgraph.com";
    assert.equal(metadataBaseUrl().origin, "https://getworkgraph.com");

    const relative = routeShareMetadata("./");
    assert.equal(relative.alternates?.canonical, "./");
    assert.equal(relative.openGraph?.url, "./");
    assert.deepEqual(relative.twitter?.images, ["/opengraph-image"]);

    const absolute = routeShareMetadata("/waitlist");
    assert.equal(absolute.alternates?.canonical, "https://getworkgraph.com/waitlist");
    assert.equal(absolute.openGraph?.url, "https://getworkgraph.com/waitlist");
  });
});

describe("sitemap and robots", () => {
  it("emits only canonical-host URLs", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const entries = await sitemap();
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      const parsed = new URL(entry.url);
      assert.equal(parsed.origin, "https://getworkgraph.com");
    }
    assert.ok(entries.some((entry) => entry.url.endsWith("/prep-pack")));
    assert.ok(entries.some((entry) => entry.url.endsWith("/interview-vault")));
    assert.ok(!entries.some((entry) => entry.url.includes("/s/prep/")));

    const robotsTxt = robots();
    assert.equal(robotsTxt.host, "getworkgraph.com");
    assert.equal(robotsTxt.sitemap, "https://getworkgraph.com/sitemap.xml");
  });
});
