# Runbook — CPFA

Operational procedures. Read [`DEPLOYMENT.md`](DEPLOYMENT.md) first for context.

## On-call quick reference

| Symptom | First action |
|---|---|
| `/api/health` returning non-200 | Check Postgres + Redis health; tail web logs. |
| 500s on `/api/me/card` or `/api/registrations/*/convocation` | Most likely Prisma engine missing — verify `node_modules/.prisma` is in the runtime image. |
| Library reminders silent for 24 h | Worker container down — `docker compose ps worker`, then logs. The cron is `0 9 * * *` Africa/Dakar. |
| Payments stuck PENDING | Static-QR is manual — confirm via `/admin/payments`. Wave/OM webhooks: check provider dashboard for delivery, then `/admin/audit?entity=Payment`. |
| Storage uploads fail | Verify S3_ENDPOINT/keys, then bucket policy. `@cpfa/lib/storage` throws a clear error if env vars missing. |
| Auth loop on /admin | `AUTH_SECRET` mismatch between web replicas — rotate to a single value across all instances. |

## Deploy (VPS)

```bash
cd /opt/cpfa/repo
git fetch --tags
git checkout <new-tag>
docker compose -f docker/docker-compose.prod.yml build web worker
docker compose -f docker/docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker/docker-compose.prod.yml up -d --no-deps web worker
docker compose -f docker/docker-compose.prod.yml ps
```

Wait for `web` to report `healthy`. Smoke-test `/api/health`, `/`, `/sign-in`.

## Rollback

### Web/worker only (no schema change)

```bash
git checkout <previous-tag>
docker compose -f docker/docker-compose.prod.yml build web worker
docker compose -f docker/docker-compose.prod.yml up -d --no-deps web worker
```

### After a bad migration

Migrations are forward-only. If a migration broke prod:

1. Stop web + worker (`docker compose stop web worker`) so writes don't continue against the bad schema.
2. Restore Postgres from the latest pre-migration backup (see *Backups* below). Tag the restored database with the timestamp.
3. Check out the previous code tag.
4. Bring web + worker back up.
5. Open a postmortem ticket — the offending migration must be re-engineered before redeploying.

## Backups

### Postgres

Daily encrypted dump shipped to S3. From the host:

```bash
docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  pg_dump -U cpfa -Fc cpfa | \
  age -r "<recipient>" | \
  aws s3 cp - "s3://cpfa-backups/$(date -u +%Y-%m-%d).dump.age"
```

Retain 14 daily, 12 monthly, 7 yearly (3-2-1 rule with the off-site copy).

### Redis

Append-only file already enabled (`--save 60 1`). Mostly transient queue state — rebuilding from Postgres is acceptable, no separate backup needed.

### S3 / MinIO

Bucket lifecycle:

- versioning enabled
- delete-marker retention 30 days
- lifecycle rule: transition to cold-storage at 90 days (Backblaze B2 doesn't have tiers, skip)

## Restore

```bash
aws s3 cp "s3://cpfa-backups/2026-05-07.dump.age" - | \
  age -d -i ~/keys/age.key | \
  docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  pg_restore -U cpfa -d cpfa --clean --if-exists
```

Then restart web + worker. Run `pnpm db:migrate:deploy` only if the restored snapshot pre-dates new migrations that need to apply.

## Common ops

### Force-confirm a payment (dev/CS only)

Through the UI: `/admin/payments` → **Confirmer**. The action is logged in `AuditLog`.

### Manually invalidate a session

Rotating `AUTH_SECRET` invalidates every JWT. To target a single user, set `roles=[]` and the user loses access without the cookie expiring (their tRPC procedures re-check on every call).

### Inspect the audit log offline

```bash
docker compose exec postgres \
  psql -U cpfa -d cpfa -c "SELECT \"createdAt\",\"actorId\",action,entity,\"entityId\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 200"
```

### Replay a failed BullMQ job

```bash
docker compose exec redis redis-cli
> ZRANGE bull:email:failed 0 -1 WITHSCORES
> ZADD bull:email:wait <score> <jobId>
```

(Or use the admin UI of BullMQ Pro / `bull-board` if the operator wires it up.)

### Loan reminder sweep (manual)

If the cron missed a day:

```bash
docker compose exec worker node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('loan-reminders', { connection: { host: 'redis', port: 6379 } });
  q.add('sweep', {}).then(() => process.exit(0));
"
```

## Secrets rotation

| Secret | Rotation | Procedure |
|---|---|---|
| `AUTH_SECRET` | Every 90 days, or after suspected leak | `openssl rand -base64 32`, push to `.env.production`, restart web. All sessions invalidated. |
| Postgres password | After role changes | Update DB role + `.env.production`, rolling restart. |
| S3 keys | After staff changes | Issue new application key, update env, then revoke the old one once new image is healthy. |
| Wave / OM merchant keys | Per provider policy | Coordinate window with comptabilité — payments in flight may need manual reconciliation. |

## Incident severities

- **SEV1** — site down, payments unreachable: page primary on-call, status page incident, customers notified within 1 h.
- **SEV2** — single feature broken (e.g. /admin/audit 500s) but core flows work: ticket within 24 h.
- **SEV3** — cosmetic / non-blocking: backlog.

## Postmortems

Required for every SEV1, encouraged for SEV2. Template: timeline · root cause · contributing factors · what we'd do differently · action items with owner + date.
