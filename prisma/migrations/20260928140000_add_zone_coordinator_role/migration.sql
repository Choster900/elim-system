-- Rol comunitario habilitado para ser responsable de una zona.
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
    'COORDINATOR',
    'Coordinador',
    'Miembro responsable de coordinar una zona.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("roc_codigo")
DO UPDATE SET
    "roc_nombre" = EXCLUDED."roc_nombre",
    "roc_descripcion" = EXCLUDED."roc_descripcion",
    "roc_activo" = TRUE,
    "roc_sistema" = TRUE,
    "roc_fecha_modificacion" = CURRENT_TIMESTAMP;

-- Las personas ya responsables de una zona conservan su asignación con el nuevo rol.
INSERT INTO "mxr_miembro_rol" (
    "mxr_miembro",
    "mxr_rol",
    "mxr_fecha_creacion",
    "mxr_fecha_modificacion"
)
SELECT
    zon."zon_id_mie",
    roc."roc_id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "zon_zona" AS zon
INNER JOIN "roc_rol_comunidad" AS roc
    ON roc."roc_codigo" = 'COORDINATOR'
WHERE zon."zon_id_mie" IS NOT NULL
ON CONFLICT ("mxr_miembro", "mxr_rol")
DO UPDATE SET
    "mxr_fecha_fin" = NULL,
    "mxr_fecha_modificacion" = CURRENT_TIMESTAMP;
