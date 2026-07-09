#!/usr/bin/env node
/**
 * Points this repo at .githooks/ so pre-push runs verify checks automatically.
 * Invoked by npm prepare after install.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(join(root, ".git"))) {
  process.exit(0);
}

if (!existsSync(join(root, ".githooks", "pre-push"))) {
  console.warn("setup-githooks: .githooks/pre-push not found");
  process.exit(0);
}

try {
  const current = execSync("git config --get core.hooksPath", {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (current === ".githooks") {
    process.exit(0);
  }
} catch {
  /* hooksPath not set yet */
}

try {
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "inherit" });
  console.log("setup-githooks: enabled .githooks/pre-push verification");
} catch (error) {
  console.warn("setup-githooks: could not set core.hooksPath:", error.message);
}
