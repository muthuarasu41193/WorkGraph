# Source icons

Central place for **job / community source** brand marks.

| Library | Use for |
|---------|---------|
| `@icons-pack/react-simple-icons` | Brand logos (LinkedIn*, Reddit, Indeed, Glassdoor, Naukri*, X, GitHub, Google) |
| `lucide-react` | UI chrome (navigation, actions, Globe fallback) |

\*LinkedIn and Naukri are not shipped by Simple Icons; their marks live as small inline SVGs in `SourceIcon.tsx`. Do **not** add Font Awesome, react-icons, or a second brand pack.

## Add a new source

1. Extend `JobSourceIconKey` and the label/color maps in `lib/source-icons.ts`.
2. Register the icon in `SourceIcon.tsx` — prefer `Si…` from `@icons-pack/react-simple-icons` with `color="default"`.
3. Add hostname rules to `DOMAIN_TO_SOURCE` in `getSourceFromUrl`.
4. Prefer the schema `source` field via `resolveJobSourceIconKey(source, url)`; only fall back to the URL when the field is missing or generic.

## Components

- `SourceIcon` — 24px neutral rounded tile + brand glyph (default 16px).
- `SourceBadge` — icon + caption label; optional `secondary` (subreddit / author) and optional link for job cards / community posts.
