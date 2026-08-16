#!/usr/bin/env bash
# =========================================================
# FRANKY TECH — Database Backup Script (Phase 30)
# -----------------------------------------------------------
# Usage:
#   ./scripts/backup.sh
#
# Reads DATABASE_URL from .env, dumps a timestamped, compressed
# backup into ./backups/, and prunes anything older than
# RETENTION_DAYS (default 30). Intended to run on a daily cron
# job — see DEPLOYMENT.md for how to schedule it on your host.
#
# Never rely on your hosting provider's own snapshots alone —
# they're usually retained for a much shorter window than a
# real disaster-recovery policy needs, and they don't protect
# against you accidentally dropping a table yourself.
# =========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] DATABASE_URL is not set. Configure your .env file first."
  exit 1
fi

RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/franky-tech_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Dumping database to $BACKUP_FILE ..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
echo "[backup] Done: $(du -h "$BACKUP_FILE" | cut -f1)"

echo "[backup] Pruning backups older than $RETENTION_DAYS days ..."
find "$BACKUP_DIR" -name "franky-tech_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[backup] Current backups:"
ls -lh "$BACKUP_DIR"
