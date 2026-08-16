#!/usr/bin/env bash
# =========================================================
# FRANKY TECH — Database Restore Script (Phase 30)
# -----------------------------------------------------------
# Usage:
#   ./scripts/restore.sh backups/franky-tech_2026-01-01_120000.sql.gz
#
# DESTRUCTIVE — this overwrites the target database's contents.
# Always confirm you're pointed at the database you intend to
# restore before running this, especially in production.
# =========================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/restore.sh <path-to-backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "[restore] File not found: $BACKUP_FILE"
  exit 1
fi

if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[restore] DATABASE_URL is not set. Configure your .env file first."
  exit 1
fi

echo "[restore] About to restore into: $DATABASE_URL"
echo "[restore] This will overwrite existing data. Type 'yes' to continue:"
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "[restore] Cancelled."
  exit 0
fi

gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "[restore] Done."
