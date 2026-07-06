# WorkGraph Design System

**Version:** 1.0  
**Status:** Source of truth — all UI must conform to this document  
**Product:** Premium enterprise AI career intelligence platform

---

## Mission

WorkGraph helps professionals and teams **see, understand, and act on their career graph** — jobs, skills, applications, interviews, and market signals — with AI that earns trust through clarity, not spectacle.

Our design mission is to make complex career data feel **as legible as a great spreadsheet and as considered as a private briefing**. Every surface should communicate competence, calm, and momentum. Users should feel they are operating inside a serious tool built for high-stakes decisions — not a consumer app dressed in enterprise clothing.

We optimize for:

1. **Decision velocity** — the right insight visible in under 3 seconds  
2. **Cognitive calm** — dense when needed, never noisy  
3. **Trust through structure** — predictable layouts, honest states, no dark patterns  
4. **Human warmth within enterprise rigor** — career is personal; the UI respects that without becoming casual

---

## Visual Personality

WorkGraph looks and feels like **a precision instrument for career intelligence**.

### What we are

| Attribute | Expression |
|-----------|------------|
| **Architected** | Clear hierarchy, aligned grids, intentional whitespace — nothing floats without purpose |
| **Signal-driven** | Brand red marks *meaning* (action, match, alert) — not decoration |
| **Data-literate** | Numbers, statuses, and timelines are first-class; typography supports scanning |
| **Quietly confident** | No gradients-for-gradient's-sake, no glassmorphism trends, no mascot energy |
| **Graph-native** | Structure implies connection — sections relate, progress flows, state has lineage |

### What we are not

- Not a social feed (no infinite-scroll card chaos)
- Not a generic AI chat product (no glowing orbs, no purple-on-black "magic" aesthetic)
- Not a marketing landing page inside the app (no hero typography in tool surfaces)
- Not a clone of Linear, Stripe, Ashby, or Attio — we share their *discipline*, not their *skin*

### Inspiration → WorkGraph translation

We study best-in-class enterprise SaaS for **craft standards**, then express our own identity:

| Reference | What we learn | What WorkGraph does differently |
|-----------|---------------|--------------------------------|
| **Linear** | Keyboard fluency, density, motion with purpose | Warmer neutrals; red accent vs. monochrome; career context needs more guidance copy |
| **Stripe Dashboard** | Trust, tabular clarity, restrained color | Less payment-form minimalism; more narrative structure for job journeys |
| **Ashby** | Recruiting domain warmth, approachable density | Deeper AI insight surfaces; more data-forward, less pipeline-cute |
| **Attio** | Relational data polish, object-centric UI | Stricter enterprise tone; fewer playful chips; graph metaphor over CRM playfulness |

### Personality keywords

> **Clear · Composed · Connected · Credible · Current**

---

## Brand Principles

### 1. The graph is the product

WorkGraph's mark is a node-and-edge graph. The UI reflects this through **connected sections**, **traceable state**, and **visible relationships** (job → application → interview → outcome). Isolated cards without context are an anti-pattern.

### 2. Red means signal

Brand red (`#B91C1C`) is reserved for:

- Primary actions the user is being asked to take
- Active navigation selection
- High-salience metrics (match score, urgent status)
- Brand mark and wordmark accent

Red is **never** used for large background fields, decorative borders, or body text blocks.

### 3. One product, one theme

Profile, dashboard, employer, and vault are **surfaces of one application**, not separate design systems. Shell chrome may adapt; tokens do not fork.

### 4. AI is an layer, not a aesthetic

AI features are styled like other product capabilities: structured panels, labeled outputs, confidence indicators, and citations. No distinct "AI purple" or chat-bubble aesthetic in core workflows.

### 5. Honest states

Empty, loading, error, and partial-data states are designed with equal care as success states. Never imply data exists when it doesn't. Demo/sample data must be explicitly labeled.

