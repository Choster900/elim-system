-- El catálogo comunitario debe contener el rol usado para conducir reuniones.
INSERT INTO "roc_rol_comunidad" (
    "roc_codigo",
    "roc_nombre",
    "roc_descripcion",
    "roc_activo",
    "roc_sistema",
    "roc_fecha_creacion",
    "roc_fecha_modificacion"
)
VALUES (
    'LEADER',
    'Líder',
    'Miembro autorizado para conducir reuniones.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("roc_codigo") DO NOTHING;

-- Las reuniones existentes conservan como líder inicial a su supervisor.
-- La asignación comunitaria mantiene consistente el filtro de líderes.
INSERT INTO "mxr_miembro_rol" (
    "mxr_miembro",
    "mxr_rol",
    "mxr_fecha_creacion",
    "mxr_fecha_modificacion"
)
SELECT DISTINCT
       reu."reu_id_mie_supervisor",
       roc."roc_id",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM   "reu_reunion" AS reu
CROSS JOIN "roc_rol_comunidad" AS roc
WHERE  roc."roc_codigo" = 'LEADER'
AND    NOT EXISTS
       (
           SELECT  1
           FROM    "mxr_miembro_rol" AS mxr
           WHERE   mxr."mxr_miembro" = reu."reu_id_mie_supervisor"
           AND     mxr."mxr_rol" = roc."roc_id"
       );

ALTER TABLE "reu_reunion"
ADD COLUMN "reu_id_mie_lider" INTEGER;

UPDATE "reu_reunion"
SET    "reu_id_mie_lider" = "reu_id_mie_supervisor";

ALTER TABLE "reu_reunion"
ALTER COLUMN "reu_id_mie_lider" SET NOT NULL;

CREATE INDEX "ix_reu_lider"
ON "reu_reunion"("reu_id_mie_lider");

ALTER TABLE "reu_reunion"
ADD CONSTRAINT "fk_reu_id_mie_lider"
FOREIGN KEY ("reu_id_mie_lider")
REFERENCES "mie_miembro"("mie_id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMENT ON COLUMN "reu_reunion"."reu_id_mie_lider" IS
'Miembro con rol comunitario LEADER responsable de conducir la reunión.';
