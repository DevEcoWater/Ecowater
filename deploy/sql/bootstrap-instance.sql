-- bootstrap-instance.sql: deja lista una base NUEVA (roles, cooperativa y admin).
--
-- Reemplaza el bootstrap del entrypoint (BOOTSTRAP_ON_START), que NO funciona en la
-- imagen de produccion: `npx prisma db seed` baja Prisma 7 y create-admin no encuentra
-- bcryptjs. Es idempotente: se puede correr dos veces sin duplicar nada.
--
-- Requisitos: el esquema ya creado (ver docs/FLUJO_DE_TRABAJO.md, "Cliente nuevo").
--
-- Uso (el hash de la clave se genera en tu maquina para que la clave nunca viaje):
--   HASH=$(node -e "process.stdout.write(require('bcryptjs').hashSync(process.argv[1],10))" 'LaClaveDelAdmin')
--   ssh ecowater-vps 'sudo -n docker exec -i <slug>-postgres psql -U <usuario> -d <base> -v ON_ERROR_STOP=1 \
--       -v coop_name="Cooperativa X (demo)" -v coop_location="Ciudad" \
--       -v admin_email="admin@x.test" -v admin_hash="'"$HASH"'"' < deploy/sql/bootstrap-instance.sql
--
-- Si es una cooperativa REAL, el nombre no lleva "(demo)". El generador de datos de
-- demo solo corre sobre bases cuya cooperativa termina en "(demo)".
BEGIN;

INSERT INTO "Role" ("id", "role_name")
SELECT gen_random_uuid()::text, r
FROM unnest(ARRAY['admin','supervisor','user','operario','lector']) AS r
WHERE NOT EXISTS (SELECT 1 FROM "Role" WHERE role_name = r);

INSERT INTO "Cooperative" ("id", "name", "location", "contact_person", "status", "updated_at")
SELECT gen_random_uuid()::text, :'coop_name', :'coop_location', 'Administrador', 'ACTIVE', now()
WHERE NOT EXISTS (SELECT 1 FROM "Cooperative");

WITH addr AS (
  INSERT INTO "Address" ("id", "lat", "lng", "data", "shortData")
  SELECT gen_random_uuid()::text, '0', '0', 'Dirección de administrador', 'Admin'
  WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = :'admin_email')
  RETURNING id
), usr AS (
  INSERT INTO "User" ("id", "email", "password", "addressId", "firstName", "lastName", "status", "can_write", "updated_at")
  SELECT gen_random_uuid()::text, :'admin_email', :'admin_hash', addr.id, 'Admin', 'Principal', 'ACTIVE', true, now()
  FROM addr
  RETURNING id
)
INSERT INTO "UserRole" ("user_id", "role_id")
SELECT usr.id, (SELECT id FROM "Role" WHERE role_name = 'admin') FROM usr;

COMMIT;
