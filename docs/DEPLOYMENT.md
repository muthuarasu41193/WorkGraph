# Deployment guide (Docker / Coolify)

## Production compose

```bash
cp .env.workgraph.example .env
# Set strong passwords: POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, TYPESENSE_API_KEY, JOB_AGGREGATOR_API_KEY

docker compose -f infrastructure/docker-compose.yml --profile ai --profile monitoring up -d
```

## Coolify

1. Create a new **Docker Compose** resource.
2. Point to `infrastructure/docker-compose.yml` in this repo.
3. Inject environment variables from `.env.workgraph.example`.
4. Expose `web` on your domain (port 3000) and optionally `api` on `api.yourdomain.com` (port 8000).
5. Attach persistent volumes: `postgres_data`, `minio_data`, `typesense_data`, `ollama_data`.

## Nginx reverse proxy (example)

```nginx
server {
  listen 443 ssl http2;
  server_name app.workgraph.example;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}

server {
  listen 443 ssl http2;
  server_name api.workgraph.example;

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    client_max_body_size 8m;
  }
}
```

## Production checklist

- [ ] Rotate all default passwords in `.env`
- [ ] Set `WORKGRAPH_ENV=production`
- [ ] Restrict `CORS_ORIGINS` to your web origin
- [ ] Enable `JOB_AGGREGATOR_API_KEY` for ingest routes
- [ ] Schedule ingest: BullMQ worker with `WORKER_CRON_ENABLED=true` or n8n (`--profile automation`)
- [ ] Back up Postgres + MinIO volumes daily
- [ ] Pull Ollama model on deploy: `ollama pull deepseek-r1:1.5b`
- [ ] Run `python -m app.main ingest` after deploy to seed jobs
- [ ] Configure Uptime Kuma (`--profile monitoring`) for `/health` endpoints

## SuperTokens (auth migration)

Start auth stack:

```bash
docker compose -f infrastructure/docker-compose.yml --profile auth up -d supertokens
```

Default auth is **Supabase** (`AUTH_PROVIDER=supabase`). Optional SuperTokens: see [PHASE3.md](./PHASE3.md). Community/wallet use WorkGraph API with the Supabase user id.

## PostHog / Novu / Evolution API

These are **optional** profiles. PostHog requires additional ClickHouse/Redis services for full self-host — follow upstream docs when enabling `--profile analytics`.

## Scaling

- **API**: horizontal replicas behind load balancer; shared Postgres + Redis
- **Workers**: scale `worker` service; all share `REDIS_URL`
- **Embeddings**: CPU-heavy; run embed jobs on dedicated worker nodes
- **Ollama**: GPU nodes with `OLLAMA_HOST` pointed from API containers

## Stripe / Razorpay

Optional env keys in `.env.workgraph.example`. Subscription gating uses `wg_subscriptions` — free tier works with zero payment keys.

## Vercel (Next.js frontend)

See **[VERCEL.md](./VERCEL.md)** for push-to-deploy workflow, required env vars, and troubleshooting.
