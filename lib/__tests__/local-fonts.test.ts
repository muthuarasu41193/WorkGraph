import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");

const FONT_FILES = [
  "public-sans-latin.woff2",
  "newsreader-latin.woff2",
  "jetbrains-mono-latin.woff2",
] as const;

describe("self-hosted layout fonts", () => {
  it("does not download fonts from Google during the build", () => {
    assert.equal(/from ["']next\/font\/google["']/.test(layout), false);
    assert.match(layout, /from "next\/font\/local"/);
  });

  it("keeps the typography CSS variables", () => {
    assert.match(layout, /variable:\s*"--font-public"/);
    assert.match(layout, /variable:\s*"--font-display-face"/);
    assert.match(layout, /variable:\s*"--font-jetbrains"/);
  });

  it("ships real woff2 files for the latin subsets", () => {
    for (const name of FONT_FILES) {
      const bytes = readFileSync(new URL(`../../app/fonts/${name}`, import.meta.url));
      assert.equal(bytes.subarray(0, 4).toString("latin1"), "wOF2", name);
      assert.ok(bytes.length > 1000, name);
    }
  });
});
