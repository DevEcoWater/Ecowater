#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/env/.env.production"
BACKUP_DIR="$ROOT_DIR/deploy/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="$BACKUP_DIR/ecowater_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

set -a
source "$ENV_FILE"
set +a

echo "[backup] Creating PostgreSQL dump..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" ecowater-postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUTPUT_FILE"

echo "[backup] Saved to $OUTPUT_FILE"
