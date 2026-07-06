# WorkGraph UI Design Audit

**Date:** July 6, 2026  
**Scope:** Full codebase analysis — no pages redesigned  
**Auditor lens:** Linear · Stripe · Ashby design-system rigor

---

## Executive Summary

WorkGraph has the bones of a premium SaaS product — shadcn/ui (radix-nova), Lucide icons, Inter + Geist Mono, and a coherent brand red (`#B91C1C`). However, the UI is built on **four parallel design layers** that were never fully unified:

| Layer | Source | Used by |
|-------|--------|---------|
| shadcn semantic tokens | `app/globals.css` (`--primary`, `--muted`, etc.) | `components/ui/*` |
| WorkGraph tokens | `app/globals.css` (`--wg-*`) + `lib/design-tokens.ts` | Scattered; mostly unused in TS |
| Dashboard shell tokens | `dashboard-layout.css` (`--dash-*`) | Dashboard, design-system |
| Profile shell tokens | `profile-theme.css` (`--wg-color-*` overrides) | Profile surfaces |

The result is a product that **reads as one brand in marketing** but **behaves like three products in-app** — especially the job board (`RecommendedJobsSection.tsx`), which implements a full Google Material palette (`#1A73E8`, `#DADCE0`, `#8E8E93`) disconnected from WorkGraph red.

**Severity breakdown**

| Severity | Count (approx.) | Examples |
|----------|-----------------|----------|
| Critical | 5 | Dual dark-mode systems, Google palette in job board, layout dimension drift |
| High | 12 | Card system fragmentation, input height chaos, badge taxonomy |
| Medium | 18 | Typography off-scale, spinner inconsistency, unused tokens |
| Low | 10+ | Orphan CSS, animation sprawl, missing primitives |

---

## 1. Colors

### 1.1 Canonical Brand Palette (defined)

| Token | Light value | Where defined |
|-------|-------------|---------------|
| Primary / Brand red | `#B91C1C` | `globals.css`, `design-tokens.ts`, `WorkGraphLogo.tsx` |
| Primary hover | `#991B1B` | Same |
| Background | `#FAFAFA` | `--background`, `WG_COLORS.background` |
| Surface | `#FFFFFF` | `--wg-color-surface`, `--card` |
| Border | `#ECECEC` | `--border`, `--wg-color-border` (globals) |
| Text primary | `#111827` | `--foreground`, `--wg-color-text-primary` (globals) |
| Text secondary | `#6B7280` | `--wg-secondary`, `--wg-color-text-secondary` (globals) |
| Success | `#10B981` (globals) / `#15803D` (profile) | **Conflict** |
| Warning | `#F59E0B` (globals) / `#B45309` (profile) | **Conflict** |
| Info | `#3B82F6` | globals only |

### 1.2 Parallel / Conflicting Palettes

**Profile theme** (`profile-theme.css`) redefines the same semantic slots with different values:

| Semantic | globals `:root` | profile-theme |
|----------|-----------------|---------------|
| Border | `#ECECEC` | `#E7E5E4` (stone-200) |
| Page bg | `#FAFAFA` | `#FAFAF9` (stone-50) |
| Text primary | `#111827` (gray-900) | `#09090B` (zinc-950) |
| Text secondary | `#6B7280` (gray-500) | `#27272A` (zinc-800) |
| Success | `#10B981` | `#15803D` (green-700) |

**Google / Apple ad-hoc palette** — hardcoded in ~150+ class strings across:

- `components/profile/RecommendedJobsSection.tsx` (primary offender)
- `components/profile/ProfileJobDashboard.tsx`
- `components/profile/ProfileQuickActions.tsx`
- `components/profile/LinksSection.tsx`
- `components/shared/SectionErrorBoundary.tsx`

| Hex | Role in those files | WorkGraph equivalent |
|-----|---------------------|----------------------|
| `#1A73E8` | Primary action, links, focus rings | `--wg-color-info` / should be `--primary` |
| `#DADCE0` | Borders | `--border` |
| `#8E8E93` | Muted text | `--wg-color-text-tertiary` |
| `#3A3A3C` / `#1D1D1F` / `#2C2C2E` | Body / heading text | `--foreground` |
| `#E8F0FE` | Selected / chip bg | No token |
| `#F8F9FA` | Subtle surface | `--muted` |
| `#FEF7E0` / `#F9AB00` | Warning surfaces | `--wg-color-warning` variants |
| `#1E8E3E` | Success / high match | `--wg-color-success` |
| `#C5221F` / `#D93025` | Error text | `--destructive` |

**Tailwind palette sprawl** — components also use raw Tailwind color utilities without mapping to tokens:

- `slate-*` — 80+ usages (profile editing, auth, GlobalSearch)
- `emerald-*` — 25+ usages (success states, badges, avatars)
- `amber-*` — 15+ usages (warnings, toasts)
- `gray-*` — design-system chips (`WG_PLATFORM_CHIP_CLASS`)

**Legacy orphan theme** — `styles.css` defines a purple marketing theme (`#7C3AED`, `#030712`) that is **not imported** by the Next.js app but remains in the repo as a drift risk.

