# Signal Stamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle WorkGraph to Signal Stamp (cool white + deep red + rare gold) via design tokens only.

**Architecture:** `app/tokens.css` is the runtime source of truth; `lib/design-tokens.ts` mirrors hex for JS; Tailwind/`@theme` expose semantic names. Add `highlight*` tokens and swap Live badge classes so gold is visible without layout rewrites.

**Tech Stack:** CSS custom properties, Tailwind v4 `@theme`, existing Next.js app shell.

## Global Constraints

- Approach 1 only: tokens + mirrors + theme exposure + minimal Live class swap.
- No new npm packages.
- No purple/indigo gradients, no brand glow, no layout/route/API changes.
- Hex literals only in `app/tokens.css` and `lib/design-tokens.ts`.
- Keep type, spacing, radius, motion tokens unchanged.
- `npm run check:tokens` must pass.

## File map

| File | Responsibility |
|---|---|
| `app/tokens.css` | Light/dark Signal Stamp values + highlight tokens |
| `lib/design-tokens.ts` | JS mirror of colors |
| `app/globals.css` | `@theme` color registration for highlight |
| `tailwind.config.ts` | Semantic highlight colors for config consumers |
| `app/colors.css` | Optional wg-* aliases for highlight |
| `docs/ART_DIRECTION.md` | Document Signal Stamp as default |
| `components/dashboard/home/HomeHiddenJobsFeed.tsx` | Live badge → highlight |

---

### Task 1: Token values + JS mirror

**Files:** `app/tokens.css`, `lib/design-tokens.ts`

- [ ] Replace Ledger light/dark palette with Signal Stamp values from the spec.
- [ ] Add `--highlight`, `--highlight-ink`, `--highlight-wash` (light + dark).
- [ ] Mirror all values in `WG_COLORS` in `lib/design-tokens.ts`.
- [ ] Commit.

### Task 2: Expose highlight to Tailwind / theme

**Files:** `app/globals.css`, `tailwind.config.ts`, `app/colors.css`

- [ ] Register `--color-highlight`, `--color-highlight-ink`, `--color-highlight-wash` in `@theme inline`.
- [ ] Add matching entries in `tailwind.config.ts` `semanticColors`.
- [ ] Add `--wg-*` aliases in `colors.css` if other aliases follow that pattern.
- [ ] Commit.

### Task 3: Art direction doc + Live badge

**Files:** `docs/ART_DIRECTION.md`, `components/dashboard/home/HomeHiddenJobsFeed.tsx`

- [ ] Set Signal Stamp as default; keep Ledger tables as recorded alternate.
- [ ] Change Live badge from `positive` / `positive-wash` to `highlight` / `highlight-wash`.
- [ ] Run `npm run check:tokens`.
- [ ] Commit.
