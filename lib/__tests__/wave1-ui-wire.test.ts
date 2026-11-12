import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

test("Wave 1 packages are declared in package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
    dependencies: Record<string, string>
  }
  for (const name of [
    "sonner",
    "cmdk",
    "vaul",
    "@tanstack/react-virtual",
    "@tanstack/react-table",
    "nuqs",
  ]) {
    assert.ok(pkg.dependencies[name], `missing dependency ${name}`)
  }
  assert.match(pkg.dependencies["@tanstack/react-table"], /^[\^~]?8\./)
})

test("toast API no longer depends on a Zustand store", () => {
  const source = readFileSync(new URL("../../hooks/use-toast.ts", import.meta.url), "utf8")
  assert.match(source, /from ["']sonner["']/)
  assert.doesNotMatch(source, /zustand/)
  assert.match(source, /export function toast/)
})

test("drawer uses Vaul", () => {
  const source = readFileSync(new URL("../../components/ui/drawer.tsx", import.meta.url), "utf8")
  assert.match(source, /from ["']vaul["']/)
  assert.doesNotMatch(source, /Dialog as DialogPrimitive/)
})

test("command palettes use cmdk", () => {
  const dash = readFileSync(
    new URL("../../components/design-system/CommandPalette.tsx", import.meta.url),
    "utf8",
  )
  const shell = readFileSync(
    new URL("../../components/shell/ShellCommandPalette.tsx", import.meta.url),
    "utf8",
  )
  assert.match(dash, /from ["']cmdk["']/)
  assert.match(shell, /from ["']cmdk["']/)
})

test("root layout mounts NuqsProvider", () => {
  const source = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8")
  assert.match(source, /NuqsProvider/)
})
