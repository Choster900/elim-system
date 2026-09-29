-- Roles comunitarios adicionales disponibles en el registro e importación de miembros.
INSERT INTO "roc_rol_comunidad" (
    "roc_codigo",
    "roc_nombre",
    "roc_descripcion",
    "roc_activo",
    "roc_sistema",
    "roc_fecha_creacion",
    "roc_fecha_modificacion"
)
VALUES
    (
        'ELDER',
        'Anciano',
        'Miembro que apoya el cuidado espiritual de la comunidad.',
        TRUE,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'SUPPORT_COMMITTEE',
        'Comité de apoyo',
        'Miembro que sirve en el comité de apoyo.',
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
