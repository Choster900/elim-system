ALTER TABLE "rof_recepcion_ofrenda" ADD COLUMN     "rof_fecha_cierre" TIMESTAMP(3),
ADD COLUMN     "rof_id_usu_cierre" INTEGER,
ADD COLUMN     "rof_nota_cierre" VARCHAR(600);

CREATE INDEX "ix_rof_usuario_cierre" ON "rof_recepcion_ofrenda"("rof_id_usu_cierre");

ALTER TABLE "rof_recepcion_ofrenda" ADD CONSTRAINT "fk_rof_id_usu_cierre" FOREIGN KEY ("rof_id_usu_cierre") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_id_usu_cierre" IS 'Usuario de finanzas que revisó y cerró la diferencia del sobre.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_fecha_cierre" IS 'Fecha en que finanzas cerró la diferencia del sobre.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_nota_cierre" IS 'Explicación de finanzas sobre cómo se resolvió la diferencia.';

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
    'Revisar recepciones de ofrenda',
    'finance.audit',
    'Finanzas',
    'finance',
    'audit',
    'Comparar lo registrado por los líderes con lo recibido por el comité y cerrar diferencias.',
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
WHERE   per."per_codigo" = 'finance.audit'
        AND rol."rol_codigo" IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'FINANCE')
ON CONFLICT ("rxp_rol", "rxp_permiso") DO NOTHING;
