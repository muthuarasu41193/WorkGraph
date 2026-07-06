/**
 * Migrate margin/padding/gap utilities to the 8pt spacing scale.
 * Allowed px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const DIRS = ["app", "components", "lib"];

const SPACING_PROPS = [
  "p",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "m",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "gap",
  "space-x",
  "space-y",
  "scroll-mt",
  "scroll-mb",
  "scroll-ml",
  "scroll-mr",
  "scroll-mx",
  "scroll-my",
];

/** Tailwind spacing key → nearest allowed key */
const KEY_MAP = {
  "0.5": "1",
  1.5: "2",
  2.5: "3",
  3.5: "4",
  7: "8",
  9: "10",
  11: "12",
  14: "16",
  18: "20",
  28: "32",
};

const ARBITRARY_REPLACEMENTS = [
  [/p-\[3px\]/g, "p-1"],
  [/top-\[68px\]/g, "top-[var(--sticky-below-header)]"],
  [/top-\[132px\]/g, "top-[var(--sticky-aside-top)]"],
  [/lg:top-\[3\.75rem\]/g, "lg:top-16"],
  [/top-\[calc\(100%\+6px\)\]/g, "top-[calc(100%+var(--space-2))]"],
  [/sm:px-7\b/g, "sm:px-8"],
  [/sm:py-7\b/g, "sm:py-8"],
  [/px-7\b/g, "px-8"],
  [/py-7\b/g, "py-8"],
];

function migrateContent(content) {
  let next = content;

  for (const [pattern, replacement] of ARBITRARY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  for (const prop of SPACING_PROPS) {
    for (const [from, to] of Object.entries(KEY_MAP)) {
      const escaped = from.replace(".", "\\.");
      const re = new RegExp(
        `((?:[-\\w]+:)*)(-?)(${prop})-${escaped}(?![\\w.-])`,
        "g",
      );
      next = next.replace(re, `$1$2${prop}-${to}`);
    }
  }

  return next;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const original = fs.readFileSync(file, "utf8");
    const updated = migrateContent(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      changed++;
      console.log(path.relative(ROOT, file));
    }
  }
}

console.log(`\nUpdated ${changed} file(s).`);
