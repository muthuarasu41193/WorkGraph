import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { communitySourceSecondary } from "../community-source-secondary";

describe("communitySourceSecondary", () => {
  it("prefers category as r/subreddit for Reddit posts", () => {
    assert.equal(
      communitySourceSecondary({
        source: "reddit",
        category: "forhire",
        company: "r/forhire",
        author: "hiring_mgr",
      }),
      "r/forhire",
    );
  });

  it("normalizes company that already includes r/", () => {
    assert.equal(
      communitySourceSecondary({
        source: "reddit",
        company: "r/cscareerquestions",
      }),
      "r/cscareerquestions",
    );
  });

  it("falls back to author for Reddit when no subreddit is present", () => {
    assert.equal(
      communitySourceSecondary({
        source: "reddit",
        author: "op_user",
      }),
      "op_user",
    );
  });

  it("uses author then company for LinkedIn and other sources", () => {
    assert.equal(
      communitySourceSecondary({
        source: "linkedin",
        author: "Jane Doe",
        company: "Acme",
      }),
      "Jane Doe",
    );
    assert.equal(
      communitySourceSecondary({
        source: "linkedin",
        company: "Acme Recruiting",
      }),
      "Acme Recruiting",
    );
  });
});