### 6. Enterprise without sterility

Professional ≠ cold. We use readable type, sufficient touch targets, and human microcopy. We avoid jargon in UI labels and patronizing tone in empty states.

### 7. Consistency beats novelty

New patterns require design-system approval. Prefer extending existing primitives over inventing one-off components.

---

## Typography Principles

### Typefaces

| Role | Family | Usage |
|------|--------|-------|
| **UI Sans** | Inter | All interface text — headings, body, labels, buttons |
| **Data Mono** | Geist Mono | Timestamps, IDs, KPI labels, code snippets, tabular figures |

Do not introduce additional typefaces without explicit system revision.

### Type scale

WorkGraph uses a **fixed 8-step scale**. Arbitrary font sizes (`text-[13px]`, `text-[17px]`) are prohibited in application UI.

| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| `display` | 30px / 36px (sm+) | 1.15 | 600 | Marketing-only page heroes — **not used in app chrome** |
| `heading-lg` | 24px | 1.25 | 600 | Page titles within app |
| `heading` | 20px | 1.3 | 600 | Section titles, modal titles |
| `title` | 16px | 1.4 | 600 | Card titles, subsection headers |
| `body` | 14px | 1.5 | 400 | Default body, descriptions, table cells |
| `body-medium` | 14px | 1.5 | 500 | Emphasized body, button labels |
| `caption` | 12px | 1.4 | 500 | Metadata, helper text, badges |
| `label` | 11px | 1.3 | 500 | Uppercase section labels (mono optional) |

**Minimum readable size in app UI: 12px.** Labels at 11px are permitted only for uppercase mono labels with `letter-spacing: 0.08em` or wider.

### Weight rules

| Weight | Value | When |
|--------|-------|------|
| Regular | 400 | Body copy, long descriptions |
| Medium | 500 | Buttons, captions, interactive labels |
| Semibold | 600 | All headings, stat values, nav items |
| Bold | 700 | **Rare** — only for single KPI numerals in hero metrics |

Never use weights below 400 or above 700.

### Tracking & case

- Headings: `letter-spacing: -0.01em` (tight) at 20px and above  
- Uppercase labels: `letter-spacing: 0.08em`, always `font-medium` or `font-semibold`  
- Body and captions: default tracking — no manual tightening  
- Sentence case for all UI strings except acronyms and proper nouns  
- Title Case only for proper nouns and product names — not for buttons or nav items

### Tabular data

All numbers that align in columns (salaries, counts, percentages, dates) use `font-variant-numeric: tabular-nums`.

### Hierarchy rules

1. One `heading-lg` per page maximum  
2. Section → `heading`; card group → `title`; supporting text → `body` or `caption`  
3. Muted text uses the `text-secondary` token — never a random gray utility  
4. Links within body are `body-medium` + primary color; no underline unless `link` variant

---

## Spacing Principles

### Base grid

All spacing derives from an **8px base unit**. Half-steps (4px) are permitted only for internal component padding and icon gaps — never for section-level layout.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Icon-to-label gap, badge internal padding |
| `space-2` | 8px | Tight stacks, inline groups |
| `space-3` | 12px | Form field internal gaps |
| `space-4` | 16px | Card padding (compact), list item padding |
| `space-5` | 20px | — *avoid; use 16 or 24* |
| `space-6` | 24px | Card padding (default), section inner padding |
| `space-8` | 32px | Between related section groups |
| `space-10` | 40px | — *avoid; use 32 or 48* |
| `space-12` | 48px | Major section breaks |
| `space-16` | 64px | Page-level vertical rhythm (rare) |

### Layout constants

Single source of truth for shell dimensions:

