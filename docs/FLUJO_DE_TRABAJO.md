# Flujo de trabajo de Ecowater

Cómo trabajamos con **un solo repositorio y varios clientes** (COSEGO, Olmos y los que vengan). Sirve para personas y para agentes de IA. El resumen operativo para agentes está en [`CLAUDE.md`](../CLAUDE.md); acá está el detalle y los comandos.

> Estado: escrito el 17/10/2026. Las recetas de despliegue (secciones 5 a 8) se probaron en el servidor real. La receta de desarrollo local (sección 3) usa piezas ya probadas, pero la secuencia completa no se corrió de punta a punta en esta sesión: si algo falla, corregí este documento.

---

## 1. La idea central

- **Un repositorio, un código.** Todos los clientes corren el mismo código (`DevEcoWater/Ecowater`). No hay forks por cliente.
- **Lo que cambia entre clientes es configuración, no código:**

| Qué varía | Dónde vive | ¿Se versiona? |
|---|---|---|
| Marca, color, mapa, zona horaria, funciones activadas | `config/clients/<id>.ts` (registrado en `config/client.config.ts`) | Sí |
| Qué cliente es una instalación | `CLIENT_CONFIG` y `CLIENT_SLUG` en el env del servidor | No (secreto del servidor) |
| Puertos, URL pública, claves, flags por entorno | `deploy/env/.env.production` de cada checkout | No |
| Nombre y logo de la cooperativa | Fila `Cooperative` de su base (gana sobre el archivo de config) | Es dato |
| Qué medidor tiene válvula | Columna `Meter.has_valve` de su base | Es dato |

- **Un cliente = un stack Docker con su propia base.** No es multi-tenant: el esquema no tiene `tenant_id`. Cada cliente tiene su app, su Postgres y su carpeta en el servidor.
- **El cliente se elige al compilar.** La variable `NEXT_PUBLIC_CLIENT` (en compose: `CLIENT_CONFIG`) se graba en el build. Una imagen compilada para Olmos no puede convertirse en COSEGO sin recompilar.

## 2. Qué hay en el servidor

Un VPS (138.36.237.244, Ubuntu 22.04) con dos stacks aislados. Más detalle en `deploy/docs/MULTI_CLIENT_SAME_VPS.md` y `deploy/docs/DEPLOY_VPS.md`.

| | COSEGO (producción real) | Olmos (demo) |
|---|---|---|
| Carpeta | `/var/www/ecowater/Ecowater` | `/var/www/olmos/Ecowater` |
| Proyecto Docker | `ecowater` | `olmos` |
| URL | `app.ecowater.com.ar` | `olmos.ecowater.com.ar` |
| App (puerto en el host) | `127.0.0.1:3000` | `127.0.0.1:3001` |
| Base | `ecowater_cosego` (`127.0.0.1:5432`) | `ecowater_olmos` (`127.0.0.1:5433`) |
| Broker MQTT | `mqtt.ecowater.com.ar:8883` | no tiene |
| Consola de base | `pgweb.ecowater.com.ar` | no tiene (túnel SSH al 5433) |
| Datos | reales | inventados (`prisma/demo-sql.ts`) |

Regla: **los dos checkouts terminan el día en el mismo commit de la misma rama.**

## 3. Desarrollo local

Reglas de oro:
1. **Nunca apuntes `.env.local` a producción.** Durante meses `.env.local` apuntó a la base real y al broker real: un comando de válvula desde tu máquina cierra el agua de un socio de verdad.
2. Dejá `MQTT_BROKER_URL` vacío y `FEATURE_VALVE_CONTROL=false`, salvo que tengas un broker propio de pruebas.
3. No uses `VALVE_BYPASS_AUTH` contra nada que no sea una base descartable.

Receta (base descartable en Docker):

