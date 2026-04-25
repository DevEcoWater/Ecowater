#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <git-ref>"
  exit 1
fi

TARGET_REF="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deploy/compose/docker-compose.prod.yml"

echo "[rollback] Fetching refs..."
git -C "$ROOT_DIR" fetch --all --prune

echo "[rollback] Checking out $TARGET_REF ..."
git -C "$ROOT_DIR" checkout "$TARGET_REF"

echo "[rollback] Rebuilding and starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ROOT_DIR/deploy/env/.env.production" up -d --build

echo "[rollback] Done."