| Token | Value | Notes |
|-------|-------|-------|
| `shell-topnav-height` | 56px | All top navigation bars |
| `shell-sidebar-width` | 240px | Expanded sidebar |
| `shell-sidebar-collapsed` | 72px | Icon-only sidebar |
| `shell-content-max` | 1200px | Primary content column |
| `shell-content-wide` | 1280px | Data-dense views only (tables, split panels) |
| `shell-page-padding-x` | 16px → 24px → 32px | mobile → tablet → desktop |
| `shell-page-padding-y` | 24px | Default page vertical padding |
| `shell-mobile-nav-height` | 56px | Bottom tab bar + safe area |

### Component spacing

| Component | Padding | Gap |
|-----------|---------|-----|
| Card (default) | 24px | 16px internal |
| Card (compact) | 16px | 12px internal |
| Dialog body | 24px | 16px |
| Dialog footer | 16px | 12px between actions |
| List row | 12px vertical, 16px horizontal | — |
| Form field group | — | 16px between fields |
| Button group | — | 8px |

### Section rhythm

- **16px** between items in a list or card group  
- **32px** between subsections within a page  
- **48px** between major page regions  
- Related metric cards share a single row with **16px** gutter — never uneven gaps

### Touch targets

Minimum interactive target: **44×44px** on touch devices. Visual elements may be smaller if hit area is padded invisibly. Desktop-dense contexts may use **36px** minimum height with explicit `compact` variant designation.

---

## Color Principles

### Philosophy

Color carries **meaning**, not mood. Neutrals do 90% of the work. Brand red and semantic colors appear only where they communicate state or action. Dark mode preserves the same semantic roles — it does not become a different brand.

### Neutral palette (light)

| Token | Hex | Role |
|-------|-----|------|
| `bg-page` | `#FAFAFA` | App background |
| `bg-surface` | `#FFFFFF` | Cards, panels, popovers |
| `bg-subtle` | `#F4F4F5` | Muted fills, secondary buttons, table stripes |
| `border-default` | `#E4E4E7` | Standard borders |
| `border-strong` | `#D4D4D8` | Emphasized dividers, input borders on focus-adjacent |
| `text-primary` | `#18181B` | Headings, primary body |
| `text-secondary` | `#52525B` | Descriptions, metadata |
| `text-tertiary` | `#A1A1AA` | Placeholders, disabled, timestamps |
| `text-inverse` | `#FAFAFA` | Text on dark fills |

### Brand palette

| Token | Hex | Role |
|-------|-----|------|
| `brand` | `#B91C1C` | Primary brand, primary actions |
| `brand-hover` | `#991B1B` | Hover on brand fills |
| `brand-subtle` | `rgba(185, 28, 28, 0.08)` | Active nav bg, selected chip bg (light) |
| `brand-muted` | `rgba(185, 28, 28, 0.16)` | Focus rings, highlight washes |

### Semantic palette (light)

| Token | Hex | Role |
|-------|-----|------|
| `success` | `#059669` | Confirmed, high match, completed |
| `success-subtle` | `#ECFDF5` | Success background |
| `warning` | `#D97706` | Caution, medium match, pending review |
| `warning-subtle` | `#FFFBEB` | Warning background |
| `error` | `#DC2626` | Errors, destructive actions, failed states |
| `error-subtle` | `#FEF2F2` | Error background |
| `info` | `#2563EB` | Informational, links to external context |
| `info-subtle` | `#EFF6FF` | Info background |

Semantic colors are **never** used as primary action color. Primary actions always use `brand`.

### Dark mode palette

Dark mode uses the same token names. Values shift; semantics do not.

| Token | Hex (dark) |
|-------|------------|
| `bg-page` | `#09090B` |
| `bg-surface` | `#18181B` |
| `bg-subtle` | `#27272A` |
| `border-default` | `rgba(255, 255, 255, 0.08)` |
| `border-strong` | `rgba(255, 255, 255, 0.14)` |
| `text-primary` | `#FAFAFA` |
| `text-secondary` | `#A1A1AA` |
| `text-tertiary` | `#71717A` |
| `brand` | `#EF4444` |
| `brand-hover` | `#DC2626` |
| `brand-subtle` | `rgba(239, 68, 68, 0.12)` |