### 1.3 Dark Mode — Critical Fragmentation

Three incompatible dark-mode implementations coexist:

| Mechanism | Selector | Primary in dark | Who sets it |
|-----------|----------|-----------------|-------------|
| WorkGraph vars | `[data-theme="dark"]` | `#8AB4F8` (Google blue!) | `ProfileThemeProvider` |
| Dashboard vars | `[data-theme="dark"] .wg-dash-root` | `#F87171` (red-400) | Same provider |
| shadcn | `.dark` | `oklch(0.922 0 0)` — **near white** | TopNav toggle (partial) |

**Inconsistencies:**

- `ProfileThemeProvider` sets `data-theme` on `<html>` but **never adds `.dark`**, so shadcn `dark:` variants in `button.tsx`, `input.tsx`, `badge.tsx` often **do not activate**.
- `[data-theme="dark"]` turns brand primary to Google blue (`#8AB4F8`) while dashboard accent becomes coral red (`#F87171`) — brand identity breaks in dark mode.
- Profile dark surfaces use slate (`#1E293B`, `#020617`); dashboard dark uses slate-navy (`#0B1120`, `#0F172A`); shadcn dark uses oklch neutrals — three different dark aesthetics.
- `SettingsSection` uses a `Checkbox` for dark mode; `TopNav` uses icon toggle; `ProfileThemeToggle` uses a raw `<button>` — three UX patterns for one setting.

### 1.4 Color Inconsistency Summary

- [ ] **4 border colors** in active use: `#ECECEC`, `#E7E5E4`, `#DADCE0`, `slate-200`
- [ ] **3 text-primary values**: `#111827`, `#09090B`, `#1D1D1F`
- [ ] **2 success greens** per theme mode (globals vs profile)
- [ ] **Brand red abandoned** in largest surface area (job board)
- [ ] **Dark mode primary** is blue in WG vars, white in shadcn, coral in dashboard

---

## 2. Typography

### 2.1 Font Families

| Role | Family | Source |
|------|--------|--------|
| Sans (UI) | Inter | `app/layout.tsx` → `--font-sans` |
| Mono (labels, KPIs) | Geist Mono | `app/layout.tsx` → `--font-mono` |
| Heading alias | Same as sans | `--font-heading: var(--font-sans)` in `@theme` |

No dedicated display or marketing font. `font-heading` is applied to dialog titles and card titles but resolves to Inter.

### 2.2 Documented Type Scale (`WG_TYPOGRAPHY` in `design-tokens.ts`)

| Role | Classes | Adoption |
|------|---------|----------|
| Display | `text-3xl sm:text-4xl font-semibold tracking-tight` | PageHero only |
| Heading | `text-xl sm:text-2xl font-semibold tracking-tight` | Partial |
| Title | `text-base font-semibold tracking-tight` | Partial |
| Body | `text-sm font-normal` | Default in shadcn |
| Caption | `text-xs font-medium text-[var(--wg-secondary)]` | Rare |

**`WG_TYPOGRAPHY` is defined but never imported** — the scale exists only as documentation.

### 2.3 Font Sizes — Off-Scale Values Found

| Size | px equivalent | Where used | Standard Tailwind |
|------|---------------|------------|-------------------|
| `text-[0.8rem]` | ~12.8px | Button `sm` size | `text-xs` (12px) |
| `text-[10px]` | 10px | Badges, chips, labels (15+ files) | Below scale |
| `text-[11px]` | 11px | TopNav live badge, mono dates, social posts | Below scale |
| `text-[13px]` | 13px | Job board, ProfileJobDashboard labels | Between xs/sm |
| `text-[14px]` | 14px | Auth footer links | = `text-sm` but arbitrary |
| `text-[15px]` | 15px | Auth body, ProfileHero subtitle, create-profile | Between sm/base |
| `text-[17px]` | 17px | WorkGraphLogo wordmark | Off-scale |
| `text-[18px]` | 18px | Section headings (Links, QuickActions, job board) | Between base/lg |
| `text-[20px]` | 20px | Match score, empty states | = `text-xl` but arbitrary |
| `text-[32px]` | 32px | ProfileJobDashboard KPI numbers | Between 2xl/3xl |
| `text-[1.625rem]` | 26px | ProfileHero name | Off-scale |
| `text-[2.125rem]` | 34px | AuthSplitShell headline (xl breakpoint) | Off-scale |
| `0.6875rem` | 11px | `.wg-dash-nav-group-label`, profile KPI dt | CSS only |

### 2.4 Font Weights

| Weight | Tailwind | Usage pattern |
|--------|----------|---------------|
| 400 normal | `font-normal` | Body, descriptions |
| 500 medium | `font-medium` | Buttons (shadcn), labels, captions |
| 600 semibold | `font-semibold` | Headings (base layer), nav labels, section titles |
| 700 bold | `font-bold` | KPI values, match scores, sidebar rank badges |

**Inconsistencies:**

