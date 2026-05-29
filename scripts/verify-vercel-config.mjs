#!/usr/bin/env node
/**
 * Guardrails for vercel.json — catches Hobby-plan cron mistakes before deploy.
 * Vercel Hobby allows at most one cron invocation per day.
 * @see https://vercel.com/docs/cron-jobs/usage-and-pricing
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercelPath = join(root, "vercel.json");

let config;
try {
  config = JSON.parse(readFileSync(vercelPath, "utf8"));
} catch (error) {
  console.error("verify-vercel-config: could not read vercel.json:", error.message);
  process.exit(1);
}

const crons = config.crons ?? [];

/** Minute and hour must be fixed numbers — no *, /, ranges, or lists. */
function isHobbyDailySchedule(schedule) {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour] = parts;
  return /^\d+$/.test(minute) && /^\d+$/.test(hour);
}

let failed = false;

for (const cron of crons) {
  const { path, schedule } = cron;
  if (!path || !schedule) {
    console.error("verify-vercel-config: each cron needs path and schedule");
    failed = true;
    continue;
  }
  if (!isHobbyDailySchedule(schedule)) {
    console.error(
      `verify-vercel-config: "${schedule}" for ${path} runs more than once per day.`,
    );
    console.error(
      "  Use a fixed daily time, e.g. \"0 6 * * *\" (Hobby plan limit).",
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`verify-vercel-config: OK (${crons.length} cron job(s) checked)`);
