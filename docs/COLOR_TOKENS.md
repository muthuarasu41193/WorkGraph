# WorkGraph Color Tokens

**Version:** 2.0  
**Source of truth:** `app/colors.css`  
**TypeScript mirror:** `lib/tokens/colors.ts`

WorkGraph uses a restrained, enterprise palette. Neutrals carry most of the UI. Brand burgundy (`#B91C1C`) — the WorkGraph logo color — marks signal and primary action. Semantic colors are muted and never used decoratively. **No bright AI-style gradients.**

---

## Philosophy

| Principle | Rule |
|-----------|------|
| **Professional** | Cool neutral surfaces, crisp borders, high legibility |
| **Premium** | Subtle washes, not saturated fills |
| **Data-driven** | Chart palette is neutral-first; brand red highlights one series max |
| **Enterprise** | Semantic colors are desaturated; distinct from consumer apps |
| **Minimal** | Max 3 non-neutral colors per component |

---

## Token anatomy

Each semantic color group exposes up to eight roles:

| Role | CSS suffix | Use |
|------|------------|-----|
| **Default** | *(none)* | Icon, border, or text in default state |
| **Hover** | `-hover` | Pointer hover on filled controls |
| **Pressed** | `-pressed` | Active / mouse-down state |
| **Selected** | `-selected` | Selected row, tab, or chip background |
| **Disabled** | `-disabled` | Muted fill when control is disabled |
| **Subtle** | `-subtle` | Background wash (badges, alerts, nav active) |
| **Foreground** | `-foreground` | Text on subtle backgrounds |
| **Border** | `-border` | Semantic border tint (badges, outlined alerts) |

Brand/accent additionally defines `--accent-muted` (focus ring wash) and `--accent-foreground` (text on brand fills).

---

## Surfaces

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--surface-page` | `#F7F8FA` | `#0C0E12` | App shell background |
| `--surface-primary` | `#FFFFFF` | `#14171D` | Cards, panels, inputs, popovers |
| `--surface-secondary` | `#EEF0F3` | `#1C2028` | Muted fills, table stripes, secondary buttons |
| `--surface-elevated` | `#FFFFFF` | `#181C24` | Floating layers at rest |
| `--surface-overlay` | `rgba(255,255,255,0.92)` | `rgba(12,14,18,0.94)` | Sticky headers, modal scrims |
| `--surface-inverse` | `#111318` | `#F7F8FA` | Inverse tooltips, contrast blocks |
| `--surface-disabled` | `#EEF0F3` | `#1C2028` | Disabled input / control backgrounds |

**Tailwind:** `bg-surface-page`, `bg-surface-primary`, `bg-surface-secondary`, `bg-surface-elevated`, `bg-surface-disabled`

---

## Text

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--text-primary` | `#111318` | `#F0F2F5` | Headings, body, labels |
| `--text-secondary` | `#4B5563` | `#9CA3AF` | Descriptions, metadata |
| `--text-tertiary` | `#8B939E` | `#6B7280` | Placeholders, timestamps, hints |
| `--text-inverse` | `#F7F8FA` | `#111318` | Text on dark / inverse surfaces |
| `--text-disabled` | `#B8BFC8` | `#4B5563` | Disabled control labels |
| `--text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on brand-filled buttons |

**Tailwind:** `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `text-text-disabled`

---

## Borders

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--border-default` | `#E2E5EB` | `rgba(255,255,255,0.08)` | Card, input, and divider borders |
| `--border-muted` | `#EEF0F3` | `rgba(255,255,255,0.05)` | Low-emphasis separators |
| `--border-strong` | `#C8CDD6` | `rgba(255,255,255,0.14)` | Emphasized dividers, hover borders |
| `--border-focus` | `#B91C1C` | `#D43D52` | Input focus border (with focus ring) |

---

## Brand / accent

Matches the **WorkGraph logo** (`WorkGraphMark` uses `var(--accent)`).

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--accent` | `#B91C1C` | `#D43D52` | Primary buttons, logo mark, key metrics |
| `--accent-hover` | `#9A1818` | `#E85468` | Hover on brand-filled controls |
| `--accent-pressed` | `#7F1414` | `#C42D42` | Active / pressed brand controls |
| `--accent-selected` | `rgba(185,28,28,0.08)` | `rgba(212,61,82,0.14)` | Selected nav item background |
| `--accent-disabled` | `#D4A0A0` | `#6B3A42` | Disabled brand controls |
| `--accent-subtle` | `rgba(185,28,28,0.06)` | `rgba(212,61,82,0.10)` | Light brand wash |
| `--accent-muted` | `rgba(185,28,28,0.12)` | `rgba(212,61,82,0.22)` | Focus ring wash |
| `--accent-foreground` | `#FFFFFF` | `#FFFFFF` | Label on brand-filled buttons |

---

## Success

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--success` | `#146B4A` | `#3D9B74` | Icons, borders, solid indicators |
| `--success-hover` | `#105A3E` | `#4DB088` | Hover on success actions |
| `--success-pressed` | `#0D4933` | `#348A66` | Pressed success actions |
| `--success-selected` | `rgba(20,107,74,0.08)` | `rgba(61,155,116,0.14)` | Selected success context |
| `--success-disabled` | `#8FB8A8` | `#2A5C48` | Disabled success controls |
| `--success-subtle` | `#E6F2ED` | `rgba(61,155,116,0.12)` | Success alert / badge background |
| `--success-foreground` | `#105A3E` | `#A7E0C8` | Text on success-subtle |
| `--success-border` | `rgba(20,107,74,0.22)` | `rgba(61,155,116,0.28)` | Outlined success badges |

---

