#!/usr/bin/env bash
# Daily encrypted Postgres backup → S3 (RUNBOOK.md §Backups).
#
# Usage (from the host running docker-compose.prod.yml):
#   AGE_RECIPIENT="age1..."             \
#   S3_BUCKET="cpfa-backups"            \
#   AWS_PROFILE=cpfa                    \
#   ./scripts/backup-postgres.sh
#
# Cron suggestion (host crontab):
#   15 2 * * *  /opt/cpfa/repo/scripts/backup-postgres.sh >> /var/log/cpfa-backup.log 2>&1
#
# Requires:  age, aws cli, docker compose plugin.
# Retention enforced server-side via S3 lifecycle policy (see RUNBOOK).

set -euo pipefail

: "${AGE_RECIPIENT:?AGE_RECIPIENT required (age public key)}"
: "${S3_BUCKET:?S3_BUCKET required (e.g. cpfa-backups)}"

PG_USER="${PG_USER:-cpfa}"
PG_DB="${PG_DB:-cpfa}"
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
STAMP="$(date -u +%Y-%m-%d)"
KEY="s3://${S3_BUCKET}/${STAMP}.dump.age"

echo "[backup] dumping ${PG_DB} → ${KEY}"

docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    pg_dump -U "${PG_USER}" -Fc "${PG_DB}" \
  | age -r "${AGE_RECIPIENT}" \
  | aws s3 cp - "${KEY}"

echo "[backup] done ${KEY}"
