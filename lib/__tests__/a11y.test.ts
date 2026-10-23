import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import axe from "axe-core"
import { JSDOM } from "jsdom"
import { ProductJobCard } from "../../components/product/JobCard"
import { SkipLink } from "../../components/a11y/SkipLink"
import { feedFocusAnnouncement, nextListIndex } from "../a11y"

const require = createRequire(import.meta.url)

function linear(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const red = (n >> 16) & 255
  const green = (n >> 8) & 255
  const blue = n & 255
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function themeColors(css: string, marker: string): Record<string, string> {
  const at = css.indexOf(marker)
  assert.ok(at >= 0, marker)
  const body = css.slice(at, css.indexOf("}", at))
  const colors: Record<string, string> = {}
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    colors[match[1]] = match[2]
  }
  return colors
}

async function violations(html: string) {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><head><title>WorkGraph</title></head><body>${html}</body></html>`)
  const results = await axe.run(dom.window.document.documentElement, {
    resultTypes: ["violations"],
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  })
  return results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")
}

test("text and control colors meet WCAG 2.2 AA in both themes", () => {
  const css = readFileSync(new URL("../../app/tokens.css", import.meta.url), "utf8")
  const themes = [
    themeColors(css, '[data-theme="light"]'),
    themeColors(css, ':root[data-theme="dark"]'),
  ]
  for (const theme of themes) {
    for (const name of ["ink", "ink-muted", "ink-subtle", "accent", "positive", "caution", "danger"]) {
      assert.ok(contrast(theme[name], theme.surface) >= 4.5, `${name} on surface`)
      assert.ok(contrast(theme[name], theme["surface-raised"]) >= 4.5, `${name} on raised`)
    }
    assert.ok(contrast(theme["accent-ink"], theme.accent) >= 4.5)
    for (const name of ["surface", "surface-raised", "surface-sunken"]) {
      assert.ok(contrast(theme.hairline, theme[name]) >= 3, `hairline on ${name}`)
    }
  }
})

test("list keyboard helpers stay inside the list", () => {
  assert.equal(nextListIndex(0, -1, 3), 0)
  assert.equal(nextListIndex(2, 1, 3), 2)
  assert.equal(nextListIndex(0, 1, 0), 0)
  assert.equal(feedFocusAnnouncement("Engineer", "Acme", 0, 2), "Engineer at Acme. 1 of 2.")
  assert.equal(feedFocusAnnouncement("", "Acme", 0, 2), "")
})

test("lighthouse budget matches the credibility prompt", () => {
  const config = require("../../lighthouserc.cjs") as {
    ci: { assert: { assertions: Record<string, [string, { maxNumericValue: number }]> } }
  }
  const assertions = config.ci.assert.assertions
  assert.equal(assertions["largest-contentful-paint"][1].maxNumericValue, 2000)
  assert.equal(assertions["cumulative-layout-shift"][1].maxNumericValue, 0.05)
  assert.equal(assertions["interaction-to-next-paint"][1].maxNumericValue, 200)
})

test("axe fails a button with no name", async () => {
  const found = await violations("<main><h1>Jobs</h1><button></button></main>")
  assert.ok(found.some((item) => item.id === "button-name"))
})

test("axe accepts the skip link and a job card", async () => {
  const html = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(SkipLink),
      createElement("header", null, createElement("p", null, "WorkGraph")),
      createElement("nav", { "aria-label": "Primary" }, createElement("a", { href: "/jobs" }, "Jobs")),
      createElement(
        "main",
        { id: "main-content", tabIndex: -1 },
        createElement("h1", null, "Jobs"),
        createElement(ProductJobCard, {
          title: "Engineer",
          company: "Acme",
          location: "Remote",
          remoteType: "Remote",
          salary: { kind: "undisclosed" },
          match: { score: 0, reason: "No profile to compare", unscored: true },
          freshness: { status: "unknown", label: "Posted date is not stored" },
          source: { source: "Example board" },
          applyLabel: "Apply on the listing",
        }),
      ),
    ),
  )
  const found = await violations(html)
  assert.deepEqual(
    found.map((item) => item.id),
    [],
  )
})
