# Deploy safety

Broken commits should never reach Vercel production. This repo enforces that at three layers.

## 1. Pre-push hook (local)

After `npm install`, git uses `.githooks/pre-push`, which runs:

```bash
npm run verify:prepush
```

That executes, in order:

1. `typecheck` — `tsc --noEmit` (app code only; matches Next.js type-check scope)
2. `verify:vercel-config` — cron / `vercel.json` guardrails
3. `build` — `next build` (same command Vercel runs)

If any step fails, **`git push` is blocked**.

To install or re-enable hooks:

```bash
npm run prepare
# or
node scripts/setup-githooks.mjs
```

Emergency override (use sparingly):

```bash
SKIP_PREPUSH=1 git push
```

## 2. GitHub Actions (remote)

Workflow: [`.github/workflows/verify-build.yml`](.github/workflows/verify-build.yml)

Runs on every push and PR to `main` with the same checks as above.

## 3. Vercel (production)

Vercel runs `npm run build` from [`vercel.json`](vercel.json). A failed build marks the deployment as **Error** — it does not go live.

### Recommended Vercel setting

In the Vercel project → **Settings → Git**:

- Enable **“Wait for GitHub Checks”** (or **Deployment Protection → Required checks**) so production only deploys after the `Verify production build` workflow passes.

This prevents Vercel from starting a deploy while CI is still running or when CI has failed.

## Manual verification before push

```bash
npm run verify:deploy
```

Same as the full pre-push pipeline — run this before committing if you disabled hooks.
