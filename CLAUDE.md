# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and any other AI agent working in this repository. The human-oriented version, with every command, is `docs/FLUJO_DE_TRABAJO.md` — read it before touching deploys, the database or a new client.

## What this is

Ecowater is a Next.js 14 (App Router) water-metering platform for water cooperatives. It ingests readings from smart meters over LoRa via a gateway, stores them in PostgreSQL through Prisma, and exposes an admin dashboard plus an operator portal for manual readings of mechanical meters. It can also open/close meter valves remotely over MQTT.

**One repository serves several clients (tenants).** Today: **COSEGO** (production, real members and real valves, `app.ecowater.com.ar`) and **Olmos** (demo with invented data, `olmos.ecowater.com.ar`). Each client is its own Docker stack with its own database on the same VPS. The code is identical; what differs is configuration (see "Clients").

## Rules for agents (read first)

- **Never deploy, restart containers, or change anything on the VPS unless the user explicitly asks in this conversation.** COSEGO is production: a wrong command can cut a real member's water or lose readings. Read-only inspection over `ssh ecowater-vps` is fine.
- **Never touch the MQTT broker, `gateway_001`, or the COSEGO database** without an explicit request. Never send valve commands. Valve commands are not instantaneous (meters execute them on their next report, ~12 h) and are queued per meter.
- **Deploy order: Olmos (demo) first, verify, then COSEGO.** Use `deploy/scripts/deploy-client.sh` (backs up, deploys, rolls back by itself). Do not deploy right before a demo or meeting, and not while the gateway is transmitting.
- **Both servers must end the day on the same commit of the same branch.**
- **Database changes are additive only, and the SQL is applied BEFORE the new code starts.** Never run `prisma migrate dev|deploy` or `db push --accept-data-loss` against production (see Gotchas).
- **Never point `.env.local` at production.** Local dev uses a throwaway Postgres; leave `MQTT_BROKER_URL` empty and `FEATURE_VALVE_CONTROL=false`.
- **Never fork the repo or keep branches per client.** Per-client behavior goes in `config/clients/<id>.ts`, env flags, or data.
- **Never commit** secrets, any `.env*`, `deploy/mqtt/` keys/certs, or `.claude/settings.local.json` (it is per-developer; it is in `.gitignore` and must not be tracked).
- **Commits:** conventional commits with gitmoji (`feat(valve): :sparkles: ...`). **Do not add AI attribution or `Co-Authored-By` lines**, including in squash-merge messages.
- **Do not modify the user's uncommitted local changes.** Check `git status` before switching branches or committing, and stage files explicitly (never `git add -A`).
- **Report faithfully.** There are no tests or linter configured: say what you verified (`tsc`, `build`, a query, a screenshot) and what you did not.
- Passwords and secrets must not be pasted in chat or printed; generate them on the server or locally and tell the user where they are stored. If a secret was exposed, say it should be rotated.
- When a lookup table maps a status to a label (chips, cards), always provide a fallback: a value missing from the table must not crash the page.

## Commands

```bash
npm run dev                     # Next dev server (http://localhost:3000)
NEXT_PUBLIC_CLIENT=olmos npm run dev   # run as a specific client (default: ecowater)
npx tsc --noEmit                # type check (do this before every PR)
NEXT_PUBLIC_CLIENT=olmos npx next build  # production build (runs prisma generate via postinstall)
npm run format                  # prettier --write .
```

`npm run lint` is not configured (it prompts for an ESLint setup) and there is no test runner.

Prisma dev scripts load `.env.local` via `dotenv-cli`, so use npm scripts for them:

```bash
npm run prisma:studio        # Prisma Studio
npm run prisma:push          # push schema to the DB in .env.local — throwaway local DBs only
npm run prisma:generate      # regenerate client (run after editing schema.prisma, before tsc)
npm run create-admin         # needs ADMIN_EMAIL / ADMIN_PASSWORD
```

`prisma:migrate*` scripts exist but **must not be used against production** (see Gotchas).

Deploy scripts live in `deploy/scripts/`: `deploy-client.sh` (the standard way to deploy one client), `backup-db.sh`, `restore-db.sh`, `rollback.sh`, `run-meter-cron.sh`. The older `deploy.sh` does a bare `git pull` + `up --build` of every service and has no safety net; prefer `deploy-client.sh`.

