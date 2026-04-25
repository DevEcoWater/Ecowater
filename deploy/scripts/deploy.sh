#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deploy/compose/docker-compose.prod.yml"

echo "[deploy] Pulling latest changes..."
git -C "$ROOT_DIR" pull --ff-only

echo "[deploy] Building and starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ROOT_DIR/deploy/env/.env.production" up -d --build

echo "[deploy] Current status:"
docker compose -f "$COMPOSE_FILE" ps
