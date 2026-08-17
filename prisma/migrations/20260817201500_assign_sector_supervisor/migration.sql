-- Conserva los responsables existentes y explicita que el miembro asignado al
-- sector cumple la función de supervisor de todas sus reuniones.
ALTER TABLE "sec_sector"
RENAME COLUMN "sec_id_mie" TO "sec_id_mie_supervisor";

ALTER TABLE "sec_sector"
RENAME COLUMN "sec_nombre_lider" TO "sec_nombre_supervisor";

ALTER TABLE "sec_sector"
RENAME CONSTRAINT "fk_sec_id_mie" TO "fk_sec_id_mie_supervisor";

ALTER INDEX "ix_sec_lider"
RENAME TO "ix_sec_supervisor";

COMMENT ON COLUMN "sec_sector"."sec_id_mie_supervisor" IS
'Miembro con rol comunitario SUPERVISOR responsable de las reuniones del sector.';

COMMENT ON COLUMN "sec_sector"."sec_nombre_supervisor" IS
'Nombre histórico del supervisor del sector, conservado para compatibilidad.';

-- Asegura que el catálogo comunitario contenga el rol de supervisor.
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
    'SUPERVISOR',
    'Supervisor',
    'Miembro responsable de supervisar todas las reuniones de un sector.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("roc_codigo") DO UPDATE
SET    "roc_nombre" = EXCLUDED."roc_nombre",
       "roc_descripcion" = EXCLUDED."roc_descripcion",
       "roc_activo" = TRUE,
       "roc_sistema" = TRUE,
       "roc_fecha_modificacion" = CURRENT_TIMESTAMP;

-- Las asignaciones actuales se incorporan al catálogo de supervisores sin
-- duplicar roles comunitarios existentes.
INSERT INTO "mxr_miembro_rol" (
    "mxr_miembro",
    "mxr_rol",
    "mxr_fecha_creacion",
    "mxr_fecha_modificacion"
)
SELECT DISTINCT
       sec."sec_id_mie_supervisor",
       roc."roc_id",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM   "sec_sector" AS sec
CROSS JOIN "roc_rol_comunidad" AS roc
WHERE  sec."sec_id_mie_supervisor" IS NOT NULL
AND    roc."roc_codigo" = 'SUPERVISOR'
AND    NOT EXISTS
       (
           SELECT  1
           FROM    "mxr_miembro_rol" AS mxr
           WHERE   mxr."mxr_miembro" = sec."sec_id_mie_supervisor"
           AND     mxr."mxr_rol" = roc."roc_id"
       );
