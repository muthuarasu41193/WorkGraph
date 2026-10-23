# Credibility audit

Checked against D1. Fixed items are in this commit. Left items are things the data cannot support, so the UI omits them instead of filling them in.

| Point | Where | What we found | What changed |
| --- | --- | --- | --- |
| AI marker | `components/product/MatchScore.tsx`, `components/jobs/JobDecision.tsx`, `components/design-system/JobCard.tsx`, onboarding review | Match percents and extracted resume fields could be read as facts. | `AIProvenance` marks them as estimates or extractions and links to `/trust#match`. |
| Uncertainty | `components/product/SalaryDisplay.tsx`, `lib/job-feed.ts` | Cards do not carry a salary sample. `jobCardView` already forces undisclosed pay. | No sample size is invented. Stated or converted figures say they are not a market estimate. |
| Dates | `app/(marketing)/page.tsx` | Index counts had no “as of” time. | The homepage prints the render time when a count is shown. A failed query still shows no number. |
| Thin coverage | `app/(app)/jobs/page.tsx` | A small result set looked like a complete market. | A note appears when the page total is 0–4 and points at a broader search. Country coverage is not claimed, because it is not stored. |
| Verified employer | `components/product/JobCard.tsx`, `lib/employer/verification.ts` | “Company domain verified” did not say what was checked. | The phrase links to `/trust#verified-employer`, which describes the domain match. |
| Verified live | Product cards | Not used. Posted time was already labelled as a stored date. | `/trust#verified-live` says the label is not used. |
| Verified experience | `components/sections/Testimonials.tsx` | `verified_outcome` rendered as a green pill with no check. | It now reads “Reported outcome”, and `/trust#verified-experience` says we do not verify work history. |
| Dark patterns | `components/consent/ConsentManager.tsx`, pricing | Reject all is visible and equal weight. Analytics and marketing start off. No countdown. | Rule written in `docs/VOICE.md`. No cancel button was added, because there is no paid subscription to cancel. |
| Feedback | Root `PageShell` | No persistent human route. | “Send feedback to a person” links to the contact form on every screen that mounts the shell. |
| Invented reach | `app/layout.tsx`, `app/opengraph-image.tsx`, `components/seo/JsonLd.tsx`, `components/layout/Footer.tsx`, `lib/constants.ts` | Title, share image, and structured data claimed hidden jobs, 50+ sources, a free starter price, or earning by selling guides. Footer used an emoji. | Those live strings now describe the index. The JSON-LD offer was removed because no checkout price is published. Unmounted files `components/sections/Hero.tsx`, `Features.tsx`, `HowItWorks.tsx`, and `Pricing.tsx` still contain “50+ sources” copy and are not rendered. |

## Omitted on purpose

- A “based on N disclosed salaries” sentence. The cards do not have that sample.
- A verified-live badge.
- A verified-experience badge.
- A cancel-subscription button. Checkout is not published.
- Security certifications, press logos, and customer counts.
