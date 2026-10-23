# WorkGraph art direction

**Date:** 23 October 2026
**Status:** Default chosen and being built. The owner asked this run to implement Group A without pausing for a separate approval. **Ledger is the default.** Signal Desk and Field Guide are recorded in full so a later pass can switch the token file without inventing a new visual argument.

The audience this has to serve: people looking for work, many recently laid off or displaced by AI, many outside the US, often on a mid-range Android phone in daylight. They are stressed, they have been overpromised by AI tools, and they are leaving LinkedIn because it feels like performative work. The interface should feel like a good reference book or a well-made financial dashboard: calm, factual, fast, adult.

## What we will not do

These apply to every direction, including the one we build.

- No purple or indigo gradient hero, and no gradient used as decoration.
- No identical rounded cards with the same soft grey shadow for every content type. A job, a warning, a stat, and a paragraph do not share a shape.
- No all-caps tracked-out eyebrow labels.
- No single word of a headline set in a second color.
- No accent chosen because SaaS products in 2026 use it. Every color below earns its place by how it reads for this audience.
- No hover that moves a row. Scanning surfaces stay still.
- No pill radius on cards, inputs, and buttons alike.
- No red dot, badge pulse, or counter animation used to pull someone back. Freshness and trust are sentences, not dots.
- No dark-pattern chrome: fake scarcity, countdown, pre-checked consent, confirmshaming.

---

## 1. Ledger (default)

### Concept

A bound reference ledger. The page is warm paper, the type is a serif for titles and a plain civic sans for everything you scan, and structure comes from hairline rules rather than from floating cards. The existing WorkGraph mark stays a deep oxide red, used only for the one action that leaves the product (apply) and for focus. Everything else is ink on paper.

### Why this audience

People in this situation are reading carefully and quickly, often tired, often on a cheap screen in the sun. Warm paper is calmer than LinkedIn blue and less like the last AI tool that greeted them with a purple glow. A serif title reads as a document, which is what a job posting is. A civic sans (Public Sans, drawn for government interfaces) stays legible at 14–16px on a mid-range Android, which a thin geometric sans does not. Oxide red is kept because the mark already exists and because a single serious red, used rarely, reads as a stamp in a ledger rather than as an alarm painted on every button.

### What it deliberately rejects

The cold gray SaaS dashboard, the “friendly” rounded consumer app, and the startup habit of turning the brand color into the background of the product. It also rejects a pure newspaper: we still need buttons, filters, and a match score, so it is a ledger with instruments, not a broadsheet.

### Palette

| Token | Hex | Role |
|---|---|---|
| `surface` | `#F4F1EA` | Page paper. The default background. |
| `surface-raised` | `#FBF8F2` | Sheets that sit on the page: inputs, dialogs, the job row. |
| `surface-sunken` | `#E7E2D6` | Wells: filter chips at rest, skeleton, code, pressed surface. |
| `ink` | `#1A1714` | Primary text. About 15.8:1 on `surface`. |
| `ink-muted` | `#5C564C` | Secondary text, metadata. Above 4.5:1 on `surface`. |
| `ink-subtle` | `#6E675C` | Captions and placeholders. 4.95:1 on `surface`, the floor for small text. |
| `hairline` | `#D5D0C4` | Rules, input borders, row dividers. 1px. |
| `accent` | `#8E2E2E` | The stamp. Primary actions and the focus ring. 7.7:1 against `accent-ink`. |
| `accent-ink` | `#FBF8F2` | Text and icons on `accent`. |
| `positive` | `#1B6B43` | Met requirement, verified, saved confirmation. |
| `caution` | `#8A5A10` | Thin data, stale-but-not-dead, “read this”. Not an error. |
| `danger` | `#9B2C2C` | Destructive actions and genuine failures. Distinct from `accent` by never being a button fill for a safe action. |
| `accent-wash` | `#F6E6E4` | Background behind an accent-tinted selection. |
| `positive-wash` | `#E4F2EA` | Background behind a met requirement. |
| `caution-wash` | `#F8EED9` | Background behind a caution sentence. |
| `danger-wash` | `#F8E6E3` | Background behind an error. |
| `ink-wash` | `#E7E2D6` | Neutral chip background. Same value as `surface-sunken` in light. |