Dark mode brand remains **red** — never blue, white, or purple as primary.

### Color usage rules

1. **No raw Tailwind color utilities** (`slate-200`, `emerald-700`) in feature components — map to semantic tokens  
2. **No hex literals** in TSX/CSS except token definition files  
3. **Borders before shadows** for elevation at rest; shadows only for floating layers (dropdowns, modals, toasts)  
4. **Maximum 3 colors per component** excluding neutrals (e.g., surface + border + one accent)  
5. **Match scores** use semantic gradient: high → success, medium → warning, low → neutral — never brand red for "bad" and never random blues  
6. **Charts** use a defined 5-color sequential scale derived from neutrals + brand + semantic — not rainbow defaults

### Elevation & shadows

| Level | Token | Use |
|-------|-------|-----|
| 0 | none | Cards at rest — border only |
| 1 | `shadow-sm` | Cards on hover, sticky subheaders |
| 2 | `shadow-md` | Dropdowns, popovers, select menus |
| 3 | `shadow-lg` | Modals, command palette, toasts |

Shadow values:

```
shadow-sm:  0 1px 2px rgba(24, 24, 27, 0.04), 0 1px 3px rgba(24, 24, 27, 0.02)
shadow-md:  0 4px 12px rgba(24, 24, 27, 0.06), 0 2px 4px rgba(24, 24, 27, 0.03)
shadow-lg:  0 8px 24px rgba(24, 24, 27, 0.08), 0 4px 8px rgba(24, 24, 27, 0.04)
```

### Border radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Checkboxes, small chips, tags |
| `radius-md` | 8px | Buttons, inputs, dropdown items |
| `radius-lg` | 12px | Cards, dialogs, panels |
| `radius-full` | 9999px | Avatars, status dots, pill badges only |

**One radius per component class.** Cards are `radius-lg`; buttons are `radius-md`. No `rounded-[20px]` exceptions.

---

## Interaction Principles

### Feedback hierarchy

Every user action receives feedback in one of four tiers:

| Tier | Latency | Pattern |
|------|---------|---------|
| **Instant** | 0–100ms | Hover, press, focus ring, toggle state |
| **Acknowledged** | 100–300ms | Button loading spinner, optimistic UI update |
| **Progress** | 300ms–3s | Skeleton → content, progress bar, inline status |
| **Async** | 3s+ | Toast on completion, background refresh indicator |

### Buttons

| Variant | Use |
|---------|-----|
| **Primary** | One per view region — the main action |
| **Secondary** | Supporting actions, cancel-adjacent |
| **Ghost** | Tertiary, toolbar, icon actions |
| **Outline** | Filters, toggles, low-emphasis in dense toolbars |
| **Destructive** | Irreversible delete/remove only |

| Size | Height | Use |
|------|--------|-----|
| `sm` | 32px | Dense tables, inline actions (desktop) |
| `md` | 36px | Default app buttons |
| `lg` | 44px | Auth flows, mobile primary CTAs |

Auth/marketing CTAs may use `lg` + full-width. In-app actions use `md` unless in a compact data view.

### Inputs

| Size | Height | Use |
|------|--------|-----|
| `sm` | 32px | Inline edit, compact filters |
| `md` | 40px | Default forms, search bars |
| `lg` | 44px | Auth, onboarding, mobile-first forms |

Focus state: `border-brand` + `ring-2 ring-brand-subtle` — consistent across all inputs. No custom focus shadows per feature.

### Navigation

- **Active item**: `brand-subtle` background + `brand` text/icon + 2px left inset bar (sidebar)  
- **Hover**: `bg-subtle` — never brand color on hover alone  
- **Current page** must be visible without relying on color alone (weight, inset bar, or icon fill)

### Selection & multi-select

