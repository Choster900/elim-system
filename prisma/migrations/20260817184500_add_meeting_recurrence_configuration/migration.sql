ALTER TYPE "fre_frecuencia_reunion"
ADD VALUE IF NOT EXISTS 'diaria' BEFORE 'semanal';

ALTER TABLE "reu_reunion"
ADD COLUMN "reu_fecha_fin_recurrencia" DATE;

ALTER TABLE "reu_reunion"
ADD CONSTRAINT "ck_reu_fecha_fin_recurrencia"
CHECK (
    "reu_fecha_fin_recurrencia" IS NULL
    OR "reu_fecha_fin_recurrencia" >= "reu_fecha"
);

COMMENT ON COLUMN "reu_reunion"."reu_fecha" IS
'Fecha inicial de la reunión y ancla del día para su regla de recurrencia.';

COMMENT ON COLUMN "reu_reunion"."reu_frecuencia" IS
'Frecuencia de ejecución: única, diaria, semanal, quincenal o mensual.';

COMMENT ON COLUMN "reu_reunion"."reu_fecha_fin_recurrencia" IS
'Fecha final inclusiva de la recurrencia; NULL indica que no tiene finalización.';
