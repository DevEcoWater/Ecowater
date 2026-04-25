# Deploy VPS Runbook

This runbook is intentionally split in two phases:

- **Phase 1:** Move app runtime to VPS, keep Supabase as database.
- **Phase 2:** Migrate database to PostgreSQL running on the VPS.

## 1) First-time setup on VPS

1. Clone repository into target directory.
2. Copy environment template:
   - `cp deploy/env/.env.example deploy/env/.env.production`
3. Fill `deploy/env/.env.production` with production values.

## 2) Phase 1: App on VPS + Supabase DB

Use this phase to validate Dockerized runtime without touching production schema migrations.

### Environment requirements

- Keep `DATABASE_URL` and `DIRECT_URL` pointing to Supabase.
- Set `SKIP_DB_MIGRATIONS=true` to avoid running `prisma migrate deploy` against production DB.
- Keep all external keys configured (`AUTH_SECRET`, `CRON_SECRET`, Maps, Firebase, CRM if used).

### Deploy steps

1. Build and start:
   - `docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production up -d --build`
2. Check health:
   - `curl -fsS http://127.0.0.1:3000/api/health`
3. Check logs:
   - `docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production logs -f app`
4. Confirm login and dashboard in browser.

## 3) Nginx and TLS on VPS

1. Copy `deploy/nginx/ecowater.conf` to `/etc/nginx/sites-available/ecowater`.
2. Update `server_name` with real domain or temporary host.
3. Enable site:
   - `sudo ln -s /etc/nginx/sites-available/ecowater /etc/nginx/sites-enabled/ecowater`
4. Validate and reload:
   - `sudo nginx -t`
   - `sudo systemctl reload nginx`
5. Issue TLS cert when domain is ready:
   - `sudo certbot --nginx -d your-domain -d www.your-domain`

## 4) Cron job (host)

Install a host crontab entry:

`0 6 * * * cd /path/to/repo && bash deploy/scripts/run-meter-cron.sh >> /var/log/ecowater-cron.log 2>&1`

This replaces Vercel cron and calls:
- `POST /api/cron/update-meter-status`

## 5) Phase 2: Migrate DB from Supabase to VPS Postgres

When Phase 1 is stable, move DB to VPS.

### Environment changes for cutover

1. Update `.env.production`:
   - Set `DATABASE_URL` and `DIRECT_URL` to `postgres:5432` service URLs.
   - Set real `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
2. Set `SKIP_DB_MIGRATIONS=false` for controlled migration apply on startup.

### Migration steps

Follow `deploy/docs/DB_MIGRATION_SUPABASE_TO_VPS.md`:

1. Dump Supabase DB.
2. Restore into VPS postgres container.
3. Run `prisma migrate deploy`.
4. Validate login, dashboard data, and cron behavior.

## 6) Daily operations

- Deploy latest:
  - `bash deploy/scripts/deploy.sh`
- Check service health:
  - `curl -fsS http://127.0.0.1:3000/api/health`
- Follow app logs:
  - `docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production logs -f app`

## 7) Backups

- Create DB backup:
  - `bash deploy/scripts/backup-db.sh`
- Restore DB backup:
  - `bash deploy/scripts/restore-db.sh deploy/backups/ecowater_YYYYMMDD_HHMMSS.sql.gz`

## 8) Rollback

`bash deploy/scripts/rollback.sh <git-ref>`

Example:
- `bash deploy/scripts/rollback.sh HEAD~1`