- Base layer sets all `h1–h6` to `font-semibold`, but `[data-slot="card-title"]` overrides to `font-semibold` while `CardTitle` component declares `font-medium` — cascade conflict.
- `DialogTitle` uses `font-medium`; page headings use `font-semibold` or `font-bold` — modal hierarchy feels lighter than page hierarchy.
- Profile KPI `dd` uses `font-weight: 700` in CSS; dashboard `MetricCard` uses `font-semibold` (600) for stat values.
- `ProfileButton` adds `font-semibold` on top of button's `font-medium`.

### 2.5 Letter-Spacing

| Value | Where |
|-------|-------|
| `tracking-tight` | Headings, logo |
| `tracking-wide` / `tracking-[0.06em]` | Badge labels, nav group labels |
| `tracking-[0.08em]` | `.wg-label-mono`, profile KPI dt |
| `tracking-[0.12em]` | ProfileHero eyebrow |
| `tracking-[0.16em]` | Job board section label |
| `tracking-[0.22em]` | Experience/Education section labels |

Uppercase label tracking varies across **5 different values** with no documented rule.

---

## 3. Border Radius

### 3.1 Token Definitions

| Token | Value | Source |
|-------|-------|--------|
| `--wg-radius-sm` | 8px | globals, design-tokens |
| `--wg-radius-md` | 12px | globals, design-tokens |
| `--wg-radius-lg` | 16px | globals, design-tokens |
| `--wg-profile-radius` | 14px | profile-theme.css |
| `--dash-radius` | 12px | dashboard-layout.css |
| `--dash-radius-lg` | 16px | dashboard-layout.css |
| `--radius` (shadcn) | 14px (`0.875rem`) | globals |
| shadcn derived | sm→4xl via `calc()` multipliers | `@theme inline` |

**Five "medium" radius values**: 8, 12, 14, 14 (shadcn lg), 16 — with 12px and 14px used interchangeably.

### 3.2 Component Radius Map

| Component / pattern | Radius class | Effective px |
|---------------------|--------------|--------------|
| Button (default) | `rounded-lg` | 14px (shadcn) |
| Button xs/sm | `rounded-[min(var(--radius-md),10-12px)]` | Capped 10–12px |
| Input, Textarea | `rounded-lg` | 14px |
| Card (ui) | `rounded-xl` | ~19.6px (`radius * 1.4`) |
| Dashboard section card | `var(--dash-radius)` | 12px |
| Profile card | `var(--wg-profile-radius)` | 14px |
| Badge (ui) | `rounded-4xl` | ~36px (pill) |
| Dialog, Sheet content | `rounded-xl` | ~19.6px |
| Dropdown content | `rounded-lg` | 14px |
| Select content | `rounded-lg` | 14px |
| Checkbox | `rounded-[4px]` | 4px |
| Auth CTAs | `rounded-full` | 9999px |
| Job board filters | `rounded-[20px]` | 20px |
| Job board chips | `rounded-2xl` / `rounded-[16px]` | 16–20px |
| Side nav active item | `0 8px 8px 0` (CSS) | 8px right only |
| Avatar | `rounded-full` | 50% |

### 3.3 Radius Inconsistencies

- Cards use **three different radii**: `rounded-xl` (ui), 12px (dashboard), 14px (profile).
- Job board introduces **20px pill radius** nowhere else in the product.
- Auth flows use **fully round buttons** (`rounded-full`); dashboard uses **rounded-lg** — different product personality on conversion vs. app.
- `dashClasses.sectionCard` applies `rounded-lg` on top of `.wg-dash-section-card` which already sets `border-radius: var(--dash-radius)` — redundant/conflicting.

---

## 4. Shadows

### 4.1 Defined Shadow Tokens

| Token | Value |
|-------|-------|
| `--wg-shadow-sm` | `0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.02)` |
| `--wg-shadow-md` | `0 4px 12px rgba(17,24,39,0.06), 0 2px 4px rgba(17,24,39,0.03)` |
| `WG_SHADOW.lg` | `0 8px 24px …` (TS only, unused) |
| `--wg-profile-shadow` | `0 1px 2px rgba(15,23,42,0.05)` |
| Dashboard topnav | `0 1px 0 rgba(17,24,39,0.04)` (border-shadow) |
| Profile hero hover | `0 4px 16px rgba(15,23,42,0.06)` |

### 4.2 Tailwind Shadow Usage

| Class | Where |
|-------|-------|
| `shadow-sm` | ProfileCard, SkeletonCard, job cards |
| `shadow-md` | ProfileCard hover, dropdown overrides |
| `shadow-lg` | GlobalSearch dropdown, filter menus, toaster |
| `shadow-xl` | GlobalSearch results panel |
| No shadow | `ui/card` (uses `ring-1 ring-foreground/10` instead) |

### 4.3 Shadow Inconsistencies

- **Cards**: dashboard uses CSS `box-shadow`; shadcn cards use **ring only, no shadow**; profile cards use **both** ring (inherited) + `shadow-sm`.
- **Elevation language undefined** — no documented z-index / shadow pairing (sm = resting, md = hover, lg = overlay).
- `ProfileCard` hover goes `shadow-sm → shadow-md`; `wg-dash-section-card` hover goes `wg-shadow-sm → wg-shadow-md` — same intent, different implementation.
- Dialog/Sheet overlays use `bg-black/10` + `backdrop-blur-xs`; no shadow on modal content (relies on ring).

