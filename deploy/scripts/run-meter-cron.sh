#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/env/.env.production"

set -a
source "$ENV_FILE"
set +a

APP_URL="${APP_BASE_URL:-https://ecowater.example.com}"

curl --fail --show-error --silent \
  -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/update-meter-status"