```bash
# 1) Base de pruebas
docker run -d --name ecowater-dev-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ecowater_dev \
  -p 127.0.0.1:55432:5432 postgres:16-alpine

# 2) .env.local (mínimo)
#   DATABASE_URL=postgresql://postgres:dev@127.0.0.1:55432/ecowater_dev
#   DIRECT_URL=postgresql://postgres:dev@127.0.0.1:55432/ecowater_dev
#   AUTH_SECRET=<cualquier cadena larga>
#   NEXTAUTH_URL=http://localhost:3000
#   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<la key; ya admite http://localhost:3000 y :3001>
#   (MQTT_BROKER_URL vacío)

# 3) Esquema, roles, cooperativa y admin
npm ci
npm run prisma:push                         # crea todas las tablas (base descartable)
COOP_NAME="Local (demo)" npx dotenv -e .env.local -- npx prisma db seed
ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=<clave> npm run create-admin

# 4) Datos de demostración (opcional; la cooperativa debe terminar en "(demo)")
DEMO_USER_PASSWORD=<clave> NEXT_PUBLIC_CLIENT=olmos npx tsx prisma/demo-sql.ts \
  | docker exec -i ecowater-dev-pg psql -U postgres -d ecowater_dev -v ON_ERROR_STOP=1

# 5) Correr eligiendo el cliente
NEXT_PUBLIC_CLIENT=olmos npm run dev        # o ecowater para COSEGO
```

Cómo verificar un cambio antes de abrir el PR (no hay tests ni lint configurados):

```bash
npx tsc --noEmit            # tipos
NEXT_PUBLIC_CLIENT=olmos npx next build    # compila como en producción
```

Si cambiaste el `schema.prisma`, corré `npx prisma generate` antes de `tsc`.

## 4. Ramas, commits y PRs

- **`main` es el tronco.** Todo entra por PR; hay revisión obligatoria.
- Ramas de trabajo: `feature/<ticket>_<tema>` o `fix/<ticket>_<tema>`, siempre desde `main` actualizado.
- Commits: *conventional commits* con gitmoji (`feat(valve): :sparkles: ...`). **Sin líneas de atribución a IA ni `Co-Authored-By`.**
- Un PR = una idea. Describí qué cambia, cómo se verificó y **qué hay que hacer al desplegarlo** (SQL, variables de entorno).
- Merge: *squash* para PRs de una sola función (historial limpio). Si hay que entregar varios PRs juntos con fecha límite, se arma una rama de integración `release/<nombre>` y se mergea a `main` con *merge commit* (no squash), así los PRs incluidos quedan marcados como mergeados.
- Cuidá el mensaje del squash: no debe arrastrar líneas `Co-Authored-By`.
- **No se versiona** `.claude/settings.local.json`, ningún `.env*` ni nada de `deploy/mqtt/` con claves o certificados.

## 5. Agregar una función nueva, según el cliente

Decidí primero **a quién le llega**:

| La función es... | Cómo se hace |
|---|---|
| Para todos los clientes | Código normal. Se despliega en todos. |
| Para algunos clientes (módulo opcional) | Código normal **detrás de un flag**: `featureFlags` en `config/clients/<id>.ts`, o la variable `FEATURE_*` en el env (el env gana). La UI lo lee con `useFeaturePacks()`. Hoy solo `valve_control` está conectado a la interfaz. |
| Visualmente distinta por cliente | Valores en `config/clients/<id>.ts` (marca, color, mapa, `logoOnly`). |
| Realmente distinta en código | Condicionar por `clientConfig`. **Nunca** forkear el repo ni mantener ramas por cliente. |

Pasos:

1. Rama desde `main`.
2. Desarrollar y probar en local con el cliente que corresponda (`NEXT_PUBLIC_CLIENT=...`).
3. `npx tsc --noEmit` y `next build`.
4. ¿Cambia la base? Ver sección 6.
5. PR a `main`, revisión, merge.
6. **Desplegar primero en Olmos (demo), verificar a mano, después en COSEGO** (sección 7).
7. Si la función es solo de un cliente, igual se despliega en los dos: el código es el mismo, el flag decide. Así los dos servidores siguen en el mismo commit.

## 6. Cambios en la base de datos

La base de COSEGO se creó con `prisma db push`, así que **no tiene la tabla `_prisma_migrations`**, y el contenedor arranca con `SKIP_DB_MIGRATIONS=true`. Consecuencias:

- **Nunca** corras `prisma migrate dev`, `prisma migrate deploy` ni `prisma db push --accept-data-loss` contra producción.
- Los cambios de esquema deben ser **aditivos y con valor por defecto** (columna nueva con `DEFAULT`, tabla nueva). Un cambio que borra o renombra se planea aparte, con respaldo.
- Cada cambio lleva un SQL en `prisma/migrations/<fecha>_<nombre>/migration.sql` además del cambio en `schema.prisma`.
- **El SQL se aplica ANTES de desplegar el código.** Prisma incluye todas las columnas del modelo en cada consulta: si el código nuevo arranca sin la columna, falla toda la app.