---

## 5. Spacing — Padding, Margins, Gaps

### 5.1 Documented Grid

`WG_SPACING` defines an **8px base grid**: 8, 16, 24, 32, 48.  
**Not imported anywhere** except chip class. Spacing is applied ad hoc via Tailwind.

### 5.2 Layout Dimensions — Critical Drift

| Property | `dashboard-layout.css` | `dashboard-responsive.ts` | Actual usage |
|----------|------------------------|---------------------------|--------------|
| Top nav height | `56px` | `60px` | CSS var wins in components |
| Sidebar width | `248px` | `240px` | CSS var wins |
| Sidebar collapsed | `68px` | `72px` | CSS var wins |
| Content max width | `1280px` | `1200px` | **Both used** — CSS in shell, TS in `dashClasses.content` |

### 5.3 Component Padding Patterns

| Context | Padding |
|---------|---------|
| Dashboard main | `px-4 py-6 sm:px-6 md:px-8` |
| Card content (ui) | `px-4` (sm: `px-3`) |
| Card default vertical | `py-4` (sm: `py-3`) |
| ProfileCard sm/md/lg | `p-4` / `p-5 sm:p-6` / `p-6` |
| MetricCard | `p-5` |
| JobCard | `p-4 sm:p-5` |
| Dialog content | `p-4` |
| Dialog footer | `p-4` with `-mx-4 -mb-4` bleed |
| Dropdown items | `px-2 py-1.5` |
| EmptyState | `px-6 py-12` |
| Vault main | `px-4 py-8` |
| Employer shell content | varies |

### 5.4 Touch Target Rules

- `.wg-dash-root button, a[role="button"]` → `min-height: 44px` (WCAG)
- `.wg-dash-compact-btn` → `min-height: 36px` (exception)
- shadcn default button → `h-8` (32px) — **below 44px**, overridden only inside `.wg-dash-root`
- Mobile bottom nav items → `min-h-[52px]`
- Inputs remain `h-8` (32px) everywhere — no touch-target override

### 5.5 Spacing Inconsistencies

- Section vertical rhythm varies: `mb-4`, `mb-5`, `mb-6`, `space-y-4`, `space-y-6`, `gap-4`, `gap-6` with no documented section spacing token.
- Profile KPI grid uses `1px` gap with border-as-grid-line pattern; nowhere else.
- `DialogFooter` negative margin bleed (`-mx-4 -mb-4`) is unique — other card footers don't bleed.

---

## 6. Icons

### 6.1 Library

**Lucide React** exclusively — ~90 component files import from `lucide-react`.  
shadcn config (`components.json`) specifies `iconLibrary: "lucide"`.  
Custom icons: `WorkGraphLogo.tsx`, `RedditLogo.tsx`.

### 6.2 Icon Sizes — No Standard

| Size class | px | Context |
|------------|-----|---------|
| `size-3` / `h-3 w-3` | 12px | Badge inline, small loaders |
| `h-3.5 w-3.5` | 14px | Job card metadata, compact actions |
| `size-4` / `h-4 w-4` | 16px | **Default** (button default, most inline) |
| `h-5 w-5` | 20px | TopNav menu, section headers |
| `h-6 w-6` | 24px | — |
| `h-7 w-7` | 28px | Logo icon |
| `h-8 w-8` | 32px | Empty state, page-level loaders |
| `h-10 w-10` | 40px | ResumeUploader loader |

Button component normalizes SVGs to `size-4` unless overridden; many call sites pass explicit sizes anyway.

### 6.3 Icon Inconsistencies

- **Spinner icons**: `Loader2` (dominant), `LoaderCircle` (ProfileJobDashboard), `RefreshCw` (refresh actions) — three icons for loading/refresh.
- **Close icons**: Dialog uses `XIcon`; Sheet uses same — consistent.
- **Check icons**: `CheckIcon` in dropdown/select; `Check` in job board filters — same Lucide icon, different import names.
- Icon stroke width not standardized (Lucide default 2px; no global override).
- Nav icons in SideNav use `h-4 w-4`; MobileNav doesn't specify size (inherits from button).

---

## 7. Buttons

### 7.1 shadcn Button (`components/ui/button.tsx`)

| Variant | Visual |
|---------|--------|
| `default` | `bg-primary text-primary-foreground` |
| `outline` | Border + background hover |
| `secondary` | `bg-secondary` |
| `ghost` | Hover muted only |
| `destructive` | `bg-destructive/10 text-destructive` |
| `link` | Underlined primary text |

| Size | Height | Notes |
|------|--------|-------|
| `default` | 32px (`h-8`) | |
| `xs` | 24px (`h-6`) | |
| `sm` | 28px (`h-7`) | `text-[0.8rem]` |
| `lg` | 36px (`h-9`) | |
| `icon` | 32×32 | |
| `icon-xs/sm/lg` | 24/28/36 | |

Base: `rounded-lg text-sm font-medium ring-3 on focus`.

### 7.2 ProfileButton Wrapper