## Clients (multi-tenant by deployment)

- `config/client.config.ts` holds the `ClientConfig` type, the COSEGO values and a **registry** of clients. The active client is chosen **at build time** by `NEXT_PUBLIC_CLIENT` (compose: `CLIENT_CONFIG`, default `ecowater`). An unknown id fails the build.
- Each other client lives in `config/clients/<id>.ts` (`brand`, `theme.accentHex`, `locale`, `geo`, `featureFlags`). `brand.logoOnly` shows the logo alone (larger, on a dark tile) when the logo already carries the name.
- Precedence when rendering branding: the cooperative's DB row (`Cooperative.name`, `logo_url`) wins; `clientConfig.brand.*` is the fallback.
- Secrets and anything that rotates stay in env (`deploy/env/.env.production` of each checkout, never committed): `CLIENT_SLUG`, `CLIENT_CONFIG`, ports, URLs, keys, `FEATURE_*` overrides.
- Optional modules use feature flags: `featureFlags` in the client config, overridden by `FEATURE_*` env, exposed at `/api/cooperative/packs` and read in the UI with `useFeaturePacks()`. **Only `valve_control` actually gates anything in the UI today**; `advanced_export` and `urgencies` exist as flags but nothing depends on them.
- To add a client, follow "Cliente nuevo" in `docs/FLUJO_DE_TRABAJO.md` and `deploy/docs/MULTI_CLIENT_SAME_VPS.md`.

## Architecture

### Two app surfaces, role-gated
- `app/dashboard/*` — admin/`lector` UI (meters, zones, users, operators, map, cooperative, plans).
- `app/portal/*` — `operario` UI for submitting manual readings (same login page; the `operario` role is redirected from `/dashboard` to `/portal`).
- `middleware.ts` enforces roles from the NextAuth JWT: `lector` is restricted to `/dashboard/mapa` and `/dashboard/zonas` (and cannot open a zone's route-config page); `operario` is redirected to `/portal`. The matcher only covers `/dashboard/*` and `/portal/*` — **`/api/*` is not covered by the middleware**, so each route must check the session itself. Several routes still do not (see Gotchas).
- Authorization helpers: `lib/auth/roles.ts` (`canEditDashboard`), `lib/auth/require-editor.ts`, `lib/auth/authorize-destructive-action.ts` (admin + write permission + re-entered password; used for deleting meters and users). Role gating is split between `middleware.ts` and per-route checks — change both when touching authorization.

### Auth
- NextAuth Credentials provider (`lib/authOptions.ts`), JWT sessions, bcrypt. The user's single role (`userRoles[0]`) is denormalized into the token. Sign-in page: `/auth/login`.
- The secret is read as `AUTH_SECRET` → `NEXTAUTH_SECRET` only (`lib/authOptions.ts`, mirrored in `middleware.ts` — keep both in sync). No `NEXT_PUBLIC_AUTH_SECRET` fallback.
- **`NEXTAUTH_URL` must be set** to the client's public URL (it is in both servers' env). Without it NextAuth falls back to `http://localhost:3000` for redirects.

### Gateway ingestion pipeline (core data flow)
`POST /api/gateway` (`app/api/gateway/route.ts`, `force-dynamic`) receives LoRa uplink payloads over HTTPS. The hex `data` field is decoded by `utils/parse*` (`parseFlowHex`, `parseMeterData`, `parseMeterStatus`, `parseInstantaneousFlow`, `parseTemperature`, `parseTimestamp`). One uplink writes a `Reading` plus its `Status` (valve/battery/alarms) and `RxInfo` (per-gateway signal). The parsers are the contract with the physical meters and the fragile part of the system: change them only with a concrete payload to check against. Reading time comes from the gateway's unix `timestamp`, not the meter's clock.

Stored conventions (respect them in seeds and new code): `Status.valve_status` is `open|closed|abnormal|unknown`; `battery_voltage` is `normal|low`; a manual reading of a mechanical meter stores the value in **both** `cumulative_flow` and `instantaneous_flow`.

