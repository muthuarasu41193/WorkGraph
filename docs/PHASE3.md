# Phase 3 — SuperTokens, dashboard stack, community & wallet

## What shipped

| Area | Details |
|------|---------|
| **Auth** | Dual mode: `AUTH_PROVIDER=supabase` (default) or `supertokens` with self-hosted Core |
| **Dashboard** | Zustand store + TanStack Query hooks + shadcn-style UI primitives on `/profile` |
| **Community** | Posts, votes, reputation — `wg_community_posts` + FastAPI `/community/*` + BFF `/api/v2/community/*` |
| **Wallet** | Balance, transactions, payout requests — `wg_wallets` + `/wallet/*` + `/api/v2/wallet` |

## Auth (default: Supabase)

Set in `.env.local`:

```env
AUTH_PROVIDER=supabase
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Community and wallet still use `WORKGRAPH_API_URL`; the BFF forwards your Supabase user id as `X-User-Id`.

### Optional: SuperTokens

Only if you are **not** using Supabase keys:

```env
AUTH_PROVIDER=supertokens
SUPERTOKENS_CONNECTION_URI=http://localhost:3567
```

```bash
docker compose -f infrastructure/docker-compose.yml --profile auth up -d supertokens
```

Run migrations (included in `migrations/postgres/003_phase3_community_wallet.sql` on first Postgres boot).

## Profile dashboard tabs

When `WORKGRAPH_API_URL` is set, `/profile` shows **Overview**, **Community**, and **Wallet** tabs.

- Community posts auto-approve in dev (`WORKGRAPH_COMMUNITY_AUTO_APPROVE=true`) and credit the author wallet.
- Minimum payout request: **$5.00** (pending admin review).

## API map

| BFF (Next.js) | FastAPI |
|---------------|---------|
| `GET/POST /api/v2/community/posts` | `GET/POST /community/posts` |
| `POST /api/v2/community/posts/:id/vote` | `POST /community/posts/:id/vote` |
| `GET/POST /api/v2/wallet` | `GET /wallet/summary`, `POST /wallet/payout` |
| `GET /api/v2/dashboard` | `GET /wallet/dashboard` |
| `GET /api/auth/session` | — |
| `/api/auth/*` | SuperTokens Core |

All authenticated BFF routes forward `X-User-Id` to FastAPI after session validation.