Dark, for the same names:

| Token | Hex |
|---|---|
| `surface` | `#141210` |
| `surface-raised` | `#1E1B17` |
| `surface-sunken` | `#0E0C0A` |
| `ink` | `#F4EFE6` |
| `ink-muted` | `#C9C1B4` |
| `ink-subtle` | `#A89F91` |
| `hairline` | `#3A342C` |
| `accent` | `#E7A9A2` |
| `accent-ink` | `#1A1210` |
| `positive` | `#8FCBB0` |
| `caution` | `#E2C48A` |
| `danger` | `#F0B2AA` |
| `accent-wash` | `#3A2422` |
| `positive-wash` | `#1A2E24` |
| `caution-wash` | `#332815` |
| `danger-wash` | `#3A2220` |
| `ink-wash` | `#2A2622` |

Dark `accent` lightens so the focus ring still clears 3:1 against both `surface` and `surface-raised`, and `accent-ink` flips to near-black so the stamp stays readable. Positive, caution, and danger lighten for the same reason. Washes stay dark so a caution never looks like a sheet of white paper in night mode.

### Type

- **Titles:** Newsreader. A text serif with enough weight to title a posting and not so much contrast that it breaks on a cheap LCD.
- **Interface and body:** Public Sans. Built for long civic reading, large x-height, open shapes.
- **Code and identifiers:** JetBrains Mono, already in the product. Salaries, scores, dates, and counts use Public Sans with tabular figures, not mono, so a column of pay does not look like source code.

Modular scale, major third (1.25), base 16px. Caption is held at 12px instead of the next step down (10px), because 10px fails this audience.

| Role | Size | Line height | Tracking | Weight | Face |
|---|---|---|---|---|---|
| `display` | 2.441rem / 39px | 1.15 | -0.02em | 650 | Newsreader |
| `title` | 1.953rem / 31px | 1.2 | -0.018em | 600 | Newsreader |
| `heading` | 1.563rem / 25px | 1.25 | -0.015em | 600 | Newsreader |
| `subheading` | 1.25rem / 20px | 1.35 | -0.01em | 560 | Public Sans |
| `body` | 1rem / 16px | 1.55 | 0 | 400 | Public Sans |
| `body-small` | 0.875rem / 14px | 1.45 | 0 | 400 | Public Sans |
| `caption` | 0.75rem / 12px | 1.4 | 0.01em | 500 | Public Sans |
| `code` | 0.8125rem / 13px | 1.45 | 0 | 450 | JetBrains Mono |

### Spacing

A 4px root with alternating ×2 and ×1.5 steps. Phone layouts need 8 and 12 more than a pure ×1.5 sequence (4, 6, 9, 13.5), and a pure ×2 sequence has no step between 8 and 16. Every step is still a ratio from its neighbor, not a one-off.

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 32px |
| `space-7` | 48px |
| `space-8` | 64px |
| `space-9` | 96px |
| `space-10` | 128px |

### Radius

Tied to the size of the object, not one radius for the screen.

| Tier | Value | Used on |
|---|---|---|
| `control` | 2px | Inputs, buttons, chips, menu items. |
| `card` | 6px | Job rows, panels, stat blocks. |
| `overlay` | 10px | Dialogs, sheets, drawers. |
| `full` | 999px | Avatars, switch tracks, radio dots. Never a card. |

### Elevation

Almost none. A hairline is how two regions separate. Shadows are reserved for things that actually float above the page.

| Level | Use |
|---|---|
| `flat` | Page, job rows, tables, reading columns. Border only. |
| `raised` | Sticky bars and menus that must separate from a scrolling list. `0 1px 2px` ink at 8% opacity. |
| `overlay` | Dialogs, sheets, popovers. `0 12px 32px` ink at 18% opacity. |