### Data model (`prisma/schema.prisma`, PostgreSQL 16)
`Cooperative` → `User` (1:1 `Address`, roles via `UserRole`/`Role`) → `UserMeter` → `Meter`. A `Meter` has many `Reading`s; each `Reading` has `Status[]`, `RxInfo[]` (FK to `Gateway`). `Meter.has_valve` marks smart meters that really have a valve. `Zone` holds a polygon (Json, `[{lat,lng}]`) linked to operators (`ZoneOperator`) and exports (`ZoneDownload`). `ValveEvent` is the audit of valve commands (no FK to `Meter` on purpose, so it survives deleting a meter). Point-in-polygon: `lib/point-in-polygon.ts`.

### MQTT valve control
`lib/mqtt-client.ts` publishes (QoS 1) to `application/<application_id>/device/<devEUI>/tx` — `application_id` is per meter, never a global fallback. `app/api/meter/[id]/valve/route.ts`: session + `admin` role + `canWrite`, then the meter must be `SMART`, have `dev_eui`, `application_id` and **`has_valve`** (else 422), and a command equal to one still waiting is rejected (409). Every command is audited in Postgres (`lib/valve-audit.ts`, table `ValveEvent`); the old Mongo audit no longer exists. `VALVE_BYPASS_AUTH=true` skips the auth checks outside production and still publishes to whatever `MQTT_BROKER_URL` points at — never enable it near a real broker.

Behavior to keep in mind: the broker is our own Mosquitto 2.1.2 (`deploy/compose/docker-compose.prod.yml`; real config, passwords and certs are local-only and gitignored under `deploy/mqtt/`). The app talks to it internally (`mqtt://mqtt:1883`); the gateway connects to `mqtt.ecowater.com.ar:8883` with TLS as `gateway_001` (client id `GW_Indoor_EcoWater_001`, persistent session). A command only reaches the meter if the gateway is connected; the meter executes it on its next uplink and confirms by reporting the new `valve_status`. The panel derives "command in progress" from the audit plus the reported state (`utils/valve-pending.ts`), not from browser state. "Enviado" only proves the broker received it.

### Meter liveness and dashboard counts
There are three different notions of a smart meter's state; do not conflate them:
- **Connectivity (computed):** a reading in the last 24 h → `ONLINE` (`computeChipStatus`, `app/api/meter`).
- **Stored status** (`Meter.status`): set by ingestion from the last reading's alarms (`FAULTY` for empty pipe / reverse flow, `MAINTENANCE` for low battery) and flipped `ACTIVE`↔`INACTIVE` by the dashboard stats route (`app/api/dashboard/stats`, which **writes to the DB when the dashboard is opened**). A `FAULTY` meter never goes back to `INACTIVE` by itself.
- **Alarms** (`/api/urgencies`): derived from the last reading's `Status`; the dashboard asks for `limit=20`, which caps alerts returned, not meters inspected.

`app/api/cron/update-meter-status` (guarded by `CRON_SECRET`) does a similar job, but **no cron or timer schedules it on the VPS today**.

## Frontend conventions
- UI is Radix primitives + Tailwind in a shadcn-style layer under `components/` (`components/ui/` for primitives; there is no `Switch` — see `valve-commands-card.tsx` for the inline toggle). `cn()` in `lib/utils.ts` merges classes.
- Data fetching uses `@tanstack/react-query`; feature hooks live in `hooks/<domain>/`. Forms use `react-hook-form` + `zod`. Server mutations use `next-safe-action` via `actionClient` in `lib/safe-action.ts`. Light client state uses `zustand`.
- The dashboard caches several API responses with `unstable_cache` for **one hour, including empty results**: after loading data into a fresh database the dashboard may show zeros until the app container is recreated.
- Dates: dayjs is configured for Argentina (`utils/configureDayjs.ts`, `utils/timestampConverter.ts`). Meter timestamps need explicit AR conversion.
- Maps use `@react-google-maps/api` (`providers/google-maps-provider.tsx`). The Google API key is restricted by HTTP referrer: **a new domain must be added to the key** or the map will not load there.
- File uploads go through `uploadthing`; transactional email through `resend`.
- Guided tours live in `config/tours.*` and are wired through `components/dashboard/page-header/page-header-route.ts`.

## Deploy (VPS, self-hosted)
One VPS, two stacks (details and ports in `docs/FLUJO_DE_TRABAJO.md`):

