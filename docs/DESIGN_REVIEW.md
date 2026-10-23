# Design review

Reviewed from the current source and from a light-theme render of `/pricing` at 1440px. `/`, `/jobs`, job detail, onboarding, the tracker, profile, and settings need Supabase or a signed-in session, so those screens were read from source rather than a live render. Dark theme was checked against `app/tokens.css`, not a second set of screenshots. No frame-accurate phone session was run.

## Homepage — `app/(marketing)/page.tsx`

The h1 is sentence case and the index numbers are real or omitted. The three pricing cards are repeated here, so the false equal signup (fixed below) was on the homepage too. Stat figures use the heading role, so a count can outweigh its caption. The live job card used a 14px title under a section heading. Token use on this page is the shared card radius and hairline. Empty index and empty testimonial states exist. A first visit still has to learn that “Company not verified” is about a domain check, which the trust link explains only after a click.

## Pricing — `app/(marketing)/pricing/page.tsx` and `components/marketing/PricingTiers.tsx`

Before this pass, free, premium, and pro were the same card with the same “Create an account” link. Premium and pro both said “Unlimited” and “No public price”. Signing up does not grant those tiers. That was the sharpest trust failure in the group. The cards are still the same radius and border. There is no separate loading state because the numbers are constants. “Unlimited” is the code’s `-1` cap, not a made-up customer count, and it stays on the tiers that cannot be bought here.

## Job feed — `components/jobs/JobFeed.tsx` and `components/product/JobCard.tsx`

The role title was `text-role-body-small` (14px) while Save, Dismiss, and Apply are 44px controls. The title is what a person scans. Filters, empty states, and the thin-coverage note are present. The list is a fixed 70vh scroller, so a 320px width scrolls inside the list rather than the page. Keyboard help is a caption under the count. Match scoring and apply labels were not retuned.

## Job detail — `components/jobs/JobDecision.tsx`

The title is a heading under the shell’s “Job” h1, so two titles compete and the shell one is generic. Line 151 always says “Company not verified” because the card payload has no per-employer verification bit. Sections for match, stored text, company, pay, and source stack with the same spacing. Apply is in the header, which is the right rank. Not fixed this pass: the hardcoded verification sentence.

## Onboarding — `components/onboarding/OnboardingFlow.tsx`

Step text exists, so the bar is not the only progress signal. Remote, hybrid, and onsite are lowercase tokens, and the selected one is accent colour without the word “on”. “Onsite” is one word a new reader can miss. Not fixed this pass.

## Tracker — `components/tracker/TrackerBoard.tsx`

Board and table both exist. The table is `min-w-[40rem]` inside a sideways scroller, which at 375px hides columns until you drag. The stage menu is on each row. Empty and filter-empty states exist. Not fixed this pass.

## Profile — `components/profile/premium/ProfileShell.tsx` and `ProfileHero.tsx`

The profile route uses the dashboard chrome (`rounded-xl`, `--dash-*` colours, title case such as “Your Profile” and “Application Intelligence”), which is a different product from the jobs shell. The name is an h2 under the page h1. Not restyled this pass.

## Settings — `components/settings/SettingsSection.tsx`

Before this pass, notification boxes and “Recruiter visibility” were `defaultChecked`, and “Export my data” had no handler. A phone user would think recruiters could already see them and that export worked. Icon tiles used `rounded-xl` and dashboard colour variables instead of the hairline and card radius.

## What a first visit gets wrong

The pricing signup was the worst: it offered to create an account on a tier that cannot be bought. Settings was next: checked boxes for preferences that are not saved. The feed title was the third: the role name was smaller than the buttons around it.

## Fixes this pass

1. Pricing. Only the free tier links to signup, and the label is “Create a free account”. Premium and pro say they cannot be bought here (`components/marketing/PricingTiers.tsx`).
2. Settings. Dark mode stays, because it writes the theme on this device. Notifications, recruiter visibility, and export are sentences that say they are not stored. The sections use the card radius and hairline.
3. Job card title. The role name uses the body size instead of body-small (`components/product/JobCard.tsx`). The virtual row grew from 300px to 320px so the apply control still fits.

Left for a later pass: onboarding’s remote words, the tracker’s sideways table, the profile dashboard chrome, and the job detail line that always says the company is not verified.
