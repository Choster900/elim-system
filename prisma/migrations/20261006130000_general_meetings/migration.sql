-- Reuniones generales: cultos y vigilias de toda la iglesia. No pertenecen a un sector,
-- así que no tienen sector, líder, supervisor, anfitrión ni co-supervisores, y su código
-- usa el prefijo IGL en lugar de distrito + zona + sector (IGLS1, IGLV1…).
ALTER TABLE "tir_tipo_reunion"
    ADD COLUMN "tir_general" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "tir_tipo_reunion"
SET    "tir_general" = TRUE,
       "tir_fecha_modificacion" = CURRENT_TIMESTAMP
WHERE  "tir_codigo" IN ('S', 'V');

ALTER TABLE "reu_reunion"
    ALTER COLUMN "reu_id_sec" DROP NOT NULL,
    ALTER COLUMN "reu_id_mie_lider" DROP NOT NULL,
    ALTER COLUMN "reu_id_mie_supervisor" DROP NOT NULL;

ALTER TABLE "reo_reunion_ocurrencia"
    ALTER COLUMN "reo_id_sec" DROP NOT NULL;

-- Las reuniones ya creadas con un tipo general pasan a ser de toda la iglesia.
DELETE FROM "rxm_reunion_miembro"
WHERE  "rxm_reunion" IN (
           SELECT r."reu_id"
           FROM   "reu_reunion" r
           JOIN   "tir_tipo_reunion" t ON t."tir_id" = r."reu_id_tir"
           WHERE  t."tir_general"
       );

WITH numeradas AS (
    SELECT r."reu_id",
           'IGL' || t."tir_codigo" || ROW_NUMBER() OVER (
               PARTITION BY r."reu_id_tir"
               ORDER BY r."reu_id"
           ) AS codigo
    FROM   "reu_reunion" r
    JOIN   "tir_tipo_reunion" t ON t."tir_id" = r."reu_id_tir"
    WHERE  t."tir_general"
)
UPDATE "reu_reunion" r
SET    "reu_codigo" = n.codigo,
       "reu_id_sec" = NULL,
       "reu_id_mie_lider" = NULL,
       "reu_id_mie_supervisor" = NULL,
       "reu_id_mie_anfitrion" = NULL,
       "reu_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   numeradas n
WHERE  n."reu_id" = r."reu_id";

-- Las fechas pendientes siguen a la reunión; las registradas conservan su sector histórico.
UPDATE "reo_reunion_ocurrencia" o
SET    "reo_id_sec" = NULL,
       "reo_id_mie_lider" = NULL,
       "reo_fecha_modificacion" = CURRENT_TIMESTAMP
FROM   "reu_reunion" r
JOIN   "tir_tipo_reunion" t ON t."tir_id" = r."reu_id_tir"
WHERE  o."reo_id_reu" = r."reu_id"
  AND  t."tir_general"
  AND  o."reo_estado" = 'pendiente';