| | Checkout | Docker project | App port | DB |
|---|---|---|---|---|
| COSEGO | `/var/www/ecowater/Ecowater` | `ecowater` | 3000 | `ecowater_cosego` |
| Olmos | `/var/www/olmos/Ecowater` | `olmos` | 3001 | `ecowater_olmos` |

nginx (443, Let's Encrypt via certbot timer) routes by domain to `127.0.0.1:<port>`; Postgres, the internal broker port and pgweb listen only on loopback. `pgweb.ecowater.com.ar` (basic auth in nginx, read-only, `--lock-session`) only shows the COSEGO database; Olmos's database is reachable through an SSH tunnel to port 5433. Access: `ssh ecowater-vps` (user `deploy`, key-based, `sudo -n` for Docker/nginx; the repos are owned by root so git needs `sudo`).

Standard deploy: `ssh ecowater-vps 'sudo -n bash -s -- --dir <checkout> --branch main' < deploy/scripts/deploy-client.sh` (add `--check` to only inspect, `--sql <file>` for an additive migration). Rollback images are tagged `<slug>-app:rollback-<date>`.

Status to be aware of: **there are no scheduled database backups** (only manual dumps in `/var/www/ecowater/backups/`), SSH is exposed on port 5306 with root login enabled, and the server has a pending kernel reboot. See `docs/FLUJO_DE_TRABAJO.md` §10.

## Git workflow
- `main` is the trunk; everything enters through PRs with required review. Branches: `feature/<ticket>_<topic>` or `fix/<ticket>_<topic>`, cut from an up-to-date `main`.
- `release/<name>` integration branches are for shipping several PRs together by a deadline; merge them to `main` with a **merge commit** so the included PRs show as merged.
- Squash-merge single-feature PRs; keep the message free of `Co-Authored-By` lines.
- Each PR description must say what has to be done on deploy (SQL, env vars).
- Demo data: `prisma/demo-sql.ts` generates SQL for an invented cooperative (refuses to run unless the cooperative name ends in `(demo)` and the database has no meters); `deploy/sql/demo-refresh.sql` moves the demo timeline to "now" because dashboards look at the last 24 h; `deploy/sql/bootstrap-instance.sql` creates roles, cooperative and admin for a new database.

## Gotchas
- **The production DB was built with `prisma db push`**, so `_prisma_migrations` does not exist while `prisma/migrations/` holds migrations. COSEGO runs with `SKIP_DB_MIGRATIONS=true`. Do **not** run `prisma:migrate` (migrate dev offers to reset the schema → total data loss) or `prisma:migrate:deploy` (fails with `already exists`). New columns: additive, with a default, via an SQL file applied before the code. A brand-new database gets its whole schema with `prisma@5.22.0 db push` from a throwaway container (see the workflow doc).
- **The container entrypoint's bootstrap (`BOOTSTRAP_ON_START=true`) is broken** in the standalone image: `npx prisma db seed` downloads Prisma 7 and `create-admin` cannot find `bcryptjs`; the container then crash-loops. Use `deploy/sql/bootstrap-instance.sql` and keep `BOOTSTRAP_ON_START=false`.
- `next.config.mjs` uses `output: "standalone"` and `experimental.serverComponentsExternalPackages: ["mqtt", "@google-cloud/vision"]` (the 14.x key; `serverExternalPackages` is Next 15 naming and is ignored on 14.2). Packages not traced into the standalone build are missing at runtime.
- `app/api/cooperative/packs` must stay `force-dynamic`, otherwise its response is frozen at build time.
- Several API routes do not require a session yet: `PUT` and `PATCH` (status) on `/api/meter/[id]`, many `/api/dashboard/*` endpoints and `/api/urgencies`. Add a session check when touching them.
- Changing the env of a service recreates every container sharing that `env_file` (the database too). Data lives in a Docker volume and survives, but the container restarts.
- `docker compose exec -T` inside a script piped over `ssh ... bash -s` swallows the rest of the script from stdin; add `</dev/null`. In zsh, never name a variable `path`.
- `utils/parseTimestamp .ts` has a trailing space in its filename; imports must keep it (`@/utils/parseTimestamp `).
- Roles seen in code: `admin`, `supervisor`, `user`, `operario`, `lector` (seeded). Admin is the unrestricted default.
