import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRedditAtomFeed, redditRssToOpportunities } from "../providers/reddit-rss";

const SAMPLE = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry>
  <author><name>/u/testuser</name></author>
  <id>t3_abc123</id>
  <link href="https://www.reddit.com/r/forhire/comments/abc123/hiring_engineer/" />
  <published>2026-06-01T12:00:00+00:00</published>
  <title>[Hiring] Backend Engineer Remote</title>
</entry>
</feed>`;

const FOR_HIRE_SAMPLE = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry>
  <author><name>/u/jobseeker</name></author>
  <id>t3_def456</id>
  <link href="https://www.reddit.com/r/forhire/comments/def456/available/" />
  <published>2026-06-01T12:00:00+00:00</published>
  <title>[For Hire] React developer — remote — 5 years experience</title>
</entry>
</feed>`;

describe("parseRedditAtomFeed", () => {
  it("parses atom entries into raw opportunities", () => {
    const rows = parseRedditAtomFeed(SAMPLE, "forhire");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.title, "[Hiring] Backend Engineer Remote");
    assert.equal(rows[0]?.author, "/u/testuser");
    assert.equal(rows[0]?.id, "reddit:forhire:abc123");
    assert.ok(rows[0]?.url.includes("reddit.com"));
  });
});

describe("redditRssToOpportunities", () => {
  it("drops [For Hire] candidate posts", () => {
    const raw = parseRedditAtomFeed(FOR_HIRE_SAMPLE, "forhire");
    const kept = redditRssToOpportunities(raw);
    assert.equal(kept.length, 0);
  });

  it("keeps [Hiring] employer posts", () => {
    const raw = parseRedditAtomFeed(SAMPLE, "forhire");
    const kept = redditRssToOpportunities(raw);
    assert.equal(kept.length, 1);
    assert.equal(kept[0]?.title, "[Hiring] Backend Engineer Remote");
  });
});