```bash
# Desde tu máquina: despliega y aplica el SQL (con pg_dump de respaldo previo) en un solo paso
ssh ecowater-vps 'sudo -n bash -s -- --dir /var/www/ecowater/Ecowater --branch main \
  --sql prisma/migrations/<fecha>_<nombre>/migration.sql' < deploy/scripts/deploy-client.sh
```

Una base **nueva** no usa migraciones: se crea el esquema completo de una vez (sección 8).

## 7. Desplegar

Siempre con el script del repo, que respalda, despliega y vuelve atrás solo si falla:

```bash
# 1) Ver qué haría, sin cambiar nada
ssh ecowater-vps 'sudo -n bash -s -- --dir /var/www/olmos/Ecowater --branch main --check' < deploy/scripts/deploy-client.sh

# 2) Olmos primero
ssh ecowater-vps 'sudo -n bash -s -- --dir /var/www/olmos/Ecowater --branch main' < deploy/scripts/deploy-client.sh

# 3) Verificar en el navegador (login, dashboard, un medidor, mapa)

# 4) Después COSEGO, mismo comando con su carpeta
ssh ecowater-vps 'sudo -n bash -s -- --dir /var/www/ecowater/Ecowater --branch main' < deploy/scripts/deploy-client.sh
```

El script se pasa por stdin a propósito: el checkout del servidor puede estar en una rama que todavía no lo trae.

Qué hace: chequea que todo esté sano (si no, no toca nada), etiqueta la imagen actual para poder volver, hace `git fetch` y `checkout` de la rama, aplica el SQL si lo pediste, recrea **solo la app** (`--no-deps`: la base y el broker no se tocan) y verifica `/api/health` y la página pública. Si algo falla, vuelve solo a la versión anterior.

**Cuándo NO desplegar:** minutos antes de una reunión o demo; si el gateway está transmitiendo y hay un comando de válvula esperando (un corte de uno o dos minutos puede perder una lectura); sin haber probado la rama en Olmos.

**Volver atrás a mano:** el script imprime el comando al terminar (checkout del commit anterior + `docker tag <imagen>:rollback-<fecha> <imagen>:latest` + recrear la app). Las imágenes de respaldo quedan con la etiqueta `rollback-<fecha>`.

## 8. Agregar un cliente nuevo

1. **Config:** `config/clients/<id>.ts` (copiar `olmos.ts`), registrarlo en el objeto `registry` de `config/client.config.ts`. Logo en `public/brand/<id>/`.
2. **Checkout nuevo** en el servidor: `/var/www/<id>/Ecowater` (clon del mismo repo).
3. **Env** `deploy/env/.env.production` (permisos 600) con: `CLIENT_SLUG=<id>`, `CLIENT_CONFIG=<id>`, `APP_PORT`, `POSTGRES_HOST_PORT`, `PGWEB_PORT`, `MQTT_PLAIN_PORT`, `MQTT_TLS_PORT` (puertos distintos a los de los otros clientes), `APP_BASE_URL` y `NEXTAUTH_URL` con la URL pública, secretos generados en el servidor, `SKIP_DB_MIGRATIONS=true`, `FEATURE_VALVE_CONTROL=false` y `MQTT_BROKER_URL` vacío si no tiene gateway.
4. **DNS:** registro A de `<id>.ecowater.com.ar` al VPS.
5. **Base:** levantar solo Postgres (`docker compose ... up -d postgres`) y crear el esquema con un contenedor descartable que trae la versión de Prisma del proyecto:
   ```bash
   docker run --rm --network <slug>_client_net -v "$PWD/prisma:/work/prisma:ro" -w /work \
     -e DATABASE_URL -e DIRECT_URL node:20-alpine \
     sh -c "apk add --no-cache openssl >/dev/null && npx --yes prisma@5.22.0 db push --skip-generate --schema prisma/schema.prisma"
   ```
