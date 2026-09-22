-- Corrige las lecturas que quedaron con la fecha del reloj interno del medidor.
--
-- Hasta el fix de ED-90, Reading.timestamp salia de los digitos de fecha del
-- payload, o sea del RTC del aparato. Ese reloj casi siempre anda, pero cada
-- tanto se reinicia y queda corrido: medido sobre 1710 lecturas, 1318 estaban
-- bien, 231 mal por menos de un dia y 159 mal por MAS DE UN MES.
--
-- Status.created_at es la referencia buena: sale del `timestamp` unix que manda
-- el gateway, que verificamos que coincide al segundo con la hora real de
-- llegada del uplink.
--
-- Se ejecuta UNA sola vez, despues de desplegar el fix. Sin el fix desplegado
-- las lecturas nuevas volverian a entrar con la fecha mala.
--
--   ssh ecowater-vps
--   sudo docker cp backfill-reading-timestamps.sql ecowater-postgres:/tmp/
--   sudo docker exec -it ecowater-postgres \
--     psql -U devecowater -d ecowater_cosego -f /tmp/backfill-reading-timestamps.sql
--
-- No toca:
--   * las lecturas sin Status (incluidas las cargadas a mano por un operario,
--     cuya fecha la puso una persona y no un reloj),
--   * las que ya coinciden dentro de los 5 minutos.

\echo ''
\echo '=== ANTES: cuantas filas estan mal y por cuanto ==='

SELECT
  count(*)                                                                    AS filas_a_corregir,
  round(min(extract(epoch FROM (r.timestamp - s.created_at)) / 3600)::numeric, 1) AS desfase_min_h,
  round(max(extract(epoch FROM (r.timestamp - s.created_at)) / 3600)::numeric, 1) AS desfase_max_h
FROM "Reading" r
JOIN "Status" s ON s.reading_id = r.id
WHERE abs(extract(epoch FROM (r.timestamp - s.created_at))) >= 300;

BEGIN;

UPDATE "Reading" r
SET timestamp = s.created_at
FROM "Status" s
WHERE s.reading_id = r.id
  AND abs(extract(epoch FROM (r.timestamp - s.created_at))) >= 300;

\echo ''
\echo '=== DESPUES: tiene que dar 0 ==='

SELECT count(*) AS filas_que_siguen_mal
FROM "Reading" r
JOIN "Status" s ON s.reading_id = r.id
WHERE abs(extract(epoch FROM (r.timestamp - s.created_at))) >= 300;

-- Revisa los numeros de arriba antes de confirmar. Si algo no cuadra,
-- escribi ROLLBACK; en lugar de COMMIT; y no se cambia nada.
COMMIT;

\echo ''
\echo 'Listo. Las lecturas sin Status quedaron como estaban, a proposito.'
