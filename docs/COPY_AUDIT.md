# Copy audit

Compared with `docs/VOICE.md`. Only strings this pass changed are listed. Job cards, match scores, the job decision page, and the job feed body were left in place for a separate change.

| Before | After | Where |
| --- | --- | --- |
| GET IN TOUCH | Contact | `components/sections/Contact.tsx` |
| Send Message → | Send message | `components/sections/Contact.tsx` |
| Message sent! We'll reply within 24 hours. | Message sent. A reply time is not published. | `components/sections/Contact.tsx` |
| Network error. Please check your connection and try again. | The message did not send. The connection failed. Try again. | `components/sections/Contact.tsx` |
| Have questions about WorkGraph? Want to partner with us? Or just want to say hi? We respond within 24 hours. | Have a question about WorkGraph or a partnership? Send it here. | `components/sections/Contact.tsx` |
| Join waitlist → | Join the waitlist | `lib/constants.ts` |
| We launched this month. Be one of the first. | The waitlist is open. | `lib/constants.ts` |
| We launched this month. Be one of the first. | No public count is available yet. | `lib/social-proof.ts` when a public count is not shown |
| Confirm | Move selected | `components/tracker/TrackerBoard.tsx` |
| No update recorded recently. | No update has been recorded recently. Add a next step if you want one. The gap is in the record, not a judgement of you. | `components/tracker/TrackerBoard.tsx` |
| No update recorded in N days. | No update has been recorded for N days. Add a next step if you want one. The gap is in the record, not a judgement of you. | `components/tracker/TrackerBoard.tsx` |
| (no rejection note) | This application is marked rejected. That records this outcome. It does not describe the rest of your search. | `components/tracker/TrackerBoard.tsx` |
| Add a resume to improve match accuracy. | A resume gives the match a profile to compare. Search still works without one. | `components/onboarding/OnboardingFlow.tsx` |
| Could not load jobs. | Jobs did not load. The search request failed. Try the search again. | `components/marketing/HeroSearch.tsx` |
| Closed or declined | The employer closed this application, or you declined it. | `lib/applications.ts` column description |
| How it Works | How it works | `lib/constants.ts` |
| Update N | Move N | `components/tracker/TrackerBoard.tsx` |
| Could not load jobs. You can still continue. | Jobs did not load. The search request failed. You can still continue. | `components/onboarding/OnboardingFlow.tsx` |
| Join waitlist → | Join the waitlist | `app/waitlist/WaitlistClient.tsx` |
| Early access to hidden job discovery across 50+ sources | Search the live job index without an account. | `app/waitlist/WaitlistClient.tsx` |
| AI match scoring and Interview Vault previews | A match note appears when a profile is available to compare. | `app/waitlist/WaitlistClient.tsx` |
| Priority onboarding when your spot opens up | We email this address when there is something to say. A date is not promised. | `app/waitlist/WaitlistClient.tsx` |

## Left unchanged on purpose

- `components/product/JobCard.tsx`, `components/product/MatchScore.tsx`, `components/jobs/JobDecision.tsx`, and the feed layout in `components/jobs/JobFeed.tsx`.
- Employer, vault, profile, and create-profile forms. Their existing actions still work; this pass did not rewrite them.
- Status names Applied, Screening, Interview, Offer, and Rejected. Those are the stage names the tracker already stores.