No fifth “brand glow” under primary buttons.

### Density

- **Scanning** (job feed, tracker, tables): `body-small` (14px), 12px between rows, one hairline, no card shadow. The eye rejects a row by title and salary without reading a paragraph.
- **Reading** (job description, legal, match breakdown): `body` (16px), measure 62–72 characters (`68ch`), 24px above a heading and 12px below it, sunken or plain surface, never a feed row.

### Job feed wireframe

```
+------------------------------------------------------------------+
| WorkGraph            Search jobs                    [account]   |
+------------------+-----------------------------------------------+
| Role             |  Senior backend engineer            72 match  |
| Location         |  Northwind · Bengaluru · Remote               |
| Pay              |  ₹18–24L  ·  salary disclosed                 |
| Posted           |  Verified live 2 hours ago · via Greenhouse   |
|                  |  [Save]  [Dismiss]  [Apply on Greenhouse]      |
| [Clear filters]  +-----------------------------------------------+
|                  |  Support engineer                   41 match  |
|                  |  Example Co · Lagos · Hybrid                  |
|                  |  Salary not disclosed                         |
|                  |  Posted 89 days ago — may no longer be open   |
|                  |  via company site                             |
+------------------+-----------------------------------------------+
```

Rows are rules, not cards. The weak match is not smaller and not greyed into unreadability. The stale line is a full sentence in the caution color, same size as the fresh line.

---

## 2. Signal Desk

### Concept

A market desk with the swagger removed. Cool steel surfaces, a single deep teal for action, and mono figures for every number. Built for someone who wants to triage forty roles the way an analyst scans a blotter: rows, columns, almost no chrome.

### Why this audience

A subset of these users are engineers and operators who already live in dense tools and experience LinkedIn as too much decoration. Teal is the action color because red, for this group, already means a failing build or a rejected application. The desk stays light by default because a dark terminal is harder to read outdoors on a mid-range phone; dark exists, it is not the identity.

### What it deliberately rejects

Bloomberg’s black-and-amber costume, hacker-green on black, and any animation that implies a live ticker. Also rejects serif type: this direction bets that the audience trusts a tool more than a publication.

### Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `surface` | `#F2F4F5` | `#101416` | Desk |
| `surface-raised` | `#FFFFFF` | `#1A2126` | Row and input |
| `surface-sunken` | `#E4E8EB` | `#0B0E10` | Well |
| `ink` | `#12181C` | `#E7EEF2` | Text |
| `ink-muted` | `#4A565E` | `#C5D0D6` | Metadata |
| `ink-subtle` | `#5C6A72` | `#9AABB4` | Caption. Light value `#5C6A72` holds 4.5:1 on `#F2F4F5`. |
| `hairline` | `#D5DCE1` | `#2C3840` | Rules |
| `accent` | `#0F6E6B` | `#7DCDC8` | The only action color. Teal, not blue, so it is not LinkedIn. |
| `accent-ink` | `#F4FBFB` | `#06201F` | On accent |
| `positive` | `#1F7A4D` | `#8FCBB0` | Met |
| `caution` | `#8A5A12` | `#E2C48A` | Stale, thin sample |
| `danger` | `#9B2C2C` | `#F0B2AA` | Failure only |
| `accent-wash` | `#E3F3F2` | `#14302E` | Selected row |
| `positive-wash` | `#E5F4EC` | `#143028` | |
| `caution-wash` | `#F8F1E2` | `#332815` | |
| `danger-wash` | `#F8E8E6` | `#3A2220` | |
| `ink-wash` | `#E4E8EB` | `#243036` | |

### Type

- **All UI:** IBM Plex Sans. Neutral, slightly technical, readable at small sizes, with real tabular figures.
- **Code:** IBM Plex Mono.
- No display serif. Hierarchy is weight and the scale, not a second voice.

Same modular scale as Ledger (major third from 16px, caption floored at 12px), but every role is Plex Sans except `code`. Tracking on `display` and `title` stays slightly tighter (-0.02em) because Plex’s gothic forms get loud when loose.

