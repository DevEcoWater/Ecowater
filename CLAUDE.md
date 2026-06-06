# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ecowater is a Next.js 14 (App Router) water-metering platform for a cooperative. It ingests readings from smart water meters over LoRa via a gateway, stores them in PostgreSQL through Prisma, and exposes an admin dashboard plus an operator portal for manual readings. An in-progress feature (branch `feature/ED-88_add-mqtt-communication-to-gateway`) adds outbound MQTT control to remotely open/close meter valves.

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
- `AUTH_SECRET` is read with fallbacks: `AUTH_SECRET` → `NEXTAUTH_SECRET` → `NEXT_PUBLIC_AUTH_SECRET` (mirrored in `middleware.ts` — keep both in sync).

### Gateway ingestion pipeline (core data flow)
`POST /api/gateway` (`app/api/gateway/route.ts`, `force-dynamic`) receives LoRa uplink payloads. The hex `data` field is decoded by the parsers in `utils/parse*` (`parseFlowHex`, `parseMeterData`, `parseMeterStatus`, `parseInstantaneousFlow`, `parseTemperature`, `parseTimestamp`). One uplink writes a `Reading` plus its related `Status` (valve/battery/alarms) and `RxInfo` (per-gateway signal: rssi, snr, location). The parser logic is the fragile part of the system — recent commits (ED-87) repeatedly fixed flow/cumulative decoding. Treat the `utils/parse*` functions as the contract with the physical meters.

### Data model (`prisma/schema.prisma`, PostgreSQL)
Hierarchy: `Cooperative` → `User` (1:1 `Address`, roles via `UserRole`/`Role`) → `UserMeter` → `Meter`. A `Meter` has many `Reading`s; each `Reading` has `Status[]`, `RxInfo[]` (FK to `Gateway`). `Zone` holds a GeoJSON-ish `polygon` (Json) and is linked to operators (`ZoneOperator`) and exports (`ZoneDownload`). Enums drive lifecycle: `MeterStatus`, `OperationalStatus`, `ReadingStatus`, `RxInfoStatus`, `UserStatus`, `ZoneStatus`, `MeterType`. Point-in-polygon checks (`lib/point-in-polygon.ts`) map meter lat/lng to zones.

### Cron / meter liveness
`app/api/cron/update-meter-status` marks meters `INACTIVE` after 24h without readings and back to `ACTIVE` when they resume. Guarded by `CRON_SECRET` (Bearer). On the VPS it is driven by `deploy/scripts/run-meter-cron.sh`, not Vercel Cron.

### MQTT valve control (feature ED-88, NOT yet on `main`)
Lives on `feature/ED-88_add-mqtt-communication-to-gateway`. `lib/mqtt-client.ts` publishes commands; `app/api/meter/[id]/valve/route.ts` is the open/close endpoint; `app/api/user/[id]/can-write` + `lib/mongo-audit.ts` gate who may issue commands and log it. The Mosquitto broker config is in `deploy/mqtt/` (local-only, gitignored: passwords, certs, data, log, real `mosquitto.conf`); listeners `1883` plain and `8883` TLS, `allow_anonymous false` with per-gateway passwords. `main`'s `docker-compose.prod.yml` does not yet define an mqtt service.

## Frontend conventions
- UI is Radix primitives + Tailwind in a shadcn-style component layer under `components/` (`components/ui/` for primitives). `cn()` in `lib/utils.ts` merges classes.
- Data fetching uses `@tanstack/react-query`; feature hooks live in `hooks/<domain>/`. Forms use `react-hook-form` + `zod`. Server mutations use `next-safe-action` via `actionClient` in `lib/safe-action.ts`. Light client state uses `zustand`.
- Dates: dayjs is centrally configured for Argentina timezone (`utils/configureDayjs.ts`, `utils/timestampConverter.ts`). Use these helpers — meter timestamps need explicit AR conversion.
- Maps use `@react-google-maps/api` (provider in `providers/google-maps-provider.tsx`); zones are drawn/edited as polygons.
- File uploads go through `uploadthing`; transactional email through `resend`.

## Deploy (VPS, self-hosted)
The project migrated off Supabase to a self-hosted Postgres on a VPS (see `deploy/docs/DB_MIGRATION_SUPABASE_TO_VPS.md` and `DEPLOY_VPS.md`). `deploy/compose/docker-compose.prod.yml` runs `postgres:16-alpine` + the `app` container behind `deploy/nginx/ecowater.conf`. Operational scripts in `deploy/scripts/` (`deploy.sh`, `rollback.sh`, `backup-db.sh`, `restore-db.sh`). Production env lives in `deploy/env/`. The container entrypoint (`deploy/docker/entrypoint.sh`) runs `prisma migrate deploy` on boot.

## Git workflow
Branches flow `feature/*` → `dev` → `qa` → `main` via PRs (origin has `dev`, `qa`, `main`). Feature branches are prefixed with a tracker id, e.g. `feature/ED-88_...`. Commit messages use conventional commits (often with gitmoji); do not add AI attribution / Co-Authored-By lines.

## Gotchas
- Several API routes instantiate `new PrismaClient()` at module scope per file rather than sharing a singleton — be aware when reasoning about connection counts.
- `utils/parseTimestamp .ts` has a trailing space in its filename; imports must keep it (`@/utils/parseTimestamp `).
- Roles seen in code: `lector`, `operario` (admin is the unrestricted default). Role gating is split between `middleware.ts` and per-route checks — change both when touching authorization.
