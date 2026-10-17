-- AlterTable
ALTER TABLE "Meter" ADD COLUMN "has_valve" BOOLEAN NOT NULL DEFAULT false;

-- Hasta hoy todo medidor inteligente mostraba el control de valvula: se
-- conserva ese comportamiento y despues se desmarcan los que no la tienen.
UPDATE "Meter" SET "has_valve" = true WHERE "meter_type" = 'SMART';
