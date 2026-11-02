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
    'Consultar reportes',
    'reports.view',
    'Reportes',
    'reports',
    'view',
    'Consultar la reportería de reuniones y ofrendas por rango de fechas.',
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

INSERT INTO "rxp_rol_permiso" ("rxp_rol", "rxp_permiso")
SELECT  rol."rol_id", per."per_id"
FROM    "rol_rol" AS rol
        CROSS JOIN "per_permiso" AS per
WHERE   per."per_codigo" = 'reports.view'
        AND rol."rol_codigo" IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'FINANCE', 'SUPERVISOR')
ON CONFLICT ("rxp_rol", "rxp_permiso") DO NOTHING;
