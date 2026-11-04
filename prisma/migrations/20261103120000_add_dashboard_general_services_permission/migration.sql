INSERT INTO "per_permiso" (
    "per_nombre",
    "per_codigo",
    "per_modulo",
    "per_recurso",
    "per_accion",
    "per_descripcion",
    "per_sistema",
    "per_estado",
    "per_fecha_creacion",
    "per_fecha_modificacion"
)
VALUES (
    'Ver cultos generales en el panel',
    'dashboard.general_services',
    'General',
    'dashboard',
    'general_services',
    'Consultar la pestaña de cultos generales del panel principal.',
    TRUE,
    'activo',
    NOW(),
    NOW()
)
ON CONFLICT ("per_codigo")
DO UPDATE SET
    "per_nombre" = EXCLUDED."per_nombre",
    "per_modulo" = EXCLUDED."per_modulo",
    "per_recurso" = EXCLUDED."per_recurso",
    "per_accion" = EXCLUDED."per_accion",
    "per_descripcion" = EXCLUDED."per_descripcion",
    "per_sistema" = EXCLUDED."per_sistema",
    "per_estado" = EXCLUDED."per_estado",
    "per_fecha_modificacion" = NOW();
