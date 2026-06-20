#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/env/.env.production"
BACKUP_DIR="$ROOT_DIR/deploy/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

set -a
source "$ENV_FILE"
set +a

# CLIENT_SLUG is set in .env.production; defaults to "ecowater" for the base instance
SLUG="${CLIENT_SLUG:-ecowater}"
POSTGRES_CONTAINER="${SLUG}-postgres"
OUTPUT_FILE="$BACKUP_DIR/${SLUG}_${TIMESTAMP}.sql.gz"

echo "[backup] Creating PostgreSQL dump (container: ${POSTGRES_CONTAINER})..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUTPUT_FILE"

echo "[backup] Saved to $OUTPUT_FILE"
