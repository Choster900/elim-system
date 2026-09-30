-- El segmento se usa en los nuevos códigos: D1Z1S1C1.
UPDATE "tir_tipo_reunion"
SET "tir_codigo" = CASE "tir_codigo"
    WHEN 'TIP-SERVICIO' THEN 'S'
    WHEN 'TIP-CELULA' THEN 'C'
    WHEN 'TIP-LIDERAZGO' THEN 'L'
    WHEN 'TIP-CAPACITACION' THEN 'A'
    WHEN 'TIP-VIGILIA' THEN 'V'
    WHEN 'TIP-ESTUDIO' THEN 'E'
    WHEN 'TIP-ENSAYO' THEN 'N'
    ELSE "tir_codigo"
END;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "tir_tipo_reunion" WHERE "tir_codigo" !~ '^[A-Z]$') THEN
        RAISE EXCEPTION 'Cada tipo de reunión debe tener un segmento único de una letra A-Z';
    END IF;
END $$;

ALTER TABLE "tir_tipo_reunion"
    ALTER COLUMN "tir_codigo" TYPE CHAR(1);

ALTER TABLE "tir_tipo_reunion"
    ADD CONSTRAINT "ck_tir_codigo" CHECK ("tir_codigo" ~ '^[A-Z]$');

CREATE UNIQUE INDEX "uk_tir_nombre_normalizado"
    ON "tir_tipo_reunion" (LOWER("tir_nombre"));
