# WorkGraph UI inventory

**Date:** 23 October 2026
**Scope:** The Next.js app as it exists on `main` before the Group A foundation rebuild. Nothing in the product was changed to produce this map.
**Method:** Read the stylesheet and token entry points, listed every `components/**/*.tsx` module, and checked which of those modules are imported by another source file.

This is a map, not a redesign. Group A (art direction, tokens, type, primitives, product composites) starts from here.

## How styling actually reaches the screen

Tailwind CSS v4 is loaded from `app/globals.css` (`@import "tailwindcss"`). `tailwind.config.ts` is **not referenced** by PostCSS or by an `@config` directive, so its `theme.extend.colors` palette does not generate utilities. The live theme is the `@theme inline` block at the bottom of `app/globals.css`, which points Tailwind color names at CSS variables defined in `app/colors.css`.

There are three copies of the same red/slate palette, and they are free to drift:

| Location | What it holds | Used at runtime? |
|---|---|---|
| `app/colors.css` | `--wg-brand-*`, `--wg-slate-*`, semantic `--wg-*` aliases, light and dark | Yes. Imported first from `globals.css`. |
| `app/globals.css` `@theme inline` | Maps those variables to `bg-brand`, `text-fg-primary`, `bg-surface`, shadcn names (`background`, `primary`, `muted`, …) | Yes. This is what Tailwind emits. |
| `tailwind.config.ts` | The same hex values again, plus font, spacing, radius, shadow, motion | No. Dead config under Tailwind v4. |
| `lib/design-tokens.ts` `WG_COLORS` | The same hex values a fourth time, for charts, email HTML, and SVG strokes | Yes, but only where JS needs a literal color. |

Dark mode is a class plus an attribute. `components/theme/ThemeScript.tsx` runs before paint and sets `class="dark"` and `data-theme="light|dark"` from `localStorage` (`wg-theme`, falling back to `wg-profile-theme`) or `prefers-color-scheme`. `components/theme/ThemeProvider.tsx` only stores `light` or `dark`. There is no persisted `system` choice: once a preference is saved, the media query is no longer consulted. `components/profile/theme/ProfileThemeProvider.tsx` is a re-export of the same provider, not a second theme.

## Design tokens that exist today

**Color.** Brand red `#E11D2E` (logo 600) on a slate scale (`#F8FAFC` through `#020617`). Semantic aliases: primary, text primary/secondary/tertiary, surface, border, success `#10B981`, warning `#F59E0B`, info `#3B82F6`, error (the brand red). Dark mode redefines the semantic aliases and uses `rgb(... / alpha)` washes. Shadcn variables (`--background`, `--card`, `--primary`, `--destructive`, `--sidebar`, `--chart-*`) alias the same values.

**Type.** Plus Jakarta Sans is loaded with `next/font` but stored in `--font-inter`. JetBrains Mono is `--font-jetbrains`. Both are preloaded. The scale in `app/typography.css` and `@theme` is a fixed set of sizes (12, 13, 14, 15, 17, 20, 24, 30px), not a modular ratio. Roles exist only as utility class strings inside `WG_TYPOGRAPHY` (`display`, `heading`, `title`, `body`, `caption`). Components still set `text-[13px]`, `text-[14px]`, `text-[17px]` directly. Body copy is 14px (`0.875rem`), under the 16px floor that avoids iOS zoom-on-focus.

**Spacing.** `app/spacing.css` documents a 4px habit and a few layout classes (`.wg-page`, `.wg-section`). `tailwind.config.ts` tries to override the spacing scale and is ignored, so the app uses Tailwind’s default 4px scale (`p-2.5`, `gap-1.5`, `px-2`, …).

**Radius.** Four tokens, and they disagree: `tailwind.config.ts` says sm 6 / md 8 / lg 12 / xl 16; `app/spacing.css` says sm 6 / md 8 / lg 10 / xl 14. The CSS file wins. Badges use `rounded-4xl` (2rem, a pill). Job chips use `rounded-[6px]`.

**Shadow.** Six levels in `app/shadows.css` (`xs`, `sm`, default, `md`, `lg`, `brand`), all soft slate or red glows. Cards lift on hover (`.wg-motion-card`, `WG_CARD`, `WG_MOTION.card`).

**Motion.** One duration (`--wg-duration: 150ms`) and one ease. Components also hardcode `duration-150`, `duration-200`, `0.2s`, `0.35s`, and infinite pulses (`.wg-matched-live-pulse`, `.wg-new-badge-pulse`). `globals.css` focus ring is a hardcoded `#ef4444`.

**Z-index.** Magic numbers: toast `z-[100]`, filter bar `z-index: 9`, no named layers.