Maps `primary → default`, adds `font-semibold hover:shadow-sm`.  
Does **not** expose `destructive`, `link`, or size prop passthrough cleanly.

### 7.3 Ad-Hoc Buttons

| Pattern | Where | Issue |
|---------|-------|-------|
| `h-12 rounded-full text-[15px]` | login, signup, create-profile | Pill mega-button, not in CVA |
| Raw `<button>` | ProfileThemeToggle, job board filters | No shared styles |
| `rounded-[20px] border px-4 h-10` | RecommendedJobsSection filters | Google-style chips |
| `wg-dash-compact-btn` | Dashboard CSS class | 36px min-height override |

### 7.4 Button Inconsistencies

- Auth conversion buttons are **48px tall pills**; in-app buttons are **32px rounded rectangles**.
- TopNav passes `className="h-9 w-9"` on `size="icon"` (32px default) — manual override fighting CVA.
- Destructive actions sometimes use `Button variant="destructive"`, sometimes red text links (`text-[#D93025]`).
- Focus ring is `ring-3 ring-ring/50` on buttons but `ring-2` on various custom focus styles.

---

## 8. Inputs

### 8.1 shadcn Primitives

| Component | Height | Padding | Radius |
|-----------|--------|---------|--------|
| Input | `h-8` (32px) | `px-2.5 py-1` | `rounded-lg` |
| Textarea | `min-h-16` | `px-2.5 py-2` | `rounded-lg` |
| Select trigger | `h-8` / `h-7` (sm) | `px-2.5` | `rounded-lg` / smaller for sm |
| Checkbox | `size-4` | — | `rounded-[4px]` |

Input uses `text-base` on mobile, `md:text-sm` on desktop — font size shift at breakpoint.

### 8.2 Custom Input Overrides

| Component | Override |
|-----------|----------|
| GlobalSearch | `h-11 rounded-lg border-slate-200 bg-slate-50/80` (compact: `h-10`) |
| RecommendedJobsSection search | `h-10 rounded-[20px] border-[#DADCE0]` |
| Job board filter inputs | `h-9 rounded-lg border-[#DADCE0]` |
| ExperienceTimeline inline edit | `border-slate-200 text-[11px]` |
| EducationSection inline edit | `border-dashed border-slate-300 text-[11px]` |

### 8.3 Input Inconsistencies

- **4 input heights** in production: 28px (select sm), 32px (default), 36px (job board filter), 40–44px (search bars).
- Border colors: `border-input` (token), `border-slate-200`, `border-[#DADCE0]`, `border-dashed border-slate-300`.
- Focus styles: shadcn uses `ring-3 ring-ring/50`; job board uses `shadow-[0_0_0_3px_#E8F0FE]` + `border-[#1A73E8]`.
- No shared `FormField` / `FormMessage` / error state pattern — errors handled per form.
- Dark mode input background `dark:bg-input/30` won't apply without `.dark` class.

---

## 9. Tables

**No table component exists.** `components/ui/table.tsx` is absent.

Data-dense UIs use alternatives:

| Pattern | Example files |
|---------|---------------|
| `divide-y` list rows | WalletPanel, ProfileSidebar, ActivityTimeline |
| Card grid | JobCard, ApplicationCard, KanbanBoard columns |
| Custom grid | Profile KPI, HomeStatCards |
| `<dl>` definition lists | MetricCard, ProfileCompleteness |

### Table-Related Inconsistencies

- No shared row height, column alignment, or header typography for tabular data.
- `tabular-nums` used inconsistently (KPI values yes, wallet amounts sometimes).
- Sortable column pattern doesn't exist.
- Employer PulseInbox and applications tracker would benefit from a unified row component.

---

## 10. Cards

### 10.1 Four Card Systems

| System | File / class | Border | Shadow | Radius | Accent |
|--------|--------------|--------|--------|--------|--------|
| shadcn Card | `ui/card.tsx` | `ring-1 ring-foreground/10` | None | `rounded-xl` | None |
| Dashboard card | `.wg-dash-section-card` | `1px solid var(--dash-border)` | `--wg-shadow-sm` | 12px | None |
| Profile card | `ProfileCard.tsx` | `border-slate-200` + `border-l-[3px] primary` | `shadow-sm` | 14px | Left accent bar |
| Insight card | `InsightCard.tsx` | Gradient backgrounds | None | `rounded-xl` | Color variant |

### 10.2 Card Padding Variants

- shadcn: `py-4 px-4` built into Card + CardContent
- ProfileCard: padding prop sm/md/lg
- MetricCard: fixed `p-5`
- JobCard: `p-4 sm:p-5`
- InsightCard: `p-4 sm:p-5`

### 10.3 Card Inconsistencies

- **Hover behavior**: dashboard lifts (`translateY(-2px)` + shadow-md); profile lifts shadow only; shadcn cards don't hover.
- **Left accent bar** (3px primary) is profile-only — dashboard JobCard has no equivalent.
- `SkeletonCard` uses `border-slate-200 shadow-sm`; dashboard skeletons use `bg-muted animate-pulse` without border.
- `SectionErrorBoundary` fallback uses hardcoded Google palette card, not any card system.
- `ExpandableCard` (talent intelligence) is a fifth card-like pattern with its own header/body toggle.

