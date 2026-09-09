# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ecowater is a Next.js 14 (App Router) water-metering platform for a cooperative. It ingests readings from smart water meters over LoRa via a gateway, stores them in PostgreSQL through Prisma, and exposes an admin dashboard plus an operator portal for manual readings. Outbound MQTT control to remotely open/close meter valves (ED-88) is merged and live on `main`.

## Commands

```bash
npm run dev            # Next dev server (http://localhost:3000)
npm run build          # Production build (runs prisma generate via postinstall)
npm run lint           # next lint
npm run format         # prettier --write .
```

Prisma — all dev scripts load `.env.local` via `dotenv-cli`, so run them through npm, not raw `prisma`:

```bash
npm run prisma:studio        # Prisma Studio
npm run prisma:migrate       # create + apply a dev migration
npm run prisma:migrate:safe  # create migration only (--create-only), review before applying
npm run prisma:push          # push schema without a migration (prototyping)
npm run prisma:pull          # introspect DB into schema
npm run prisma:generate      # regenerate client
```

`prisma:migrate:deploy` and `prisma:migrate:resolve` are the production-safe variants (no `.env.local`) used on the VPS.

Cron (meter status job) can be hit locally:

```bash
npm run cron:update-meters   # POST /api/cron/update-meter-status
npm run cron:check-status    # GET  /api/cron/update-meter-status
```

There is no test runner configured in this project.

## Architecture

### Two app surfaces, role-gated
- `app/dashboard/*` — admin/`lector` UI (meters, zones, users, operators, map, cooperative).
- `app/portal/*` — `operario` UI for submitting manual readings.
- `middleware.ts` enforces roles from the NextAuth JWT: `lector` is restricted to `/dashboard/mapa` and `/dashboard/zonas`; `operario` is redirected from `/dashboard` to `/portal`. The matcher only covers `/dashboard/*` and `/portal/*`.

### Auth
- NextAuth with a Credentials provider (`lib/authOptions.ts`), JWT session strategy, bcrypt password compare. The user's single role (`userRoles[0]`) is denormalized into the token and session. Sign-in page is `/auth/login`.
- The secret is read as `AUTH_SECRET` → `NEXTAUTH_SECRET` only (`lib/authOptions.ts:6`, mirrored in `middleware.ts:7` — keep both in sync). There is **no** `NEXT_PUBLIC_AUTH_SECRET` fallback; a secret placed there is silently ignored and NextAuth runs with `secret: undefined`.

### Gateway ingestion pipeline (core data flow)
`POST /api/gateway` (`app/api/gateway/route.ts`, `force-dynamic`) receives LoRa uplink payloads. The hex `data` field is decoded by the parsers in `utils/parse*` (`parseFlowHex`, `parseMeterData`, `parseMeterStatus`, `parseInstantaneousFlow`, `parseTemperature`, `parseTimestamp`). One uplink writes a `Reading` plus its related `Status` (valve/battery/alarms) and `RxInfo` (per-gateway signal: rssi, snr, location). The parser logic is the fragile part of the system — recent commits (ED-87) repeatedly fixed flow/cumulative decoding. Treat the `utils/parse*` functions as the contract with the physical meters.

### Data model (`prisma/schema.prisma`, PostgreSQL)
Hierarchy: `Cooperative` → `User` (1:1 `Address`, roles via `UserRole`/`Role`) → `UserMeter` → `Meter`. A `Meter` has many `Reading`s; each `Reading` has `Status[]`, `RxInfo[]` (FK to `Gateway`). `Zone` holds a GeoJSON-ish `polygon` (Json) and is linked to operators (`ZoneOperator`) and exports (`ZoneDownload`). Enums drive lifecycle: `MeterStatus`, `OperationalStatus`, `ReadingStatus`, `RxInfoStatus`, `UserStatus`, `ZoneStatus`, `MeterType`. Point-in-polygon checks (`lib/point-in-polygon.ts`) map meter lat/lng to zones.

### Cron / meter liveness
`app/api/cron/update-meter-status` marks meters `INACTIVE` after 24h without readings and back to `ACTIVE` when they resume. Guarded by `CRON_SECRET` (Bearer). On the VPS it is driven by `deploy/scripts/run-meter-cron.sh`, not Vercel Cron.

### MQTT valve control (ED-88, merged to `main` in PR #54)
`lib/mqtt-client.ts` publishes commands; `app/api/meter/[id]/valve/route.ts` is the open/close endpoint; `app/api/user/[id]/can-write` + `lib/mongo-audit.ts` gate who may issue commands and log it. The Mosquitto broker config is in `deploy/mqtt/` (local-only, gitignored: passwords, certs, data, log, real `mosquitto.conf`); listeners `1883` plain and `8883` TLS, `allow_anonymous false` with per-gateway passwords. `deploy/compose/docker-compose.prod.yml` defines the `mqtt` service (`eclipse-mosquitto:2`).

