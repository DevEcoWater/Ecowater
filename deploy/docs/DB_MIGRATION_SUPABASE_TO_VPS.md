# Database migration: Supabase Postgres -> VPS Postgres

## Preconditions

- `deploy/compose/docker-compose.prod.yml` exists and starts `postgres`.
- `deploy/env/.env.production` has valid `POSTGRES_*` values.
- You have Supabase DB credentials and network access.

## 1) Start local VPS postgres container

`docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production up -d postgres`

## 2) Create dump from Supabase

Use a machine with access to Supabase and `pg_dump` installed:

`pg_dump --no-owner --no-acl --format=plain --dbname "postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require" > supabase_dump.sql`

If your DB name is not `postgres`, replace it accordingly.

## 3) Restore dump into VPS postgres container

`cat supabase_dump.sql | docker exec -i -e PGPASSWORD=$POSTGRES_PASSWORD ecowater-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB`

## 4) Validate schema and data

1. Run migrations (safe no-op if already aligned):
   - `docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production run --rm app npx prisma migrate deploy`
2. Quick row count check:
   - `docker exec -e PGPASSWORD=$POSTGRES_PASSWORD ecowater-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\\dt"`

## 5) Cutover checklist

- Confirm app login works.
- Confirm dashboard data loads.
- Confirm cron endpoint updates meter statuses.
- Keep Supabase read-only backup until VPS is stable.
