# Motion

Motion answers a user action. It shows what changed, where something came from, or where it went. Anything that plays on its own is removed.

## Tokens

Durations live in `app/tokens.css`.

- Feedback: `--duration-fast` (120ms) and `--duration-base` (180ms).
- Layers (dialog, sheet, toast): `--duration-slow` (260ms).
- Nothing over 300ms.
- Properties: `transform` and `opacity` only. Do not animate `width`, `height`, `top`, or `left`.

## What moves

| Surface | Motion |
| --- | --- |
| Dialog and sheet | Opacity and scale from the control that opened them. On a small screen the sheet rests at the bottom and still uses transform, not top or left. |
| Dropdown and popover | Opacity and a short translate on the menu (`details` filter menus). |
| Toast | Opacity and translate on entry. Dismissal removes the node. |
| List add and remove | Opacity. Rows do not slide the rest of the list. |
| Drag and drop | The dragged card drops to 60% opacity. The list under it does not move. |
| Tabs and accordions | Instant panel swap, or an opacity fade within `--duration-base`. |
| Skeleton | Opacity only, after the 200ms delay. Content replaces it without a slide. |

## What does not move

Scroll-triggered fade-and-slide on the mounted marketing sections, hover lift or hover scale on cards and links, animated number counters, parallax, looping background motion, and decorative motion on the job feed. The feed is a work surface and stays still.

`components/sections/Hero.tsx`, `Features.tsx`, `HowItWorks.tsx`, `Pricing.tsx`, and `StatsBar.tsx` are not mounted. Their leftover motion does not run. Looping hero classes are set to `animation: none` in CSS so a later mount does not restart them.

Hover changes colour or border. A scannable list does not move under the cursor.

## Reduced motion

`prefers-reduced-motion: reduce` keeps colour and opacity feedback and sets animation duration to `0s`. It does not remove the feedback.

## Shared element

A job card and its detail page are not a shared-element transition. The detail view is a separate route, and the feed is being reworked elsewhere, so this pass does not add a view transition on the card or the detail title.

## Frame timing

This environment cannot throttle a mid-range Android GPU and count dropped frames while the feed scrolls. The feed was not given new motion, and its rows stay in normal document flow inside the existing scroller.
