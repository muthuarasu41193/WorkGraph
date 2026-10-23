# Accessibility and felt speed

This pass targets WCAG 2.2 AA and the perceived-speed items in prompt D2. Numbers below are what this repository can show. A screen reader was not available in the build environment, and Lighthouse was not run against a throttled phone.

## Accessibility

| Check | Before | After |
| --- | --- | --- |
| Serious and critical axe failures fail CI | No axe run. `npm test` was not in `.github/workflows/verify-build.yml`. | `axe-core` (MPL-2.0) runs in `lib/__tests__/a11y.test.ts` through jsdom (MIT). `npm test` is a verify-build step. The test fails on serious and critical impacts. A nameless button is the control that proves the gate fires. |
| Colour contrast | Body text already cleared 4.5:1. `--hairline` was about 1.4:1 on the page surface, so a border was the only edge of a field. | `--hairline` is `#827c76` in light and `#6e6862` in dark. The contrast test requires 4.5:1 for ink, muted, subtle, accent, positive, caution, and danger on surface and raised, 4.5:1 for accent ink on accent, and 3:1 for the hairline on surface, raised, and sunken. jsdom does not compute CSS, so axe's colour-contrast rule is off and this token test is the check. |
| Landmarks and skip link | Marketing had a skip link. Pricing and sources had no `#main-content`. The app shell, profile dashboard, legal, interview vault, auth, and employer shell had no skip link. Jobs and a found job detail had no `main`. | `SkipLink` is the first control on those shells. `#main-content` is the skip target. Jobs and job detail render one `main` inside the shell. |
| One h1 and heading order | The app shell h1 was followed by job titles marked h3. Profile showed a page h1 and a second h1 on the name. | Job titles are h2. The profile name is h2 under the page title. |
| Focus | `*:focus-visible` already draws a two-pixel accent ring on the page background. Accent on surface is above 3:1 in both themes. | Unchanged ring. The shortcuts layer moves focus to Close and keeps Tab inside the layer. |
| State by colour alone | Active filters already say "on". Match rows already say "Met" or "Not met". | A tracker column that is the drop target also says "drop here". |
| Live regions | Result count, toasts, and tracker form errors already used live regions. Moving the job list with j and k only painted a ring. | The focused title is announced after j or k. A failed "load more" uses `role="alert"`. Stage changes still go through the toast, which is a polite live region. |
| Keyboard | The feed already used j, k, Enter, s, and x, but only while the list was focused, and the selection could sit off screen. Tracker stage changes already use a menu on each card. Dialogs from the shared dialog already trap focus. | The feed scrolls the selected row into view and prints the keys under the count. The tracker drag sensor now includes a keyboard sensor. The stage menu is still the reliable way to change a stage. |
| 320px and 200% | The shell header kept the title, the word Search, and the account control on one row. | The header wraps, the title can shrink, and Search collapses to the icon below the small breakpoint. The tracker table still scrolls inside its own region and says so. Body scroll stays `overflow-x: clip`. |
| Screen reader | Not run. | Not run. No VoiceOver, NVDA, or TalkBack session was available. The confusing parts from the keyboard path alone: j and k do nothing until the job list itself is focused, the keys are letters rather than arrows, and a keyboard drag on the tracker still needs the separate stage menu to be obvious. |

## Perceived speed

| Check | Before | After |
| --- | --- | --- |
| Lighthouse budget on `/`, `/jobs`, `/jobs/[id]` | None. | `lighthouserc.cjs` sets LCP under 2.0s, CLS under 0.05, and interaction-to-next-paint under 200ms on a simulated mobile 4G profile. `.github/workflows/lighthouse.yml` runs `@lhci/cli` (Apache-2.0, not a package dependency) only when the `LHCI_BASE_URL` repository variable is set. It was not set here, and this environment has no Supabase URL, so `/` and `/jobs` cannot be measured. INP itself is field data. The lab stand-in is interaction-to-next-paint. No frame times were recorded. |
| Layout shift | The feed "Load more" label swapped with "Loading". Save swapped with "Saved". | Those two controls keep a minimum width. Shared buttons that use the loading prop already hide the label in place and show a spinner on top. |
| Prefetch | Job detail loaded on click. | Hover or focus on a feed card, and hover or focus on "Open full page", calls `router.prefetch` for that job. Ranking, filters, and apply labels are unchanged. |
| Optimistic actions | Tracker moves update the board before the request and roll back with a toast on failure. Save on a job writes local storage immediately. Dismiss offers undo. | Unchanged. |
| Client JavaScript on `/jobs` | `app/(app)/jobs/page.tsx` is a server component. `JobFeed` is a client component because it filters, virtualises, and saves on this device. | Unchanged. Moving the feed to the server would remove those interactions. No client bundle was deleted in this pass. |