- Single select: Radix Select or DropdownMenu  
- Multi-select filters: chip display with removable tokens  
- Never use raw `<details>` for application menus — use primitives for focus trap and ESC behavior

### Modals & drawers

| Size | Max width | Use |
|------|-----------|-----|
| `sm` | 400px | Confirmations, simple forms |
| `md` | 512px | Standard forms, detail preview |
| `lg` | 640px | Complex forms, split content |
| `xl` | 800px | Intelligence reports, document preview |
| `full` | 100% − 48px | Full-screen mobile drawers |

Drawers slide from right on desktop, bottom on mobile for filters and detail panels.

### Command palette

Global `⌘K` is the power-user layer. It mirrors nav structure, respects the same tokens, and is not a separate visual theme.

### Loading

- **Skeleton** for layout-stable content (cards, lists, dashboards)  
- **Spinner** for action buttons and inline refresh — one `Spinner` component, `sm | md | lg`  
- **Never** show success-colored spinner during loading  
- Page transitions use skeleton layouts matching final structure — not centered spinners alone

### Empty states

Structure: icon (muted) → title (`title`) → description (`body`, `text-secondary`) → primary action. Max one action. No illustration library required — Lucide icon at 32px is sufficient.

### Toasts

- Bottom-right on desktop, bottom-center on mobile (above nav)  
- Auto-dismiss: 5s success/info, persistent error until dismissed  
- Variants map to semantic colors — not custom per feature

---

## Accessibility Principles

WorkGraph targets **WCAG 2.2 Level AA** across all surfaces.

### Color & contrast

- Text on `bg-surface`: minimum 4.5:1 (body), 3:1 (large text ≥18px semibold)  
- `text-tertiary` is for non-essential metadata only — never sole indicator of state  
- State (success, error, warning) must include **icon or text label**, not color alone  
- Focus indicators: minimum 2px ring, 3:1 contrast against adjacent colors

### Keyboard

- All interactive elements reachable via Tab in logical order  
- `⌘K` / `Ctrl+K` opens command palette; `ESC` closes overlays  
- Modals trap focus; restore focus on close  
- Skip link to main content on every layout shell  
- Data tables (when implemented) support arrow-key cell navigation

### Screen readers

- Every icon-only button has `aria-label`  
- Live regions for async updates (`aria-live="polite"`) on save status, filter result counts  
- Loading states announce via `aria-busy` on containers  
- Decorative icons: `aria-hidden="true"`

### Motion

- All animations respect `prefers-reduced-motion: reduce` — instant state change, no transform  
- No autoplaying animation required to understand UI state  
- Parallax, floating blobs, and decorative motion are **marketing-only**

### Touch & motor

- 44px minimum touch target on mobile  
- Adequate spacing between destructive and safe actions (minimum 8px, prefer separate rows)  
- No time-limited interactions without extension option

### Cognitive

- Progressive disclosure for AI outputs — summary first, detail on expand  
- Error messages state what happened and what to do next  
- Form labels always visible — placeholder is not a label

---

## Responsive Principles

### Breakpoints

| Name | Min width | Layout behavior |
|------|-----------|-----------------|
| `mobile` | 0 | Single column, bottom nav, drawers over modals |
| `tablet` | 768px | Sidebar appears, bottom nav hides, 2-column grids |
| `desktop` | 1024px | Full sidebar, multi-column dashboards |
| `wide` | 1280px | `content-wide` max width available |

### Mobile-first rules

1. Design the narrow layout first; add columns at breakpoints — never subtract  
2. Tables become card lists below `tablet` unless horizontal scroll is explicitly designed  
3. Filters move to bottom sheet on mobile — not inline wrapping chaos  
4. Sticky headers account for safe-area insets (`env(safe-area-inset-*)`)  
5. Typography scale does not shrink below `caption` (12px) on any breakpoint

### Content priority

On mobile, each page shows:

