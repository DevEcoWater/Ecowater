#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/env/.env.production"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "[restore] Restoring $BACKUP_FILE ..."
gunzip -c "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" ecowater-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "[restore] Restore completed."
