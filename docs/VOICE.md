# Voice

WorkGraph speaks to people who are job searching. Copy is calm, specific, and useful. It does not perform enthusiasm, and it does not judge.

## Rules

- Sentence case for buttons, headings, labels, and navigation. Never Title Case. Never ALL CAPS labels.
- Active voice and second person when the sentence is about the reader’s action.
- Plain verbs. The same verb stays through the lifecycle: Save, Saved, Saved.
- Buttons say what will happen: “Save changes”, “Apply on the company site”, “Delete account permanently”.
- No exclamation marks. No emoji in product UI. No “Oops”, “Uh oh”, or similar filler.
- No architecture jargon in user-facing strings. Do not say index internals, parsers, or status codes unless the reader needs that fact to act, and then say it in plain language.
- Errors use three short sentences when we know them: what happened, why, what to do. Never blame the reader. Never show a stack trace or a status code.
- Empty states invite the next action. They do not apologise.
- One catalogue, `lib/messages.ts`, holds the strings this pass owns. New UI copy goes there with a descriptive key.

## Sensitive surfaces

Rejection, a long silence, a low match, a missing skill, and AI-displacement content are facts plus a next action.

- A rejected stage records that this application closed. It does not describe the person or the rest of their search.
- A stretch with no update is a gap in the record. Offer a next step. Do not call it ghosting in the UI, and do not imply the reader did something wrong.
- A low match score, when one exists, is an estimate from the profile we compared. Say what was missing and what the reader can add. Never say they are unqualified or that a career is over.
- A skill gap is a difference between a listing and a profile. Name the difference. Offer to add the skill or look at a closer role.
- AI-displacement content states what changed in the work and one concrete next step. It does not predict that the reader will be replaced.

## What this pass did not move

`components/product/JobCard.tsx`, `components/product/MatchScore.tsx`, `components/jobs/JobDecision.tsx`, and most of `components/jobs/JobFeed.tsx` are owned by another change. Their strings stay in those files. Do not treat a match percentage as a hiring probability when you do edit them.
