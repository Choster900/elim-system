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
VALUES
    (
        'Ver cultos generales',
        'support-committee.general_services',
        'Comité de apoyo',
        'support-committee',
        'general_services',
        'Ver la pestaña de cultos generales y registrar la ofrenda que cuenta el comité.',
        TRUE,
        'activo',
        NOW(),
        NOW()
    ),
    (
        'Ver sobres recibidos',
        'support-committee.received',
        'Comité de apoyo',
        'support-committee',
        'received',
        'Consultar los sobres ya recibidos y corregir su conteo mientras finanzas no los cierre.',
        TRUE,
        'activo',
        NOW(),
        NOW()
    ),
    (
        'Ver diezmos',
        'tithes.view',
        'Comité de apoyo',
        'tithes',
        'view',
        'Consultar los diezmos recibidos por el comité de apoyo.',
        TRUE,
        'activo',
        NOW(),
        NOW()
    ),
    (
        'Registrar diezmos',
        'tithes.create',
        'Comité de apoyo',
        'tithes',
        'create',
        'Registrar un sobre de diezmo a nombre de un diezmador.',
        TRUE,
        'activo',
        NOW(),
        NOW()
    ),
    (
        'Editar diezmos',
        'tithes.update',
        'Comité de apoyo',
        'tithes',
        'update',
        'Corregir el diezmador, el monto, la fecha o la nota de un diezmo registrado.',
        TRUE,
        'activo',
        NOW(),
        NOW()
    ),
    (
        'Eliminar diezmos',
        'tithes.delete',
        'Comité de apoyo',
        'tithes',
        'delete',
        'Eliminar un diezmo registrado por error.',
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

UPDATE "per_permiso"
SET     "per_nombre" = 'Ver sobres por recibir',
        "per_modulo" = 'Comité de apoyo',
        "per_descripcion" = 'Ver la bandeja de sobres por recibir y contar los sobres entregados por los líderes.',
        "per_fecha_modificacion" = NOW()
WHERE   "per_codigo" = 'finance.receive';