6. **Roles, cooperativa y admin:** `deploy/sql/bootstrap-instance.sql` (el bootstrap del entrypoint está roto; ver sus instrucciones).
7. **App:** compilar y levantar con `deploy-client.sh`.
8. **nginx y certificado:** copiar `deploy/nginx/olmos.conf`, cambiar nombre y puerto, activarlo, `nginx -t`, `systemctl reload nginx`, `certbot --nginx -d <id>.ecowater.com.ar`.
9. Si es demo: cargar datos con `prisma/demo-sql.ts` (sección 9).

Antes de dar por terminado: login, dashboard, mapa (la API key de Google Maps necesita el dominio nuevo en sus referentes), cerrar sesión.

## 9. Datos de demostración

- **Generar:** `DEMO_USER_PASSWORD=<clave> NEXT_PUBLIC_CLIENT=<id> npx tsx prisma/demo-sql.ts > demo.sql`. No se conecta a ninguna base.
- **Aplicar:** `ssh ecowater-vps 'sudo -n docker exec -i <slug>-postgres psql -U <usuario> -d <base> -v ON_ERROR_STOP=1' < demo.sql`. Se niega a correr si la cooperativa no termina en `(demo)` o si la base ya tiene medidores. Para ensayar sin guardar, cambiar el `COMMIT;` final por `ROLLBACK;`.
- **Mantener vigentes:** los indicadores miran las últimas 24 horas, así que la demo envejece. `deploy/sql/demo-refresh.sql` adelanta todas las fechas hasta ahora, sin borrar nada. Correrlo antes de cada presentación y reiniciar la app (el dashboard cachea una hora).
- Los datos usan las mismas convenciones que los reales (`battery_voltage` es `normal` o `low`; la carga manual guarda el valor en `cumulative_flow` e `instantaneous_flow`). Si se agrega un campo, respetar cómo lo guarda el flujo real.

## 10. Operación diaria

| Quiero... | Comando |
|---|---|
| Ver contenedores | `ssh ecowater-vps 'sudo -n docker ps'` |
| Ver el log de una app | `ssh ecowater-vps 'sudo -n docker logs --since 30m ecowater-app'` (los `Failed to find Server Action` son bots; ignorarlos) |
| ¿El gateway está conectado? | `ssh ecowater-vps 'sudo -n docker logs --since 30m ecowater-mqtt \| grep gateway_001'` |
| Estado de un medidor | consulta SQL a `Reading` + `Status`; acceso de solo lectura en `deploy/docs/DB_READONLY_ACCESS.md` |
| Backup manual de COSEGO | `ssh ecowater-vps 'sudo -n docker exec ecowater-postgres pg_dump -U devecowater -d ecowater_cosego --no-owner \| gzip > /var/www/ecowater/backups/cosego_$(date +%Y%m%d).sql.gz'` |
| Ver la base de Olmos | túnel `ssh -L 5433:127.0.0.1:5433 ecowater-vps` y un cliente SQL en `127.0.0.1:5433` |

**Hoy no hay backups automáticos ni cron de estado de medidores programados** (pendiente). El estado `INACTIVE` de los medidores lo mueve la consulta de estadísticas al abrir el dashboard.

Los comandos de válvula **no son inmediatos**: el medidor los ejecuta en su próximo reporte (cada ~12 h, o al acercar el imán). «Enviado al broker» solo prueba que el broker lo recibió; la confirmación real es la lectura siguiente.

## 11. Errores que ya nos pasaron

- Cargar datos y ver ceros durante una hora: el dashboard cachea una hora, incluso respuestas vacías. Recrear la app.
- Pantalla de medidor caída por un valor fuera de tabla (`.label` de `undefined`): toda búsqueda en una tabla de etiquetas necesita fallback.
- `limit` aplicado a medidores en vez de a resultados: alertas que desaparecían con más de 20 medidores.
- Script lanzado con `ssh ... bash -s` que se corta en seco: algún comando (`docker compose exec -T`) lee el stdin y se come el resto del script. Agregar `</dev/null`.
- En zsh, la variable `path` pisa a `PATH`: no la uses como nombre de variable.
- Bootstrap de instancia nueva por el entrypoint: roto; usar `deploy/sql/bootstrap-instance.sql`.
- Cambiar el env de un servicio recrea los contenedores que comparten ese `env_file` (también la base). Los datos viven en un volumen y no se pierden, pero el contenedor se reinicia.
