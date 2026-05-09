#!/bin/sh
set -e

MAX_ATTEMPTS="${DB_CONNECT_MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${DB_CONNECT_SLEEP_SECONDS:-3}"
ATTEMPT=1
SKIP_MIGRATIONS="${SKIP_DB_MIGRATIONS:-false}"

if [ "$SKIP_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] SKIP_DB_MIGRATIONS=true, skipping Prisma migrate deploy."
else
  echo "[entrypoint] Checking database connectivity with Prisma..."
  until npx prisma migrate deploy >/tmp/prisma-migrate.log 2>&1; do
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
      echo "[entrypoint] Database not reachable after ${MAX_ATTEMPTS} attempts."
      cat /tmp/prisma-migrate.log
      exit 1
    fi

    echo "[entrypoint] DB not ready yet (attempt ${ATTEMPT}/${MAX_ATTEMPTS}), retrying in ${SLEEP_SECONDS}s..."
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$SLEEP_SECONDS"
  done

  echo "[entrypoint] Prisma migrations applied."
fi

echo "[entrypoint] Starting Next.js..."
exec env HOSTNAME=0.0.0.0 PORT="${PORT:-3000}" node server.js
