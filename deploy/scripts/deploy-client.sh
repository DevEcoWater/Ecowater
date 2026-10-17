#!/usr/bin/env bash
# deploy-client.sh — despliega UN cliente en el VPS, con respaldo y vuelta atras automatica.
#
# Se corre en el servidor como root. Hay dos formas:
#
#   1) Con el script del repo ya en el servidor (checkout actualizado):
#        cd /var/www/olmos/Ecowater && sudo bash deploy/scripts/deploy-client.sh --branch main
#
#   2) Desde tu maquina, sin depender de lo que haya en el servidor (recomendada:
#      el checkout puede estar en una rama vieja que no trae este script):
#        ssh ecowater-vps 'sudo -n bash -s -- --dir /var/www/olmos/Ecowater --branch main' \
#          < deploy/scripts/deploy-client.sh
#
# Opciones:
#   --dir <ruta>    checkout del cliente (por defecto, el directorio actual)
#   --branch <rama> rama a desplegar (por defecto: main)
#   --sql <archivo> SQL aditivo a aplicar ANTES de recrear la app (ruta dentro del repo,
#                   ya en la rama nueva). Antes se hace un pg_dump de respaldo.
#   --check         solo verifica el estado y muestra el plan; no cambia nada
#
# Que hace, en orden:
#   0 chequeo previo: app y base sanas, disco, repo sin cambios locales, la rama existe
#   1 respaldo: etiqueta la imagen actual y copia el env
#   2 codigo: fetch + checkout de la rama
#   3 SQL opcional (con pg_dump previo)
#   4 compila y recrea SOLO la app (--no-deps: la base y el broker no se tocan)
#   5 verifica /api/health y la pagina publica; si falla, vuelve a la version anterior
#
# Orden recomendado entre clientes: primero Olmos (demo), verificar, despues COSEGO.
# Los dos terminan el dia en el MISMO commit.
set -euo pipefail

DIR="$(pwd)"
BRANCH="main"
SQL=""
CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dir)    DIR="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --sql)    SQL="$2"; shift 2 ;;
    --check)  CHECK=1; shift ;;
    *) echo "opcion desconocida: $1"; exit 2 ;;
  esac
done

cd "$DIR"
[ -f deploy/compose/docker-compose.prod.yml ] || { echo "no parece un checkout de Ecowater: $DIR"; exit 2; }
ENVF=deploy/env/.env.production
[ -f "$ENVF" ] || { echo "falta $ENVF"; exit 2; }
COMPOSE=deploy/compose/docker-compose.prod.yml
DC="docker compose -f $COMPOSE --env-file $ENVF"

# Lee una variable del env sin hacer `source` (hay valores con espacios).
# Si la variable no esta definida devuelve vacio (COSEGO no define CLIENT_SLUG ni APP_PORT:
# usa los valores por defecto del compose), en vez de cortar el script por el set -e.
envget() { { grep -E "^$1=" "$ENVF" || true; } | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
SLUG="$(envget CLIENT_SLUG)"; SLUG="${SLUG:-ecowater}"
PORT="$(envget APP_PORT)"; PORT="${PORT:-3000}"
PUBLIC="$(envget NEXTAUTH_URL)"
PGUSER="$(envget POSTGRES_USER)"; PGDB="$(envget POSTGRES_DB)"
APP="${SLUG}-app"; PG="${SLUG}-postgres"
BACKUP_DIR="${BACKUP_DIR:-/var/www/ecowater/backups}"
health() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/api/health" || true; }

echo "== cliente: $SLUG | checkout: $DIR | rama destino: $BRANCH | puerto: $PORT"
echo "   hoy: $(git branch --show-current) @ $(git rev-parse --short HEAD)"

echo "== 0/5 chequeo previo"
[ "$(health)" = 200 ] || { echo "la app NO esta sana ahora: aborto sin cambios"; exit 1; }
[ "$(docker inspect -f '{{.State.Health.Status}}' "$PG")" = healthy ] || { echo "$PG no esta sano: aborto"; exit 1; }
FREE_GB=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
[ "$FREE_GB" -ge 5 ] || { echo "queda poco disco (${FREE_GB} GB): aborto"; exit 1; }
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "hay cambios locales sin commitear en el servidor:"; git status --short --untracked-files=no; exit 1; }
git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null || { echo "la rama $BRANCH no existe en origin"; exit 1; }
[ -z "$SQL" ] || echo "   SQL a aplicar: $SQL"
echo "   ok: app sana, base sana, ${FREE_GB} GB libres, rama existe"

