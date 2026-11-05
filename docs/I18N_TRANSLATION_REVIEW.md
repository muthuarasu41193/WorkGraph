# Strings that still need human translation review

**Date:** 5 November 2026  
**Source locale:** `en`  
**Scaffold locales:** `ta`, `hi`, `es` (currently English placeholders with `_meta.status = MACHINE_COPY_NEEDS_HUMAN_REVIEW`)

Every key in `messages/ta.json`, `messages/hi.json`, and `messages/es.json` needs a human translator before launch. Do not ship machine copies as final.

## Catalog keys (all locales)

- `meta.title`, `meta.description`
- `locales.*` (native script names are already set; keep them)
- `nav.*`
- `footer.*`
- `states.*` (includes ICU plurals)
- `tracker.*` (includes ICU plurals)
- `contact.*`
- `jobs.*`
- `announce.*`
- `hero.*`
- `onboarding.*`
- `pull.*`
- `swipe.*`
- `format.*`

## Still outside the catalogs (English in source)

These surfaces still contain hard-coded English and need a follow-up extraction pass:

- Job card / match / salary / trust product composites (`components/product/*`)
- Job feed filter chip labels and dismiss/save/apply chrome left in `components/jobs/JobFeed.tsx`
- Legal policy bodies (`app/[locale]/legal/**`) — counsel-owned, not UI chrome
- Marketing sections that are not yet wired to `useTranslations` (`components/sections/*`, pricing tiers)
- Employer, Interview Vault, dashboard profile chrome
- Toast titles emitted as string literals in feature components
- `lib/constants.ts` nav/footer labels (partially duplicated by catalogs)
- Accountability page copy (`lib/accountability.ts`) once that branch merges

## ICU / format notes for translators

- Prefer ICU `{count, plural, …}` over concatenating numbers into sentences.
- Dates, numbers, and currency must go through `lib/i18n/format.ts` — do not hard-code `toLocaleString("en-US")` in new UI.
- Search normalization folds Latin diacritics; Tamil/Hindi/Spanish queries are matched on their own script tokens.
