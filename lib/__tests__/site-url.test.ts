import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_SITE_URL,
  getSiteHost,
  getSiteUrl,
  resolveCanonicalHostRedirect,
  siteUrl,
} from "../site-url";

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
});

describe("getSiteUrl", () => {
  it("defaults to getworkgraph.com", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(getSiteUrl(), DEFAULT_SITE_URL);
    assert.equal(getSiteHost(), "getworkgraph.com");
  });

  it("reads NEXT_PUBLIC_SITE_URL and strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://getworkgraph.com/";
    assert.equal(getSiteUrl(), "https://getworkgraph.com");
    assert.equal(siteUrl("/waitlist"), "https://getworkgraph.com/waitlist");
  });

  it("adds https when the env value has no protocol", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "getworkgraph.com";
    assert.equal(getSiteUrl(), "https://getworkgraph.com");
  });
});

describe("resolveCanonicalHostRedirect", () => {
  it("does not redirect the canonical host", () => {
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "getworkgraph.com",
        pathname: "/waitlist",
        search: "?ref=1",
      }),
      null,
    );
  });

  it("does not redirect localhost", () => {
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "localhost:3000",
        pathname: "/",
      }),
      null,
    );
  });

  it("does not redirect Vercel preview deployments", () => {
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "work-graph-git-feat-user.vercel.app",
        pathname: "/login",
        vercelEnv: "preview",
      }),
      null,
    );
  });

  it("redirects alternate hosts with path and query preserved", () => {
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "workgraph.ai",
        pathname: "/waitlist",
        search: "?utm=1",
        vercelEnv: "production",
      }),
      "https://getworkgraph.com/waitlist?utm=1",
    );
  });

  it("redirects production Vercel aliases and www to the canonical host", () => {
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "work-graph-fawn.vercel.app",
        pathname: "/login",
        search: "?next=/profile",
        vercelEnv: "production",
      }),
      "https://getworkgraph.com/login?next=/profile",
    );
    assert.equal(
      resolveCanonicalHostRedirect({
        hostHeader: "www.getworkgraph.com",
        pathname: "/discovery",
        vercelEnv: "production",
      }),
      "https://getworkgraph.com/discovery",
    );
  });
});