---

## 11. Sidebar

### 11.1 Dashboard SideNav

| Property | Value |
|----------|-------|
| Width expanded | 248px (`--dash-sidebar-w`) |
| Width collapsed | 68px |
| Position | `sticky top-[var(--dash-topnav-h)]` |
| Nav item | `min-h-[40px] rounded-lg px-3 py-2 text-[13px]` |
| Active state | `.wg-dash-nav-active` — inset 3px left bar, accent soft bg |
| Group label | `0.6875rem uppercase tracking-[0.06em]` |
| Icons | `h-4 w-4` |

### 11.2 Other Sidebars

| Surface | Width | Style |
|---------|-------|-------|
| EmployerShell aside | `w-52` (208px) | `min-h-[40px] rounded-lg px-3 py-2 text-sm`, active `bg-[var(--wg-red)]/10` |
| ProfileSidebar | Responsive grid column | ProfileCard widgets, sticky `top-[3.75rem]` |
| Mobile Sheet nav | `w-[280px]` | Full SideNav inside Sheet |

### 11.3 Sidebar Inconsistencies

- **Three widths**: 248px, 208px, 280px (mobile sheet).
- **Nav item font size**: 13px (dashboard SideNav) vs `text-sm` (14px, employer).
- **Active indicator**: inset left bar (dashboard) vs background tint (employer) vs `Button variant="secondary"` (VaultNav).
- Collapse behavior only on dashboard SideNav — employer sidebar doesn't collapse.
- Profile sidebar is a widget column, not navigation — naming collision.

---

## 12. Navigation

### 12.1 Navigation Surfaces

| Surface | Type | Height |
|---------|------|--------|
| Dashboard TopNav | Sticky top bar | 56px |
| Dashboard SideNav | Left sidebar | full viewport |
| Dashboard MobileNav | Bottom tab bar (6 cols) | `min-h-[52px]`, `text-[10px]` |
| VaultNav | Horizontal header nav | `h-14` (56px) |
| EmployerShell header | Top bar | `h-14` |
| Profile nav | Via DashboardLayout (shared) | Same as dashboard |

### 12.2 Navigation Inconsistencies

- **Top bar height**: 56px (dashboard CSS) vs `h-14` (employer/vault) — same value, different implementation.
- **Mobile nav label size** `text-[10px]` is below type scale.
- **VaultNav** uses shadcn Button variants for active state; dashboard uses custom CSS class — feels like different products.
- **Command palette** (⌘K) is dashboard-only; no global way to navigate from employer/vault shells.
- Breadcrumbs: **not implemented** anywhere.
- `dashboard-responsive.ts` documents `60px` top nav but CSS uses `56px`.

---

## 13. Dialogs & Modals

### 13.1 Primitives

| Component | Overlay | Content | Default max-width |
|-----------|---------|---------|-------------------|
| Dialog | `bg-black/10 backdrop-blur-xs` | `rounded-xl ring-1 p-4` | `sm:max-w-sm` (384px) |
| Sheet | Same overlay | Side-dependent, `w-3/4 sm:max-w-sm` | 384px (left/right) |

Animation: `zoom-in-95` / `fade-in-0` (100ms duration).

### 13.2 Dialog Usages & Width Overrides

| File | Override |
|------|----------|
| CommandPalette | `sm:max-w-lg p-0` |
| ResumeIntelligenceDialog | `max-w-4xl p-0` |
| AddApplicationDialog | `sm:max-w-lg max-h-[90dvh]` |
| ApplicationConnectDialog | `sm:max-w-lg max-h-[90vh]` |
| ApplicantApplicationPanel | `sm:max-w-xl max-h-[90vh]` |
| ProfileJobDashboard | `sm:max-w-md` |

### 13.3 Modal Inconsistencies

- **6 different max-widths** with no size enum (`sm`, `md`, `lg`, `xl`, `full`).
- Viewport height units mixed: `90vh` vs `90dvh`.
- Some dialogs zero out padding (`p-0`) and manage internally; others use default `p-4`.
- `.wg-modal-enter` CSS animation exists but Dialog uses Tailwind `animate-in` — two animation systems.
- Sheet close button at `top-3 right-3`; Dialog close at `top-2 right-2` — 4px offset difference.
- No shared `ModalHeader` with consistent title/description spacing across features.

---

## 14. Dropdowns

### 14.1 Primitives

| Component | Content style |
|-----------|---------------|
| DropdownMenu | `min-w-[8rem] rounded-lg border bg-popover p-1 shadow-md` |
| Select | `rounded-lg bg-popover shadow-md ring-1 ring-foreground/10` |
| Dropdown sub-content | `shadow-lg` |

Items: `rounded-md px-2 py-1.5 text-sm`.

### 14.2 Custom Dropdowns (not using primitives)

| Component | Implementation |
|-----------|----------------|
| GlobalSearch results | Absolute positioned `div`, `rounded-lg border shadow-xl` |
| RecommendedJobsSection filters | `<details>` + absolute `div`, `rounded-xl border shadow-lg` |
| CommandPalette | Dialog-based, not dropdown |