## Component catalog

194 TSX modules under `components/`. Grouped by directory. “Live” means at least one other source file imports the module.

### Primitives — `components/ui/` (live unless noted)

`alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `icon`, `input`, `label`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`, `toaster`, `AnimatedNumber`, `BackToTop`, `Logo`, `ScrollProgress`.

These are shadcn-style wrappers on the `radix-ui` package. Missing from this set, and required by the foundation: IconButton, Combobox, MultiSelect, RadioGroup, Switch, Slider, RangeSlider, DatePicker, Drawer, Popover, Tooltip, Accordion, Pagination, Breadcrumb, Table. Toast exists as `toaster.tsx` plus `hooks/use-toast.ts`, not as a self-contained primitive with every state.

`button.tsx` already has a loading spinner and several variants, but sizes go down to 24px (`size-6`, `h-6`), focus uses `ring-red-500`, and `className` can override color. Touch targets are opt-in via `.wg-touch-target`, not guaranteed.

### Product and feature UI

| Directory | Role |
|---|---|
| `components/design-system/` | Live composites: `JobCard`, `JobApplyButton`, `EmptyState`, `MetricCard`, `InsightCard`, `CommandPalette`, `ActivityTimeline`, `PageHero`, `SectionHeader`, `MiniChart`, `ApplyFollowupPrompt`. `JobCard` is the feed row used by the home matches list and `RecommendedJobsSection`. |
| `components/dashboard/` | Authenticated home and shell: `DashboardLayout`, `SideNav`, `TopNav`, `MobileNav`, `GlobalSearch`, home sections. |
| `components/applications/` | Tracker: `ApplicationsTracker`, `KanbanBoard`, `ApplicationCard`, `ApplicationDetailDrawer`, `AddApplicationDialog`. |
| `components/profile/` | Profile editor, job list (`RecommendedJobsSection`, `ProfileJobsView`), premium profile sections, and a second primitive set. |
| `components/profile/primitives/` | `ProfileButton`, `ProfileCard`, `ProfileBadge`, `SectionHeader`, `Skeleton`, `CircularProgress`. These wrap or restyle `components/ui` instead of being the only primitives. |
| `components/talent-intelligence/` | Resume intelligence dialog and score sections, plus `ScoreRing` and `ExpandableCard`. |
| `components/vault/`, `components/wallet/` | Interview Vault and wallet. |
| `components/employer/` | Employer shell, signals, verification, seeker direct-apply. |
| `components/hidden-discovery/` | Hidden jobs discovery. |
| `components/sections/` | **Live marketing homepage** (`app/page.tsx`): Hero, StatsBar, Features, HowItWorks, InterviewVault, Testimonials, Pricing, Contact. |
| `components/landing/` | A second marketing kit. Only `SectionSkeleton` is imported. `ThemeToggle` here is separate from `components/theme`. |
| `components/layout/` | `Navbar`, `Footer`, `PageShell`, `AnnouncementBar`, `SiteHeader`. |
| `components/auth/`, `components/consent/`, `components/brand/`, `components/community/`, `components/legal/`, `components/settings/`, `components/cover-letters/`, `components/resume/`, `components/seo/` | Feature shells and chrome. |

### App routes that render UI

Marketing and account: `/`, `/login`, `/signup`, `/reset-password`, `/waitlist`, `/upload`, `/create-profile`, `/legal/*`, `/company/[slug]`.

Signed-in: `app/(dashboard)/home`, `app/(dashboard)/applications`, `app/(dashboard)/profile`, `app/profile`, `app/discovery`, `app/interview-vault/*`.

Employer: `app/employer/(public)/*`, `app/employer/(workspace)/*`.

There is **no** `app/(app)/jobs` feed and **no** `app/(app)/jobs/[id]` detail route yet. The job list people actually see is `RecommendedJobsSection` (profile jobs view) and the five-row `HomeJobMatchesSection`. A job “detail” is an expanded card or a mobile overlay inside `RecommendedJobsSection`, not its own page.

## What is hardcoded

Raw Tailwind palette classes (`slate`, `gray`, `red`, `emerald`, `amber`, `blue`, `white`, `black`, and the rest) appear in about 100 TSX/TS files. The densest are:

- `components/profile/RecommendedJobsSection.tsx` (the live job list)
- `components/profile/ProfileJobDashboard.tsx`, `ProfileSocialJobPosts.tsx`, `EducationSection.tsx`, `ExperienceTimeline.tsx`, `SkillsSection.tsx`
- `components/sections/Hero.tsx`, `HowItWorks.tsx`, `InterviewVault.tsx`, `Pricing.tsx`
- `components/layout/Navbar.tsx`, `Footer.tsx`
- `components/dashboard/layout/TopNav.tsx`, `GlobalSearch.tsx`
- `components/design-system/JobCard.tsx` (`text-slate-*`, `bg-emerald-50`, `border-red-100`, `text-[11px]`, `text-[13px]`, `text-[14px]`, `rounded-[6px]`)
- `components/ui/button.tsx`, `toaster.tsx`, `lib/focus-ring.ts` (`ring-red-500`)

Hex and `rgb()` outside the token files:

- `components/dashboard/layout/sidenav.css` — sidebar chrome written as slate and red hex, including its own focus ring `#ef4444`
- `components/design-system/job-card.css`, `components/hidden-discovery/hidden-opportunity-card.css`
- `app/button.css` focus ring `#ef4444`, `app/globals.css` focus ring `#ef4444`, `app/shadows.css` shadow ink as `rgb()`
- `components/brand/brand-icons.tsx`, `SourceBadge.tsx`, `BrandLogo.tsx`, `components/icons/RedditLogo.tsx` — trademark logo fills
- `app/opengraph-image.tsx` and `lib/email/workgraph-mail.ts` — environments that cannot read CSS variables
- `components/sections/Hero.tsx` — decorative window dots `#FF5F57`, `#FFBD2E`, `#28CA41`
- `styles.css` — unimported legacy stylesheet, still full of hex and `rgb()`

Arbitrary type sizes (`text-[13px]`, `text-[14px]`, `text-[17px]`, `text-[11.5px]`) are concentrated on the job card, the home heading, and the sidenav.

## Where styling is duplicated

- **Four button implementations:** `components/ui/button.tsx`, `components/profile/primitives/ProfileButton.tsx`, `.wg-btn*` in `app/button.css`, and the `WG_BUTTON` class strings in `lib/design-tokens.ts`.
- **Three cards:** `components/ui/card.tsx`, `ProfileCard`, and `WG_CARD` / `.job-card`.
- **Two skeletons, two badges, two section headers** (ui vs profile primitives vs design-system `SectionHeader`).
- **Two marketing homepages:** `components/sections/*` is what `/` renders. `components/landing/{Hero,Features,HowItWorks,Testimonials,Cta,LandingNav}Section.tsx` is an unused parallel.
- **Two focus rings** (`lib/focus-ring.ts` and the global `*:focus-visible` rule in `globals.css`) plus a third copied into `sidenav.css` and `button.css`.
- **Color literals repeated** in `colors.css`, `tailwind.config.ts`, and `lib/design-tokens.ts`.
- **Hover lift** is specified twice: `WG_MOTION.card` / `WG_CARD` and `.wg-motion-card` in `app/motion.css`.

## Components nothing imports

Confirmed by searching other `.ts` / `.tsx` files for an import of the module. These are not deleted in this inventory; they are listed so later prompts do not treat them as the source of truth.

**Unused marketing kit** (`components/landing/`): `CtaSection`, `FeaturesSection`, `HeroSection`, `HowItWorksSection`, `LandingNav`, `TestimonialsSection`. `SectionSkeleton` and the landing `ThemeToggle` / `AnnouncementBar` were not in this unused set.

**Unused home sections:** `HomeActivitySection`, `HomeChartsSection`, `HomeIntelligenceGrid`, `HomeJobMarketPulse`, `HomeVaultStatsSection`. The live home is welcome, stat cards, hidden-jobs feed, and job matches. `DashboardTabs` is also unimported.

**Unused profile editors** (superseded by the premium profile and `ProfileJobsView`, but still in the tree): `ATSScoreCard`, `EducationSection`, `ExperienceTimeline`, `LinksSection`, `ProfileHeader`, `ProfileQuickActions`, `ProfileSocialJobPosts`, `ProfileTopBar`.

**Unused premium profile pieces:** `ProfileActivity`, `ProfileAiInsights`, `ProfileCompleteness`, `ProfileJobMatches`, `ProfileSidebar`.

**Other:** `HiddenDiscoveryPromoCard`, `SectionErrorBoundary`.

`styles.css` and `script.js` at the repo root are not imported by the Next.js app.

## What this means for Group A

The app already has a partial token layer and a real job card. It does not have one color vocabulary, one type scale, one button, or a theme choice that includes system. Raw `slate` / `red` / `emerald` classes and hex in CSS will keep ignoring whatever `tailwind.config.ts` says until the Tailwind v4 theme is the only palette and those literals are removed.

The surfaces a later screenshot can honestly call “the job feed” and “a job detail” are `RecommendedJobsSection` and its expanded row, plus `HomeJobMatchesSection`. There is no standalone job detail route to reshoot.
