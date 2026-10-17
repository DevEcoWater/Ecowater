-- demo-refresh.sql: adelanta TODAS las fechas de la demo hasta el momento actual.
--
-- Los indicadores del dashboard (medidores en linea, senal) miran las ultimas 24 horas,
-- asi que los datos de una demo "envejecen". Esto corre toda la linea de tiempo hacia
-- adelante en bloque, sin borrar nada: la lectura mas reciente pasa a ser "ahora", y
-- las demas conservan su distancia relativa (el medidor que esta mudo hace 3 dias
-- sigue mudo hace 3 dias).
--
-- Uso (solo Olmos u otra base de demo):
--   ssh ecowater-vps 'sudo -n docker exec -i olmos-postgres psql -U olmos -d ecowater_olmos -v ON_ERROR_STOP=1' \
--     < deploy/sql/demo-refresh.sql
--
-- Despues conviene recrear la app: el dashboard guarda respuestas en cache una hora.
--   ssh ecowater-vps 'cd /var/www/olmos/Ecowater && sudo -n docker compose -f deploy/compose/docker-compose.prod.yml --env-file deploy/env/.env.production restart app'
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Cooperative" WHERE name LIKE '%(demo)') THEN
    RAISE EXCEPTION 'Esta base no es de demo (la cooperativa no termina en (demo)). Aborto.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Reading") THEN
    RAISE EXCEPTION 'No hay lecturas que adelantar.';
  END IF;
END $$;

CREATE TEMP TABLE _delta AS
  SELECT now() - max("timestamp") AS d FROM "Reading";

UPDATE "Reading" SET "timestamp" = "timestamp" + (SELECT d FROM _delta);
UPDATE "RxInfo"  SET "time"      = "time"      + (SELECT d FROM _delta);
UPDATE "Status"  SET created_at  = created_at  + (SELECT d FROM _delta);
UPDATE "Meter"   SET updated_at  = updated_at  + (SELECT d FROM _delta);

SELECT 'adelantado en: ' || (SELECT d FROM _delta) AS resultado,
       'ultima lectura ahora: ' || (SELECT max("timestamp") FROM "Reading") AS ahora;
COMMIT;
