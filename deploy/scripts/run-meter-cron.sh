#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/env/.env.production"

set -a
source "$ENV_FILE"
set +a

# Prefer APP_BASE_URL; fall back to https://<DOMAIN> if DOMAIN is set in env
if [ -n "${APP_BASE_URL:-}" ]; then
  APP_URL="$APP_BASE_URL"
elif [ -n "${DOMAIN:-}" ]; then
  APP_URL="https://${DOMAIN}"
else
  echo "[cron] WARNING: APP_BASE_URL and DOMAIN are not set. Using placeholder URL."
  APP_URL="https://ecowater.example.com"
fi

curl --fail --show-error --silent \
  -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/update-meter-status"
