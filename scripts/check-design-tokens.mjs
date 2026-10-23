/**
 * Fails when UI source hardcodes a color, a raw Tailwind palette class,
 * an arbitrary color utility, or a duration outside the token files.
 *
 * Token definition:
 * - app/tokens.css is the runtime source of truth
 * - lib/design-tokens.ts mirrors those values for email, charts, and OG images
 *
 * styles.css and script.js are unimported legacy and are not part of the Next build.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allow = new Set(["app/tokens.css", "lib/design-tokens.ts"]);
const skipDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  "services",
  "job_aggregator",
  "amazon-label-cropper",
  "coverage",
]);
const skipFiles = new Set(["styles.css", "script.js", "google-apps-script-waitlist.js"]);

const palette =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black";
const colorUtil = "bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|caret|decoration|accent";

const rules = [
  {
    name: "hex",
    re: /#[0-9a-fA-F]{3,8}\b/g,
  },
  {
    name: "rgb/hsl",
    re: /(?:rgba?|hsla?|oklch|oklab)\(/g,
  },
  {
    name: "arbitrary color",
    re: new RegExp(String.raw`(?:${colorUtil})-\[(?:#|rgba?\(|hsla?\(|oklch\()`, "g"),
  },
  {
    name: "raw palette",
    re: new RegExp(
      String.raw`(?<![\w-])(?:[\w-]+:)*(?:${colorUtil})-(?:${palette})(?:-\d{2,3})?(?:\/\d{1,3})?(?![\w-])`,
      "g",
    ),
  },
  {
    name: "numeric duration",
    re: /\bduration-\d+\b/g,
  },
  {
    name: "time literal",
    re: /(?<![\w-])(?!0ms\b)(?!0s\b)\d*\.?\d+ms\b|(?<![\w-])\d*\.\d+s\b/g,
  },
  {
    name: "magic z-index",
    re: /\bz-\[?\d+\]?/g,
  },
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|css|mjs|js)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const failures = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (allow.has(rel) || skipFiles.has(rel)) continue;
  if (rel.startsWith("scripts/")) continue;
  if (rel.includes("/__tests__/") || rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) continue;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("check-design-tokens")) return;
    for (const rule of rules) {
      rule.re.lastIndex = 0;
      if (rule.re.test(line)) {
        failures.push(`${rel}:${index + 1}  ${rule.name}  ${line.trim().slice(0, 180)}`);
      }
    }
  });
}

const tokens = fs.readFileSync(path.join(root, "app/tokens.css"), "utf8").toLowerCase();
const mirror = fs.readFileSync(path.join(root, "lib/design-tokens.ts"), "utf8").toLowerCase();
const mirrorHex = mirror.match(/#[0-9a-f]{3,8}\b/g) ?? [];
for (const hex of new Set(mirrorHex)) {
  if (!tokens.includes(hex)) {
    failures.push(`lib/design-tokens.ts  hex ${hex} is missing from app/tokens.css`);
  }
}

if (failures.length) {
  console.error(`Design token check failed (${failures.length})\n`);
  console.error(failures.slice(0, 200).join("\n"));
  if (failures.length > 200) console.error(`\n… ${failures.length - 200} more`);
  process.exit(1);
}

console.log("Design token check passed.");
