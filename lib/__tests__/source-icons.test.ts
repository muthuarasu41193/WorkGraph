import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSourceFromUrl, resolveJobSourceIconKey } from "../source-icons";

describe("getSourceFromUrl", () => {
  it("maps known job-board hostnames", () => {
    assert.equal(getSourceFromUrl("https://www.linkedin.com/jobs/view/1"), "linkedin");
    assert.equal(getSourceFromUrl("https://www.reddit.com/r/forhire/comments/abc"), "reddit");
    assert.equal(getSourceFromUrl("https://in.indeed.com/viewjob?jk=1"), "indeed");
    assert.equal(getSourceFromUrl("https://www.naukri.com/job-listings-1"), "naukri");
    assert.equal(getSourceFromUrl("https://www.glassdoor.co.in/Job/1.htm"), "glassdoor");
    assert.equal(getSourceFromUrl("https://x.com/jobs"), "x");
    assert.equal(getSourceFromUrl("https://github.com/orgs/acme/jobs"), "github");
    assert.equal(getSourceFromUrl("https://careers.google.com/jobs/1"), "google");
  });

  it("returns other for unknown hosts", () => {
    assert.equal(getSourceFromUrl("https://boards.greenhouse.io/acme/jobs/1"), "other");
    assert.equal(getSourceFromUrl(null), "other");
  });
});

describe("resolveJobSourceIconKey", () => {
  it("prefers a known schema source over the URL", () => {
    assert.equal(
      resolveJobSourceIconKey("reddit", "https://www.linkedin.com/jobs/view/1"),
      "reddit",
    );
  });

  it("falls back to the URL when schema source is generic", () => {
    assert.equal(
      resolveJobSourceIconKey("other", "https://www.naukri.com/job-listings-1"),
      "naukri",
    );
    assert.equal(
      resolveJobSourceIconKey("workgraph", "https://www.indeed.com/viewjob?jk=1"),
      "indeed",
    );
  });

  it("uses company when workgraph has no recognizable board URL", () => {
    assert.equal(
      resolveJobSourceIconKey("workgraph", "https://careers.acme.com/jobs/1"),
      "company",
    );
  });
});
