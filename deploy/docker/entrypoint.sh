#!/bin/sh
set -e

MAX_ATTEMPTS="${DB_CONNECT_MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${DB_CONNECT_SLEEP_SECONDS:-3}"
ATTEMPT=1
SKIP_MIGRATIONS="${SKIP_DB_MIGRATIONS:-false}"
BOOTSTRAP="${BOOTSTRAP_ON_START:-false}"

# ──────────────────────────────────────────────────────────────────────────────
# Phase 1: Migrations
# ──────────────────────────────────────────────────────────────────────────────
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

# ──────────────────────────────────────────────────────────────────────────────
# Phase 2: Bootstrap (fresh-instance setup)
# Only runs when BOOTSTRAP_ON_START=true. Both scripts are idempotent —
# safe to re-run but skipping them on normal restarts avoids unnecessary work.
#
# To bootstrap a new instance, set in .env.production:
#   BOOTSTRAP_ON_START=true
#   COOP_NAME=<cooperative name>
#   COOP_LOCATION=<city>
#   COOP_CONTACT=<contact person>
#   COOP_PHONE=<phone>
#   ADMIN_EMAIL=<admin email>
#   ADMIN_PASSWORD=<admin password>
#
# After first boot, set BOOTSTRAP_ON_START=false to suppress on subsequent restarts.
# ──────────────────────────────────────────────────────────────────────────────
if [ "$BOOTSTRAP" = "true" ]; then
  echo "[entrypoint] BOOTSTRAP_ON_START=true — running seed and admin setup..."

  echo "[entrypoint] Running: prisma db seed (roles + cooperative)..."
  npx prisma db seed

  echo "[entrypoint] Running: create-admin..."
  npx tsx prisma/create-admin.ts

  echo "[entrypoint] Bootstrap complete."
fi

# ──────────────────────────────────────────────────────────────────────────────
# Phase 3: Start app
# ──────────────────────────────────────────────────────────────────────────────
echo "[entrypoint] Starting Next.js..."
exec env HOSTNAME=0.0.0.0 PORT="${PORT:-3000}" node server.js
