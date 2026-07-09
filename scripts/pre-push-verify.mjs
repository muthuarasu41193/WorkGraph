#!/usr/bin/env node
/**
 * Runs the same checks Vercel needs before a push reaches main.
 * Wired via .githooks/pre-push (see scripts/setup-githooks.mjs).
 *
 * Skip in emergencies: SKIP_PREPUSH=1 git push
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.SKIP_PREPUSH === "1") {
  console.warn("pre-push-verify: SKIP_PREPUSH=1 — skipping checks");
  process.exit(0);
}

function run(label, script) {
  console.log(`\npre-push-verify: ${label}…`);
  const result = spawnSync("npm", ["run", script], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\npre-push-verify: failed at "${script}". Push blocked.`);
    console.error("Fix the errors above, or use SKIP_PREPUSH=1 git push to override.");
    process.exit(result.status ?? 1);
  }
}

console.log("pre-push-verify: running Vercel-safe checks before push…");
run("TypeScript", "typecheck");
run("Vercel config", "verify:vercel-config");
run("Production build", "build");
console.log("\npre-push-verify: all checks passed — safe to push.");