if [ "$CHECK" = 1 ]; then
  git fetch -q origin "$BRANCH"
  echo "   --check: se desplegaria $BRANCH @ $(git rev-parse --short "origin/$BRANCH") ($(git rev-list --count HEAD..origin/$BRANCH) commits nuevos). No se cambio nada."
  exit 0
fi

echo "== 1/5 respaldo para volver atras"
STAMP=$(date +%Y%m%d-%H%M)
PREV_IMAGE=$(docker inspect "$APP" --format '{{.Image}}')
docker tag "$PREV_IMAGE" "${APP}:rollback-$STAMP"
PREV_COMMIT=$(git rev-parse HEAD); PREV_BRANCH=$(git branch --show-current)
cp -p "$ENVF" "$ENVF.bak-deploy-$STAMP"; chmod 600 "$ENVF.bak-deploy-$STAMP"
echo "   imagen de respaldo: ${APP}:rollback-$STAMP | commit previo: $(git rev-parse --short HEAD)"

rollback() {
  echo "!! vuelvo a la version anterior"
  if [ -n "$PREV_BRANCH" ]; then git checkout -q -B "$PREV_BRANCH" "$PREV_COMMIT"; else git checkout -q "$PREV_COMMIT"; fi
  docker tag "${APP}:rollback-$STAMP" "${APP}:latest"
  $DC up -d --no-build --force-recreate --no-deps app </dev/null
  for i in $(seq 1 40); do [ "$(health)" = 200 ] && break; sleep 3; done
  echo "   tras la vuelta atras: health=$(health)"
  echo "   el SQL aditivo (si se aplico) es inofensivo para la version anterior"
}

echo "== 2/5 codigo: $BRANCH"
git fetch -q origin "$BRANCH"
git checkout -q -B "$BRANCH" "origin/$BRANCH"
echo "   $(git log --oneline -1)"

if [ -n "$SQL" ]; then
  echo "== 3/5 SQL (con respaldo previo)"
  [ -f "$SQL" ] || { echo "no existe $SQL en la rama $BRANCH"; rollback; exit 1; }
  mkdir -p "$BACKUP_DIR"; umask 077
  DUMP="$BACKUP_DIR/${SLUG}_pre-sql_$STAMP.sql.gz"
  docker exec "$PG" pg_dump -U "$PGUSER" -d "$PGDB" --no-owner </dev/null | gzip > "$DUMP"
  gzip -t "$DUMP" && echo "   respaldo de la base: $DUMP"
  if ! docker exec -i "$PG" psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 -q < "$SQL"; then
    echo "!! fallo el SQL"; rollback; exit 1
  fi
  echo "   SQL aplicado"
else
  echo "== 3/5 SQL: ninguno"
fi

echo "== 4/5 compilar y recrear SOLO la app"
$DC up -d --build --no-deps app </dev/null

echo "== 5/5 verificacion"
OK=no
for i in $(seq 1 60); do [ "$(health)" = 200 ] && { OK=yes; break; }; sleep 3; done
LOGIN="n/a"
[ -z "$PUBLIC" ] || LOGIN=$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC/auth/login" || true)
echo "   health=$(health)  pagina publica=$LOGIN"
if [ "$OK" != yes ] || { [ "$LOGIN" != "n/a" ] && [ "$LOGIN" != 200 ]; }; then
  echo "!! FALLO LA VERIFICACION"; rollback; exit 1
fi

echo
echo "LISTO: $SLUG en $(git branch --show-current) @ $(git rev-parse --short HEAD), imagen $(docker inspect "$APP" --format '{{.Image}}' | cut -c8-19)"
echo "Para volver atras a mano:"
echo "  cd $DIR && git checkout $PREV_COMMIT && docker tag ${APP}:rollback-$STAMP ${APP}:latest && $DC up -d --no-build --force-recreate --no-deps app"
