DROP INDEX "uk_dis_codigo";
DROP INDEX "uk_zon_codigo";
DROP INDEX "uk_sec_codigo";
DROP INDEX "uk_reu_codigo";

WITH numerados AS (
    SELECT "dis_id",
           'D' || ROW_NUMBER() OVER (ORDER BY "dis_id") AS codigo
    FROM   "dis_distrito"
)
UPDATE "dis_distrito" d
SET    "dis_codigo" = n.codigo,
       "dis_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   numerados n
WHERE  n."dis_id" = d."dis_id"
  AND  d."dis_codigo" <> n.codigo;

WITH numeradas AS (
    SELECT "zon_id",
           'Z' || ROW_NUMBER() OVER (PARTITION BY "zon_id_dis" ORDER BY "zon_id") AS codigo
    FROM   "zon_zona"
)
UPDATE "zon_zona" z
SET    "zon_codigo" = n.codigo,
       "zon_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   numeradas n
WHERE  n."zon_id" = z."zon_id"
  AND  z."zon_codigo" <> n.codigo;

WITH numerados AS (
    SELECT "sec_id",
           'S' || ROW_NUMBER() OVER (PARTITION BY "sec_id_zon" ORDER BY "sec_id") AS codigo
    FROM   "sec_sector"
)
UPDATE "sec_sector" s
SET    "sec_codigo" = n.codigo,
       "sec_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   numerados n
WHERE  n."sec_id" = s."sec_id"
  AND  s."sec_codigo" <> n.codigo;

WITH numeradas AS (
    SELECT r."reu_id",
           CASE WHEN r."reu_id_sec" IS NULL THEN 'IGL' ELSE '' END
               || upper(trim(t."tir_codigo"))
               || ROW_NUMBER() OVER (
                      PARTITION BY r."reu_id_sec", r."reu_id_tir"
                      ORDER BY r."reu_id"
                  ) AS codigo
    FROM   "reu_reunion" r
    JOIN   "tir_tipo_reunion" t ON t."tir_id" = r."reu_id_tir"
)
UPDATE "reu_reunion" r
SET    "reu_codigo" = n.codigo,
       "reu_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   numeradas n
WHERE  n."reu_id" = r."reu_id"
  AND  r."reu_codigo" <> n.codigo;

CREATE UNIQUE INDEX "uk_dis_codigo" ON "dis_distrito"("dis_codigo");
CREATE UNIQUE INDEX "uk_zon_distrito_codigo" ON "zon_zona"("zon_id_dis", "zon_codigo");
CREATE UNIQUE INDEX "uk_sec_zona_codigo" ON "sec_sector"("sec_id_zon", "sec_codigo");
CREATE UNIQUE INDEX "uk_reu_sector_codigo" ON "reu_reunion"("reu_id_sec", "reu_codigo");

COMMENT ON COLUMN "dis_distrito"."dis_codigo" IS 'Código autogenerado D + correlativo de la iglesia (D1, D2…).';
COMMENT ON COLUMN "zon_zona"."zon_codigo" IS 'Código autogenerado Z + correlativo dentro del distrito; se repite entre distritos.';
COMMENT ON COLUMN "sec_sector"."sec_codigo" IS 'Código autogenerado S + correlativo dentro de la zona; se repite entre zonas.';
COMMENT ON COLUMN "reu_reunion"."reu_codigo" IS 'Código autogenerado: segmento del tipo + correlativo dentro del sector (C1), o IGL + segmento + correlativo en las reuniones generales (IGLS1). El código completo D1Z2S3C1 se arma con los códigos del sector, la zona y el distrito.';