The valve `POST` checks session + `ADMIN` role + `canWrite` (`app/api/meter/[id]/valve/route.ts:25-37`), but `VALVE_BYPASS_AUTH=true` skips all three outside production and still publishes to whatever `MQTT_BROKER_URL` points at — see the local-env gotcha below.

### Per-client config layer (multicliente, merged in PR #59)
`config/client.config.ts` is the single source of truth for everything that varies per client and is committed to the repo — the repo *is* the client. It holds `brand` (name, logo, logoMark, favicon), `theme.accentHex`, `locale` (lang, timezone, currency), `geo` (map center/bounds, default location) and feature toggles. Secrets and rotating keys stay in env; the file's header comment lists every hardcoded location it replaced.

Precedence when rendering branding: the cooperative's own row in the DB wins (`Cooperative.name`, `logo_url`), and `clientConfig.brand.*` is the fallback — so a deploy works before any cooperative is seeded. `scripts/create-client.mjs` scaffolds a new per-client repo and `prisma/create-admin.ts` bootstraps a fresh instance's admin user.

## Frontend conventions
- UI is Radix primitives + Tailwind in a shadcn-style component layer under `components/` (`components/ui/` for primitives). `cn()` in `lib/utils.ts` merges classes.
- Data fetching uses `@tanstack/react-query`; feature hooks live in `hooks/<domain>/`. Forms use `react-hook-form` + `zod`. Server mutations use `next-safe-action` via `actionClient` in `lib/safe-action.ts`. Light client state uses `zustand`.
- Dates: dayjs is centrally configured for Argentina timezone (`utils/configureDayjs.ts`, `utils/timestampConverter.ts`). Use these helpers — meter timestamps need explicit AR conversion.
- Maps use `@react-google-maps/api` (provider in `providers/google-maps-provider.tsx`); zones are drawn/edited as polygons.
- File uploads go through `uploadthing`; transactional email through `resend`.

## Deploy (VPS, self-hosted)
The project migrated off Supabase to a self-hosted Postgres on a VPS (see `deploy/docs/DB_MIGRATION_SUPABASE_TO_VPS.md` and `DEPLOY_VPS.md`). `deploy/compose/docker-compose.prod.yml` runs `postgres:16-alpine` + the `app` container behind `deploy/nginx/ecowater.conf`. Operational scripts in `deploy/scripts/` (`deploy.sh`, `rollback.sh`, `backup-db.sh`, `restore-db.sh`). Production env lives in `deploy/env/`. The container entrypoint (`deploy/docker/entrypoint.sh`) runs `prisma migrate deploy` on boot.

## Git workflow
Branches flow `feature/*` → `main` via PRs. Origin currently has only `main` plus live feature branches (`feature/multicliente-config-layer`, `feature/sprint-technical-changes`) — the `dev` and `qa` branches no longer exist. Feature branches are prefixed with a tracker id, e.g. `feature/ED-88_...`. Commit messages use conventional commits (often with gitmoji); do not add AI attribution / Co-Authored-By lines.

## Gotchas
- Local dev has historically pointed at **production** (`app.ecowater.com.ar`): the Supabase pooler, the HiveMQ cloud broker and the Mongo audit cluster in `.env.local` are the live ones. Before enabling `VALVE_BYPASS_AUTH` or `FEATURE_VALVE_CONTROL`, confirm `DATABASE_URL`/`MQTT_BROKER_URL` are not production — a bypassed valve `POST` closes a real member's water. `npm run cron:update-meters` (POST) likewise rewrites live meter statuses.
- The production DB was built with `prisma db push`, so **`_prisma_migrations` does not exist** while `prisma/migrations/` holds 5 migrations. `prisma migrate status` therefore reports all 5 as unapplied even though the 14 tables match `schema.prisma`. Do **not** run `prisma:migrate` (migrate dev offers to reset the schema → total data loss) or `prisma:migrate:deploy` (fails with `already exists`). To make migrations usable, baseline first with `prisma:migrate:resolve` for each of the 5.
- `next.config.mjs` sets `serverExternalPackages`, which is Next 15 naming; on Next 14.2 it is ignored (the dev server warns). The 14.x key is `experimental.serverComponentsExternalPackages` — relevant to how `mqtt`, `mongodb` and `@google-cloud/vision` get bundled.
- Several API routes instantiate `new PrismaClient()` at module scope per file rather than sharing a singleton — be aware when reasoning about connection counts.
- `utils/parseTimestamp .ts` has a trailing space in its filename; imports must keep it (`@/utils/parseTimestamp `).
- Roles seen in code: `lector`, `operario` (admin is the unrestricted default). Role gating is split between `middleware.ts` and per-route checks — change both when touching authorization.
