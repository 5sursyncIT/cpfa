# Deployment — CPFA

Two supported topologies, mirroring `docs/projet.md` §8.

## Option A — Cloud managed (Vercel + Neon + Upstash)

Recommended for the first year (zero DevOps).

| Component | Service | Notes |
|---|---|---|
| Web (Next.js) | Vercel | Standalone output works out of the box; `apps/web` is the project root. |
| Worker (BullMQ) | Vercel **Cron** + Upstash | Vercel doesn't run long-lived processes. Convert the cron sweep to a scheduled function (`/api/cron/loan-reminder-sweep`) and let Upstash QStash deliver per-loan reminder jobs. |
| Postgres | Neon | Branch the prod DB for staging — instant copies. |
| Redis | Upstash | Already region-pinned via `REDIS_URL`. |
| Object storage | Backblaze B2 | S3-compatible — works with `@cpfa/lib/storage` unchanged. |
| Email | Resend | Set `RESEND_API_KEY` and `EMAIL_FROM`. |

### Setup

1. **Vercel** — import the repo. Set **Root Directory** to `apps/web`. Use the `pnpm` install command and `pnpm build`.
2. Add env vars from `.env.example` (production values) on the Vercel project. `AUTH_SECRET` must be 32+ bytes (`openssl rand -base64 32`).
3. **Neon** — create a project, copy the connection string into `DATABASE_URL`. Run `pnpm db:migrate:deploy` once from CI or your local terminal pointed at prod.
4. **Upstash Redis** — copy the connection string into `REDIS_URL`.
5. **Backblaze** — create a private bucket; create an application key with `Read+Write` on that bucket only. Fill `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE=true`.
6. **Resend** — verify the sending domain, copy the API key into `RESEND_API_KEY`.

### Worker on Vercel

The current scaffold runs the worker as a long-lived process. On Vercel, replace the `loan-reminders` cron with a Vercel Cron entry pointing at a route handler that does the sweep inline. Other queues (email, pdf, payment-webhook) become per-call inline handlers or QStash-backed.

## Option B — VPS (Docker Compose)

Recommended once volume justifies the DevOps cost or souveraineté is required (§10.6).

### Requirements

- Ubuntu 24.04 LTS
- Docker + Docker Compose plugin
- A reverse proxy with TLS (Caddy or Nginx + Certbot)
- Outbound SMTP/HTTP access for Resend / Wave / OM webhooks

### Layout

```
/opt/cpfa/
├── repo/                 # git clone of this repo
├── .env.production       # production secrets, NOT in git
└── caddy/Caddyfile       # reverse proxy config
```

### Bootstrap

```bash
# 1. Clone + env
git clone https://example.com/cpfa-platform.git /opt/cpfa/repo
cd /opt/cpfa/repo
cp .env.example /opt/cpfa/.env.production
$EDITOR /opt/cpfa/.env.production    # set production secrets

# 2. Run Postgres + Redis first so migrations succeed
docker compose -f docker/docker-compose.prod.yml --env-file /opt/cpfa/.env.production up -d postgres redis

# 3. Run DB migrations once
docker compose -f docker/docker-compose.prod.yml --profile tools run --rm migrate

# 4. Bring up web + worker
docker compose -f docker/docker-compose.prod.yml --env-file /opt/cpfa/.env.production up -d --build web worker
```

### TLS termination (Caddy)

```caddy
cpfa.example.org {
  reverse_proxy localhost:3000
}
```

`caddy run --config caddy/Caddyfile` — Let's Encrypt certificates handled automatically.

### Updates (rolling)

```bash
cd /opt/cpfa/repo
git pull
docker compose -f docker/docker-compose.prod.yml build web worker
docker compose -f docker/docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker/docker-compose.prod.yml up -d --no-deps web worker
```

The web service has a healthcheck on `/api/health`; the orchestrator only marks the new container healthy once the route returns 200.

## CI/CD

`.github/workflows/ci.yml` runs format/lint/typecheck/test/build on every push. To deploy automatically:

- **Vercel**: connect the GitHub repo — Vercel deploys on push to `main`.
- **VPS**: add a deploy job that SSHes to the VPS, runs `git pull && docker compose ...`. Use a deploy key with read-only repo access.

## Observability

- `/api/health` for uptime probes (no auth).
- Sentry: set `SENTRY_DSN`, then add `@sentry/nextjs` instrumentation (left for the operator — the env var is wired but the SDK is not yet installed).
- Logs: Docker captures stdout/stderr; ship to Better Stack / Axiom via the Docker logging driver.

## Rollback

See [`RUNBOOK.md`](RUNBOOK.md) for the exact rollback steps. TL;DR:

- **Vercel**: redeploy the previous successful deployment from the dashboard.
- **VPS**: `git checkout <previous-tag> && docker compose up -d --no-deps web worker`. Migrations are forward-only — if a migration is the cause, restore the DB from a backup before the migration ran.
