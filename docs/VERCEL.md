# Vercel deployment (WorkGraph Next.js app)

Production URL: **https://work-graph-fawn.vercel.app**

GitHub Pages (`muthuarasu41193.github.io/WorkGraph/`) serves the static marketing `index.html` only. Login, profile, and the Shadcn UI live on **Vercel**.

## How deploys work

1. Commit and **push to `main`** on GitHub.
2. Vercel’s Git integration builds and deploys automatically (no extra GitHub Action or CLI step required).
3. GitHub shows a **Vercel** check on the commit — green means production is updated.

From Cursor: use **Source Control → Commit → Push** (or `git push origin main`). Do not rely on GitHub Pages for the Next.js app.

## Required Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (default auth) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Server-side profile/jobs |
| `GROQ_API_KEY` | Optional | Resume/ATS when not using WorkGraph API |
| `NEXT_PUBLIC_APP_URL` | Recommended | e.g. `https://work-graph-fawn.vercel.app` |

**Auth provider:** Default is Supabase. If you set `AUTH_PROVIDER=supertokens`, you must also set `SUPERTOKENS_CONNECTION_URI` (and optionally `SUPERTOKENS_API_KEY`). Do not set `AUTH_PROVIDER=supertokens` alone — the build will pass, but auth routes return 503 until SuperTokens is configured.

## Cron jobs (Hobby plan)

`vercel.json` cron schedules must run **at most once per day** on the Hobby plan. Use a fixed time like `0 6 * * *`. The repo runs `npm run verify:vercel-config` in CI to block invalid schedules.

## CI before Vercel

The **Verify production build** workflow (`.github/workflows/verify-build.yml`) runs on every push/PR to `main`. If it fails, fix locally with:

```bash
npm run verify:deploy
```

Then push again. This catches most build failures before Vercel does.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Red **Vercel** check on GitHub | Open the check link → read build logs |
| Old UI after push | Hard refresh (Ctrl+Shift+R) or open in incognito |
| Deploy succeeds but auth broken | Confirm Supabase env vars in Vercel Production |
| Cron deploy failure | Ensure schedule is once daily (`verify:vercel-config`) |

## Do not add

- A second deploy workflow that calls `vercel deploy` unless you configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in GitHub secrets. Vercel Git integration already deploys on push.
