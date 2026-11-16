# Signal Stamp — visual redesign (token restyle)

**Date:** 5 November 2026  
**Status:** Approved for implementation (Approach 1)  
**Scope:** Token-layer art direction change. No layout, route, or feature rewrites.

## Problem

The live product uses **Ledger**: warm cream paper (`#F4F1EA`) and oxide red (`#8E2E2E`). The owner wants a cooler, more colorful, highly professional look — deep red leading, gold/yellow as a rare secondary accent — without a major codebase rewrite and without an “AI-generated” SaaS look (no purple gradients, no identical soft cards, no glow).

## Decision

**Signal Stamp** becomes the default art direction. Implementation is Approach 1: replace token values and expose a small `highlight` family so gold can appear on existing “live / energy” surfaces via a few class swaps.

| Choice | Value |
|---|---|
| Primary brand | Deep stamp red |
| Secondary brand | Restrained gold (not neon yellow) |
| Canvas | Crisp cool white / light gray |
| Type / radius / motion / spacing | Unchanged from Ledger |
| Packages | None new (shadcn, Lucide, Framer Motion already present) |

## Color system

### Light

| Token | Hex | Role |
|---|---|---|
| `surface` | `#F5F6F8` | Page canvas |
| `surface-raised` | `#FFFFFF` | Sheets, inputs, dialogs, rows |
| `surface-sunken` | `#E8EBF0` | Wells, pressed, chips at rest |
| `ink` | `#14181F` | Primary text |
| `ink-muted` | `#4A5563` | Metadata |
| `ink-subtle` | `#5B6572` | Captions / placeholders (≥4.5:1 on `surface`) |
| `hairline` | `#7A8490` | 1px rules and borders (≥3:1 on surfaces) |
| `accent` | `#A11F2B` | Primary actions, active nav, focus, logo stamp |
| `accent-ink` | `#FFFFFF` | Text/icons on accent |
| `accent-wash` | `#F8E8EA` | Soft red selection |
| `highlight` | `#C48A00` | Gold — Live, rare energy marks (not body text) |
| `highlight-ink` | `#14181F` | Text on gold fills |
| `highlight-wash` | `#FFF6DC` | Soft gold wash |
| `positive` | `#1B6B43` | Met / success (unchanged role) |
| `caution` | `#8A5A10` | Stale / thin data — distinct from brand gold |
| `danger` | `#9B2C2C` | Destructive / failure only |
| washes | existing pattern | Keep positive/caution/danger washes; cool `ink-wash` = sunken |

### Dark

Cool near-black surfaces; lighten `accent` and `highlight` for focus/contrast; flip `accent-ink` / `highlight-ink` as needed so filled controls stay readable. Same token names as light.

### Usage rules (anti–AI-generated)

- Red owns ~90% of brand color on screen.
- Gold is rare: Live badge, optional match/energy chips — never large page backgrounds, never paragraphs.
- No red–yellow gradients, brand glow, rainbow icons, or pill-everything radius.
- Do not use bright yellow as small text on white (contrast failure). Prefer gold fill + dark ink, or gold icon on `highlight-wash`.
- Caution amber stays for warnings; do not conflate with `highlight`.
- Hairlines separate regions; shadows remain flat / raised / overlay only.

## Typography, spacing, radius, motion

Unchanged from current Ledger tokens and `docs/MOTION.md`:

- Newsreader (titles), Public Sans (UI/body), JetBrains Mono (code).
- Major-third type scale from 16px; caption floor 12px.
- Spacing `space-1`…`space-10` (4→128).
- Radius: control 2px, card 6px, overlay 10px, full for avatars/switches only.
- Motion: feedback only; durations ≤260ms; feed rows do not hover-lift.

## File impact

| File | Change |
|---|---|
| `app/tokens.css` | New light/dark values; add `highlight`, `highlight-ink`, `highlight-wash` |
| `lib/design-tokens.ts` | Mirror hex values for email/charts/OG |
| `app/colors.css` | Aliases for highlight if needed |
| `app/globals.css` `@theme inline` | `--color-highlight*` |
| `tailwind.config.ts` | Semantic `highlight` colors |
| `docs/ART_DIRECTION.md` | Signal Stamp as default; Ledger retained as recorded alternate |
| Live badge (e.g. `HomeHiddenJobsFeed`) | `positive` → `highlight` classes so gold appears |

Out of scope: sidebar structure, job-card markup, routes, APIs, auth, new components, new dependencies.

## Success criteria

1. Dashboard and marketing surfaces read as cool white + deep red, not cream paper.
2. Gold appears at least on Live (and any other intentional highlight swap), sparingly.
3. Light and dark themes remain readable (focus ring and text contrast).
4. `npm run check:tokens` passes; no new hardcoded hex outside allowlisted token files.
5. No layout or feature behavior regressions from this change.
