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

## Datos de demostración

Para mostrar la plataforma sin datos reales: `prisma/demo-sql.ts` genera por
stdout el SQL de una cooperativa inventada (medidores inteligentes y mecánicos,
socios, operarios, zonas y dos meses de lecturas). No se conecta a ninguna base.

```
DEMO_USER_PASSWORD=<clave> NEXT_PUBLIC_CLIENT=olmos npx tsx prisma/demo-sql.ts > demo.sql
ssh <vps> 'docker exec -i olmos-postgres psql -U olmos -d ecowater_olmos -v ON_ERROR_STOP=1' < demo.sql
```

Para ensayarlo sin guardar nada, cambiar el `COMMIT;` final por `ROLLBACK;`.
Se niega a correr si la cooperativa no termina en `(demo)` o si la base ya tiene
medidores, así que no se puede aplicar por error sobre una instancia real. Va
después del seed y de `create-admin`. Los usuarios de demo comparten la clave
de `DEMO_USER_PASSWORD`; el admin es el de `create-admin`.

## Pendiente

- Logo, color y mapa reales de Olmos en `config/clients/olmos.ts` (hoy copia los
  de COSEGO).
- Si COSEGO migra a `cosego.ecowater.com.ar`, dejar `app.` como alias para no
  romper el gateway ni las sesiones.