1. Primary metric or status  
2. Primary action  
3. Next most relevant content block  
4. Everything else behind tabs, accordions, or "View all"

### Shell behavior

| Element | Mobile | Desktop |
|---------|--------|---------|
| Sidebar | Sheet drawer | Fixed sidebar |
| Top nav | Logo + search + menu | Full top nav |
| Secondary nav | Tabs or bottom sheet | Sidebar sections or horizontal tabs |
| Command palette | Full-width sheet | Centered modal |

---

## Animation Principles

### Philosophy

Motion **confirms causality** — something happened because you did something. It never decorates idle screens. WorkGraph animation is closer to Stripe's functional transitions than Linear's expressive micro-interactions, with slightly more warmth on success states.

### Duration tokens

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `instant` | 0ms | — | Reduced motion, state toggles |
| `fast` | 100ms | `ease-out` | Hover, press, focus ring |
| `normal` | 200ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Dropdown open, tab switch, chip enter |
| `slow` | 350ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Page section enter, card reveal |
| `slower` | 500ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Auth/marketing enter only |

No animation exceeds **500ms** in application UI.

### Allowed animations

| Pattern | Spec |
|---------|------|
| **Fade in** | `opacity 0→1` over `normal` |
| **Slide up** | `translateY(8px)→0` + fade, over `normal` — list items, toasts |
| **Scale in** | `scale(0.97)→1` + fade, over `fast` — modals only |
| **Skeleton pulse** | Opacity 1→0.5→1 over 1.5s — loading only |
| **Spinner** | `rotate 360deg` linear infinite — actions only |
| **Success check** | Single scale bounce — save confirmation only |

### Prohibited animations

- Infinite float/bob on static elements  
- Staggered card cascades longer than 300ms total  
- Scroll-jacking  
- Confetti, particles, or gamified celebrations in enterprise views  
- Pulsing CTAs (except live-data indicator dot at 1.5s interval, max 2px radius)

### Stagger

List enter stagger: **30ms** per item, max **5 items** staggered. Remaining items appear instantly.

### Page transitions

Route changes: crossfade content region over `normal`. Shell chrome (nav, sidebar) does not animate.

---

## Implementation Contract

This document governs all future UI work. Implementation must follow:

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| CSS variables | `app/globals.css` | Single `:root` and `.dark` token block — no parallel `--dash-*` or profile overrides |
| TypeScript tokens | `lib/design-tokens.ts` | Mirror CSS tokens for programmatic use (charts, emails) |
| Primitives | `components/ui/*` | shadcn components consume semantic tokens only |
| Patterns | `components/design-system/*` | Composed patterns (MetricCard, PageHero) — no hardcoded colors |
| Shell | `components/dashboard/layout/*` | Layout uses `shell-*` dimension tokens |

### Migration note

The codebase currently violates this system in multiple areas (documented in `DESIGN_AUDIT.md`). Refactors must converge on this file — not introduce new parallel tokens.

### Decision log

When this system conflicts with existing code, **this document wins**. Proposed exceptions require explicit amendment to this file with version bump.

---

## Quick Reference Card

```
Personality:  Clear · Composed · Connected · Credible · Current
Brand red:    #B91C1C — signal only, not decoration
Type:         Inter (UI) + Geist Mono (data)
Scale:        11 · 12 · 14 · 16 · 20 · 24 · 30/36px — no arbitrary sizes
Grid:         8px base
Radius:       6 · 8 · 12px + full pills
Shadow:       sm (hover) · md (float) · lg (modal)
Button:       36px default · 44px mobile CTA
Input:        40px default · 44px auth
Nav active:   brand-subtle bg + 2px inset bar
Dark mode:    Same semantics · red stays red
Motion:       100–350ms · purposeful · respects reduced-motion
A11y:         WCAG 2.2 AA · keyboard · icon labels · state ≠ color alone
```

---

*WorkGraph Design System v1.0 — source of truth for all product surfaces.*
