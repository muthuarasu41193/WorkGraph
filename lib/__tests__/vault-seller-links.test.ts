import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sellerProfileLinksReady } from "../vault";

describe("sellerProfileLinksReady", () => {
  it("requires both GitHub and LinkedIn links", () => {
    assert.equal(sellerProfileLinksReady({ github_url: null, linkedin_url: null }), false);
    assert.equal(sellerProfileLinksReady({ github_url: "https://github.com/a", linkedin_url: null }), false);
    assert.equal(sellerProfileLinksReady({ github_url: null, linkedin_url: "https://linkedin.com/in/a" }), false);
    assert.equal(
      sellerProfileLinksReady({
        github_url: "https://github.com/a",
        linkedin_url: "https://linkedin.com/in/a",
      }),
      true,
    );
  });

  it("rejects blank whitespace links", () => {
    assert.equal(
      sellerProfileLinksReady({ github_url: "   ", linkedin_url: "https://linkedin.com/in/a" }),
      false,
    );
  });
});