### 14.3 Dropdown Inconsistencies

- **Shadow escalation arbitrary**: `shadow-md` (radix) vs `shadow-lg` (filters) vs `shadow-xl` (search).
- Custom filter dropdowns use `<details>` HTML element with CSS animation in `globals.css` (`details[data-filter-dropdown]`) — separate from Radix focus management and accessibility patterns.
- Select items use `pl-1.5 pr-8`; dropdown items use `px-2` — different horizontal padding.
- Popover component **not installed** — tooltips and anchored panels are hand-rolled.
- DropdownMenu uses `border`; Select content uses `ring-1` — border treatment differs.

---

## 15. Loading States

### 15.1 Skeleton Patterns

| Implementation | Where |
|----------------|-------|
| `ui/skeleton` — `animate-pulse rounded-md bg-muted` | Most skeleton UIs |
| `wg-skeleton-shimmer` — gradient animation | Defined in globals, **rarely used** |
| `wg-dash-skeleton-pulse` — opacity pulse | Defined in dashboard CSS, **never referenced** |
| Raw `div.animate-pulse.bg-muted` | HomeDashboard StatCardsSkeleton |
| Inline skeleton blocks | RecommendedJobsSection job cards |

### 15.2 Spinner Patterns

| Icon | Size range | Color |
|------|------------|-------|
| Loader2 | 12–40px | `text-muted-foreground`, `text-primary`, `text-[#8E8E93]`, `text-[#1A73E8]`, `text-emerald-700` |
| LoaderCircle | 14px | ProfileJobDashboard only |
| RefreshCw | 14–16px | Refresh buttons with conditional spin |

### 15.3 Loading Inconsistencies

- **No `Spinner` or `LoadingOverlay` component** — 20+ inline implementations.
- Spinner colors tied to context, not tokens — breaks in dark mode.
- Page-level loading: some center `h-8 w-8`, some `h-10 w-10`, some show skeleton layout.
- `ProfileSaveStatus` spinner is green (`text-emerald-700`) while saving — implies success during load.
- Button loading pattern inconsistent: some replace label with spinner, some prepend `mr-2`, some use absolute positioning.
- `ResumeUploader` uses oversized `h-10 w-10` spinner; forms use `h-4 w-4`.

---

## 16. Cross-Cutting Inconsistency Index

### Critical (fix before any redesign)

1. **Dual dark mode** — `data-theme` vs `.dark`; shadcn dark variants broken on profile theme path.
2. **Google palette in job board** — largest user-facing surface uses non-brand colors.
3. **Layout constant drift** — `dashboard-responsive.ts` vs `dashboard-layout.css` dimensions conflict.
4. **Primary color in dark mode** — blue (`#8AB4F8`) vs coral (`#F87171`) vs white (shadcn).
5. **TypeScript design tokens unused** — `WG_COLORS`, `WG_SPACING`, `WG_TYPOGRAPHY`, `WG_SHADOW.lg` dead code.

### High (systemic debt)

6. Four card systems with different border/shadow/radius.
7. Input height chaos (32px default vs 40–44px search).
8. Button personality split (pill auth vs compact app).
9. Three badge systems (ui Badge, ProfileBadge, ad-hoc spans).
10. Two SectionHeader components (design-system vs profile primitives).
11. Nav active states differ per shell.
12. Dialog width/height not standardized.
13. Success/warning colors differ globals vs profile.
14. Border color fragmentation (4+ values).
15. Typography off-scale (10px, 11px, 13px, 15px, 17px, 18px arbitrary sizes).
16. `slate-*` vs CSS variable text colors in same views.
17. No table primitive for data-heavy views.

### Medium

18. Icon/spinner not standardized.
19. Shadow/elevation language undefined.
20. Letter-spacing for labels has 5 values.
21. Radius 12px vs 14px used interchangeably for "medium".
22. Orphan `styles.css` purple theme.
23. `wg-dash-skeleton-pulse` and `wg-skeleton-shimmer` unused.
24. Focus ring weight varies (`ring-2` vs `ring-3`).
25. Card title font-weight cascade conflict (medium vs semibold).
26. Touch target rule covers buttons but not inputs.
27. Custom `<details>` dropdowns bypass Radix a11y.
28. Missing shadcn primitives: Table, Popover, Tooltip, Switch, Accordion.
29. `Checkbox` used as dark mode toggle (semantic mismatch).
30. Animation classes proliferate (`wg-*` 15+ keyframe utilities).
31. `card-description` color overridden to `--wg-color-text-secondary` while component says `text-muted-foreground`.
32. Employer shell sidebar width doesn't match dashboard.
33. Mobile nav 10px labels below readable floor.
34. `index.html` static landing has inline CSS duplicating tokens.
35. Email templates (`workgraph-mail.ts`) may drift from app tokens.

### Low

36. WorkGraphLogo wordmark at 17px off-scale.
37. Checkbox `rounded-[4px]` vs everything else rounded-lg+.
38. Badge `rounded-4xl` pill vs chip `rounded-md` — shape language mixed.
39. `dashClasses.sectionCard` redundant radius classes.
40. Import alias inconsistency (`Check` vs `CheckIcon`).
41. Profile sidebar `top-[3.75rem]` hardcoded vs `--dash-topnav-h`.
42. Chart colors use oklch grayscale — may not match brand.

