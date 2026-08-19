-- Código autogenerado de reunión: SECNNN-REUNNNN-AAAAMMDD.
-- Lleva el sector al que pertenece, el número de la reunión y su fecha de inicio.

ALTER TABLE "reu_reunion" ADD COLUMN "reu_codigo" VARCHAR(100);

-- Relleno de lo existente con el mismo formato que usará la aplicación:
-- el código del sector sin caracteres separadores, el id de la reunión a cuatro
-- dígitos y la fecha de inicio compacta.
UPDATE "reu_reunion" r
SET "reu_codigo" =
    regexp_replace(upper(s."sec_codigo"), '[^A-Z0-9]', '', 'g')
    || '-REU' || lpad(r."reu_id"::text, 4, '0')
    || '-' || to_char(r."reu_fecha", 'YYYYMMDD')
FROM "sec_sector" s
WHERE s."sec_id" = r."reu_id_sec";

ALTER TABLE "reu_reunion" ALTER COLUMN "reu_codigo" SET NOT NULL;

CREATE UNIQUE INDEX "uk_reu_codigo" ON "reu_reunion" ("reu_codigo");

COMMENT ON COLUMN "reu_reunion"."reu_codigo" IS 'Código autogenerado SECNNN-REUNNNN-AAAAMMDD; se recalcula si cambia el sector o la fecha de inicio.';
