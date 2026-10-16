# Dos clientes en el mismo VPS

Modelo: **un despliegue por cliente, con su propia base**, no multi-tenant. El
esquema no tiene `tenant_id`, así que cada cliente es una app + un Postgres
propios. El código es uno solo; el cliente se elige al compilar.

## Cómo se elige el cliente

`config/client.config.ts` lee `NEXT_PUBLIC_CLIENT` al compilar (compose lo pasa
desde `CLIENT_CONFIG`, por defecto `ecowater`). Un nombre desconocido hace
fallar el build, para no desplegar un cliente con la marca de otro.

Agregar un cliente: crear `config/clients/<id>.ts` y registrarlo en `registry`.

## Levantar Olmos junto a COSEGO

1. Segundo checkout del repo, por ejemplo `/home/deploy/olmos`. Así el broker,
   los certificados y el env quedan separados de COSEGO.
2. En su `deploy/env/.env.production`:
   ```
   CLIENT_SLUG=olmos
   CLIENT_CONFIG=olmos
   APP_PORT=3001
   POSTGRES_HOST_PORT=5433
   PGWEB_PORT=8082
   MQTT_PLAIN_PORT=11883
   MQTT_TLS_PORT=18883
   APP_BASE_URL=https://olmos.ecowater.com.ar
   ```
   más `POSTGRES_*` / `DATABASE_URL` / `PGWEB_DATABASE_URL` de su propia base y
   un `AUTH_SECRET` distinto del de COSEGO.
3. DNS: registro A de `olmos.ecowater.com.ar` hacia el VPS.
4. nginx: `deploy/nginx/olmos.conf` y luego certbot para el certificado.
5. `deploy/scripts/deploy.sh`, y `prisma/create-admin.ts` para el primer admin.

El broker MQTT de Olmos no hace falta si todavía no tiene gateway; en ese caso
el servicio `mqtt` puede quedar sin uso. No actives `FEATURE_VALVE_CONTROL` ni
apuntes `MQTT_BROKER_URL` al broker de COSEGO desde Olmos: un comando de prueba
cerraría una válvula real.

## Pendiente

- Logo, color y mapa reales de Olmos en `config/clients/olmos.ts` (hoy copia los
  de COSEGO).
- Si COSEGO migra a `cosego.ecowater.com.ar`, dejar `app.` como alias para no
  romper el gateway ni las sesiones.