### Spacing

Same 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 scale. Signal Desk uses the tighter end more often: feed rows pad 8px vertically, Ledger pads 12px.

### Radius

| Tier | Value |
|---|---|
| `control` | 0 |
| `card` | 2px |
| `overlay` | 4px |
| `full` | avatars only |

Square controls are the point. A rounded input would make this look like the SaaS this direction is refusing.

### Elevation

| Level | Use |
|---|---|
| `flat` | Everything in the blotter. |
| `raised` | None. Sticky regions use a stronger hairline, not a shadow. |
| `overlay` | Dialogs only. `0 8px 24px` ink at 16%. |

### Density

Scanning is denser than Ledger: 13px metadata, 32px row height minimum plus the 44px hit target on the actions, not on the whole row. Reading surfaces still open to 16px and 68ch. The desk does not make a job description dense just because the list is.

### Job feed wireframe

```
+------------------------------------------------------------------+
| JOBS          [search........................]     account       |
+----------+-------------------------------------------------------+
| role     | TITLE                    PAY        FRESH     MATCH   |
| place    | Senior backend engineer  ₹18–24L   2h live    72      |
| pay      | Northwind · Bengaluru · Remote · Greenhouse           |
|          | Senior backend — 3 requirements unmet                 |
|          +-------------------------------------------------------+
|          | Support engineer         not shown  89d old   41      |
|          | Example Co · Lagos · Hybrid · company site            |
|          | Posted 89 days ago — may no longer be open            |
+----------+-------------------------------------------------------+
```

Numbers sit in a right-hand column so they align. There is no card boundary, only a baseline rule. Actions appear on focus, not as a permanent row of buttons, except Apply, which keeps its label.

---

## 3. Field Guide

### Concept

A field guide for a hard week. Off-white, a forest green action color, and Atkinson Hyperlegible for everything, including titles. The metaphor is a well-printed guidebook you can use one-handed on a bus, not a terminal and not a magazine.

### Why this audience

Atkinson Hyperlegible was drawn so similar letterforms stay distinct (0/O, I/l/1). That is a direct answer to tired readers, second-language readers, and low-quality screens, which describes this audience better than a fashionable serif does. Forest green is the action color because red, for someone who has just been rejected, is already the color of bad news. Green here means “you can do this next”, and it is kept dark enough to stay serious.

### What it deliberately rejects

Notebook kitsch: no ruled lines, no handwriting fonts, no illustrations of people climbing mountains. Also rejects the brand-red-everywhere identity. The WorkGraph mark can stay red; the interface actions do not have to.

### Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `surface` | `#F7F6F2` | `#161614` | Page |
| `surface-raised` | `#FFFEFB` | `#22211E` | Raised sheet |
| `surface-sunken` | `#ECEAE4` | `#100F0E` | Well |
| `ink` | `#1C1B16` | `#F6F4EE` | Text |
| `ink-muted` | `#5A584F` | `#D0CDC2` | Metadata |
| `ink-subtle` | `#6A675C` | `#B2AFA3` | Caption, still ≥4.5:1 |
| `hairline` | `#DDD9D0` | `#3C3A34` | Rules |
| `accent` | `#1F6B45` | `#9DCEB6` | The next action. Forest, not mint. |
| `accent-ink` | `#F4FBF7` | `#0E1F17` | On accent |
| `positive` | `#1F6B45` | `#9DCEB6` | Same hue as accent. A met requirement and the action share a color; they are told apart by a word, never by hue alone. |
| `caution` | `#8A5A10` | `#E4C48A` | Stale, thin sample |
| `danger` | `#8E2E2E` | `#F0B2AA` | The oxide red, reserved for harm. |
| `accent-wash` | `#E5F3EC` | `#163026` | |
| `positive-wash` | `#E5F3EC` | `#163026` | |
| `caution-wash` | `#F8F1E0` | `#332A16` | |
| `danger-wash` | `#F8E8E6` | `#3A2220` | |
| `ink-wash` | `#ECEAE4` | `#2A2926` | |