---

## 17. File Reference Map

### Token & theme sources
- `app/globals.css` — primary CSS variables, shadcn theme, animations
- `lib/design-tokens.ts` — TS tokens (mostly unused)
- `lib/dashboard-responsive.ts` — layout constants (conflicts with CSS)
- `components/dashboard/layout/dashboard-layout.css` — dashboard shell
- `components/profile/profile-theme.css` — profile shell overrides
- `tailwind.config.ts` — empty `theme.extend` (Tailwind v4 defers to CSS)
- `styles.css` — orphaned legacy theme

### UI primitives (`components/ui/`)
`alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`, `toaster`

### Design-system layer (`components/design-system/`)
`PageHero`, `MetricCard`, `MiniChart`, `SectionHeader`, `EmptyState`, `InsightCard`, `JobCard`, `ActivityTimeline`, `CommandPalette`

### Profile primitives (`components/profile/primitives/`)
`ProfileCard`, `ProfileButton`, `ProfileBadge`, `SectionHeader`, `Skeleton`, `CircularProgress`

### Layout shells
- `components/dashboard/layout/DashboardLayout.tsx`
- `components/profile/premium/ProfileShell.tsx`
- `components/employer/EmployerShell.tsx`
- `app/interview-vault/layout.tsx`

### Highest-inconsistency files (priority review)
1. `components/profile/RecommendedJobsSection.tsx` — Google palette, custom everything
2. `components/profile/ProfileJobDashboard.tsx` — mixed Google + slate + dashboard
3. `components/dashboard/layout/GlobalSearch.tsx` — slate overrides on shadcn Input
4. `components/profile/primitives/ProfileCard.tsx` — slate borders on shadcn Card
5. `components/shared/SectionErrorBoundary.tsx` — hardcoded non-brand error UI
6. `lib/dashboard-responsive.ts` — conflicts with CSS layout vars
7. `components/profile/theme/ProfileThemeProvider.tsx` — dark mode doesn't sync `.dark`

---

## 18. Recommended Unification Targets (Audit Only)

*No redesign proposed — these are the consolidation targets a redesign should address first.*

| Priority | Target | Action |
|----------|--------|--------|
| P0 | Single theme provider | Merge `data-theme` + `.dark`; one dark palette |
| P0 | Color tokens | Deprecate Google hex; map all surfaces to `--wg-*` / shadcn |
| P0 | Layout constants | One source of truth for nav height, sidebar width, content max |
| P1 | Card primitive | One `Card` with variants: `default`, `dashboard`, `profile` |
| P1 | Type scale | Enforce 12/14/16/18/24/30/36px; ban arbitrary `text-[Npx]` |
| P1 | Input scale | `sm` (32), `default` (40), `lg` (44) with tokenized focus |
| P1 | Button scale | Keep auth pill as explicit `size="cta"` variant, not one-off classes |
| P2 | Badge taxonomy | Merge ProfileBadge tones into ui Badge variants |
| P2 | Spinner component | `<Spinner size="sm|md|lg" />` with token color |
| P2 | Dialog sizes | `dialog-sm`, `dialog-md`, `dialog-lg`, `dialog-xl` presets |
| P2 | Table primitive | Add shadcn Table for wallet, inbox, applications |
| P3 | Delete dead code | `styles.css`, unused TS tokens, orphan animations |
| P3 | Missing primitives | Popover, Tooltip, Switch |

---

## 19. Metrics Summary

| Category | Defined tokens | Ad-hoc values found | Consistency score |
|----------|---------------|---------------------|-------------------|
| Colors | 15 CSS vars + 10 TS | 50+ unique hex codes | **35%** |
| Font sizes | 5-step scale (unused) | 12+ arbitrary sizes | **40%** |
| Font weights | 4 weights | Mostly consistent | **75%** |
| Border radius | 7 tokens | 8+ patterns | **45%** |
| Shadows | 3 tokens | 4+ Tailwind classes | **50%** |
| Spacing | 8px grid (unused) | Tailwind ad hoc | **55%** |
| Icons | Lucide only | 6+ sizes | **60%** |
| Buttons | 6 variants × 8 sizes | 3+ custom patterns | **55%** |
| Inputs | 1 primitive | 4 heights, 3 border styles | **40%** |
| Tables | 0 | List/card patterns | **N/A** |
| Cards | 4 systems | — | **30%** |
| Sidebar | 3 implementations | — | **40%** |
| Navigation | 5 surfaces | 3 active styles | **45%** |
| Dialogs | 1 primitive | 6 width overrides | **50%** |
| Dropdowns | 2 primitives + custom | 3 shadow levels | **45%** |
| Loading | 1 skeleton | 3 spinner icons, 4 patterns | **35%** |

**Overall design system maturity: ~45%** — strong foundation (shadcn + brand identity), weak enforcement (tokens defined but bypassed in major surfaces).

---

*End of audit. No application files were modified. This document is the sole deliverable.*
