import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRedditAtomFeed } from "../providers/reddit-rss";

const SAMPLE = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry>
  <author><name>/u/testuser</name></author>
  <id>t3_abc123</id>
  <link href="https://www.reddit.com/r/forhire/comments/abc123/hiring_engineer/" />
  <published>2026-06-01T12:00:00+00:00</published>
  <title>[Hiring] Backend Engineer Remote</title>
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