Sharing accent and positive is intentional and is also the direction’s risk: a green button and a green “requirement met” must each carry a word. That is acceptable here and is a reason not to pick this direction if we want color to separate “go” from “good”.

### Type

- **Every role including display:** Atkinson Hyperlegible. One family, so a stressed reader never re-parses a second set of letterforms.
- **Code:** JetBrains Mono, only for actual code.

Scale is a minor third (1.2) rather than 1.25, because Hyperlegible’s large x-height gets tall quickly. Base 16px.

| Role | Size | Line height | Tracking | Weight |
|---|---|---|---|---|
| `display` | 2.488rem / 40px | 1.2 | -0.015em | 700 |
| `title` | 2.074rem / 33px | 1.25 | -0.012em | 700 |
| `heading` | 1.728rem / 28px | 1.3 | -0.01em | 700 |
| `subheading` | 1.44rem / 23px | 1.35 | 0 | 700 |
| `body` | 1.2rem / 19px | 1.55 | 0 | 400 |
| `body-small` | 1rem / 16px | 1.5 | 0 | 400 |
| `caption` | 0.875rem / 14px | 1.4 | 0 | 400 |
| `code` | 0.875rem / 14px | 1.45 | 0 | 400 |

Caption does not go below 14px in this direction. Hyperlegible at 14px is the smallest size that still earns the “hyperlegible” claim on a phone.

### Spacing

Same ratio scale as Ledger. Field Guide spends more of it: 16px inside a row, 24px between sections. The guide is allowed to be looser because the type is larger.

### Radius

| Tier | Value |
|---|---|
| `control` | 4px |
| `card` | 8px |
| `overlay` | 12px |
| `full` | avatars and switches only |

Slightly softer than Ledger, still three tiers. Not 16px on everything.

### Elevation

| Level | Use |
|---|---|
| `flat` | Feed and reading. |
| `raised` | The sticky apply bar only. |
| `overlay` | Dialogs and the mobile filter sheet. |

### Density

Scanning uses `body-small` at 16px, which is this direction’s idea of compact. Reading uses 19px body and a 68ch measure. This is the most generous direction and the one most likely to show fewer roles per screen on a 360px phone. That is a real trade against the “triage forty roles” job, and it is why Field Guide is not the default.

### Job feed wireframe

```
+----------------------------------+
| WorkGraph                 [=]    |
| [ Search roles                 ] |
+----------------------------------+
| Senior backend engineer          |
| Northwind · Bengaluru · Remote   |
| ₹18–24L                          |
| 72 — 3 requirements met          |
| Verified live 2 hours ago        |
| via Greenhouse                   |
| [ Save ] [ Dismiss ]             |
| [ Apply on Greenhouse          ] |
+----------------------------------+
| Support engineer                 |
| Example Co · Lagos · Hybrid      |
| Salary not disclosed             |
| 41 — most requirements unmet     |
| Posted 89 days ago — may no      |
| longer be open                   |
| via company site                 |
+----------------------------------+
```

One role per block, stacked, because this direction assumes a phone first and refuses a cramped multi-column blotter. The apply control is full width and at the bottom of the row, in thumb range.

---

## Recommendation

**Build Ledger.**

Signal Desk is the right tool for a desk worker and the wrong default for someone in Lagos or Bengaluru on a bus, who does not want a blotter. Field Guide is the most readable and the kindest, and it is also the loosest: fewer roles on screen, and it spends the brand’s only red on errors, which throws away recognition the mark already has.

Ledger keeps the oxide red as a stamp, gives titles the weight of a document, and gives the UI a sans face that was designed for public reading. Hairlines replace the shared grey shadow, so a job row, a warning, and a dialog are different objects. It is calm without being soft, and it still scans.

The owner instructed this run to proceed without waiting. **Ledger is the chosen default.** Token values in `app/tokens.css` implement the Ledger tables above. Switching later means replacing that file, not redrawing components.
