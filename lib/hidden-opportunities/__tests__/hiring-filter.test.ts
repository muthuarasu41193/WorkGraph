import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyHiringPost,
  isEmployerHiringPost,
} from "../hiring-filter";

describe("classifyHiringPost", () => {
  it("accepts r/forhire [Hiring] posts", () => {
    assert.equal(
      classifyHiringPost({
        title: "[Hiring] Senior React Engineer — Remote — $120k–$150k",
        subreddit: "forhire",
        source: "reddit",
      }),
      "employer",
    );
  });

  it("rejects r/forhire [For Hire] posts", () => {
    assert.equal(
      classifyHiringPost({
        title: "[For Hire] Full-stack developer — 6 years experience — open to remote",
        subreddit: "forhire",
        source: "reddit",
      }),
      "candidate",
    );
  });

  it("rejects candidate seeking work on remotejobs", () => {
    assert.equal(
      classifyHiringPost({
        title: "Looking for a remote job in marketing — open to work",
        subreddit: "remotejobs",
        source: "reddit",
      }),
      "candidate",
    );
  });

  it("accepts employer posts on hiring subreddit", () => {
    assert.equal(
      classifyHiringPost({
        title: "We are hiring a backend engineer (Go) — EU remote",
        subreddit: "hiring",
        source: "reddit",
      }),
      "employer",
    );
  });

  it("rejects HN who wants to be hired thread titles", () => {
    assert.equal(
      classifyHiringPost({
        title: "Ask HN: Who wants to be hired?",
        source: "hackernews",
      }),
      "candidate",
    );
  });
});

describe("isEmployerHiringPost", () => {
  it("requires employer signals for generic titles", () => {
    assert.equal(
      isEmployerHiringPost({
        title: "Random career question about interviews",
        subreddit: "cscareerquestions",
        source: "reddit",
      }),
      false,
    );
  });
});