## Warning

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--warning` | `#8A5C00` | `#C9A227` | Icons, borders |
| `--warning-hover` | `#704B00` | `#DBB43A` | Hover on warning actions |
| `--warning-pressed` | `#5C3D00` | `#B08F1F` | Pressed warning actions |
| `--warning-selected` | `rgba(138,92,0,0.08)` | `rgba(201,162,39,0.14)` | Selected warning context |
| `--warning-disabled` | `#C4B48A` | `#6B5A28` | Disabled warning controls |
| `--warning-subtle` | `#F5F0E4` | `rgba(201,162,39,0.12)` | Warning alert background |
| `--warning-foreground` | `#704B00` | `#F5E6A8` | Text on warning-subtle |
| `--warning-border` | `rgba(138,92,0,0.22)` | `rgba(201,162,39,0.28)` | Outlined warning badges |

---

## Error

`--error-*` tokens are aliases of `--danger-*`.

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--danger` / `--error` | `#B42318` | `#E05243` | Error icons, destructive buttons |
| `--danger-hover` / `--error-hover` | `#912018` | `#EC6A5D` | Hover on destructive controls |
| `--danger-pressed` / `--error-pressed` | `#791A16` | `#C94438` | Pressed destructive controls |
| `--danger-selected` / `--error-selected` | `rgba(180,35,24,0.08)` | `rgba(224,82,67,0.14)` | Selected error context |
| `--danger-disabled` / `--error-disabled` | `#D4A09A` | `#6B3A36` | Disabled destructive controls |
| `--danger-subtle` / `--error-subtle` | `#FCF0EF` | `rgba(224,82,67,0.12)` | Error alert background |
| `--danger-foreground` / `--error-foreground` | `#912018` | `#FCCBC6` | Text on error-subtle |
| `--danger-border` / `--error-border` | `rgba(180,35,24,0.22)` | `rgba(224,82,67,0.28)` | Outlined error badges |

**Note:** Error red is distinct from brand burgundy.

---

## Information

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--info` | `#2B5F8A` | `#5A8FC4` | Info icons, links |
| `--info-hover` | `#234D71` | `#6DA3D6` | Hover on info actions |
| `--info-pressed` | `#1C3E5A` | `#4A7DB0` | Pressed info actions |
| `--info-selected` | `rgba(43,95,138,0.08)` | `rgba(90,143,196,0.14)` | Selected info context |
| `--info-disabled` | `#94ADC4` | `#3A5570` | Disabled info controls |
| `--info-subtle` | `#EBF1F7` | `rgba(90,143,196,0.12)` | Info alert background |
| `--info-foreground` | `#234D71` | `#C5DDF5` | Text on info-subtle |
| `--info-border` | `rgba(43,95,138,0.22)` | `rgba(90,143,196,0.28)` | Outlined info badges |

---

## Interactive (neutral)

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--interactive-hover` | `#EEF0F3` | `#1C2028` | Row / menu item hover background |
| `--interactive-pressed` | `#E2E5EB` | `#252A34` | Pressed neutral control |
| `--interactive-selected` | `rgba(185,28,28,0.06)` | `rgba(212,61,82,0.10)` | Subtle brand-tinted selection |
| `--interactive-disabled` | `#EEF0F3` | `#1C2028` | Disabled neutral control fill |
| `--interactive-hover-foreground` | `#111318` | `#F0F2F5` | Text on interactive hover |

**shadcn note:** Tailwind `bg-accent` maps to `--interactive-hover` (not brand). Use `bg-primary` for brand fills.

---

## Focus

| Token | Light | Dark | When to use |
|-------|-------|------|-------------|
| `--focus-ring-color` | `#B91C1C` | `#D43D52` | Focus ring stroke |
| `--focus-ring-offset-color` | `#FFFFFF` | `#14171D` | Gap between control and ring |
| `--focus-ring-width` | `2px` | `2px` | Ring thickness |
| `--focus-ring-offset` | `2px` | `2px` | Ring offset from control |
| `--focus-ring` | composite | composite | Box-shadow shorthand |

---

## Opacity

| Token | Value | When to use |
|-------|-------|-------------|
| `--opacity-disabled` | `0.45` | Disabled control content |
| `--opacity-muted` | `0.72` | Skeleton pulse, de-emphasized overlays |
| `--opacity-overlay` | `0.08` | Subtle scrims |
| `--opacity-backdrop` | `0.88` | Modal backdrop density reference |

---

## Charts

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--chart-1` | `#111318` | `#F0F2F5` | Primary series |
| `--chart-2` | `#4B5563` | `#9CA3AF` | Secondary series |
| `--chart-3` | `#8B939E` | `#6B7280` | Tertiary series |
| `--chart-4` | `#B91C1C` | `#D43D52` | Highlight / brand series (one max) |
| `--chart-5` | `#C8CDD6` | `#4B5563` | Baseline / comparison |

---

## Usage rules

1. No hex in components — reference CSS variables or Tailwind semantic classes only  
2. No decorative gradients in application UI  
3. Brand red ≠ error red — `--accent` for primary; `--danger` for destructive  
4. State requires more than color — pair semantic color with icon or label  
5. Dark mode preserves semantics — same token names, different values  
6. Disabled — combine `--opacity-disabled` with `--text-disabled` / `--surface-disabled`

---

## File reference

| File | Purpose |
|------|---------|
| `app/colors.css` | CSS variable definitions (light + dark) |
| `app/tokens.css` | Imports colors; non-color tokens |
| `app/globals.css` | Tailwind `@theme` color mappings |
| `lib/tokens/colors.ts` | TypeScript exports for charts, emails, tests |

---

*WorkGraph Color Tokens v2.0 — every token documented.*
